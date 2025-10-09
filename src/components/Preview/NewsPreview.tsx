import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, User } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  content: any;
  excerpt: string;
  featured_image: string;
  status: string;
  published_at: string;
  author_type: string;
  created_at: string;
}

export function NewsPreview() {
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadNews = async () => {
      try {
        const pathMatch = window.location.pathname.match(/^\/preview\/news\/(.+)$/);

        if (!pathMatch) {
          setError('Ongeldige preview URL');
          setLoading(false);
          return;
        }

        const slug = pathMatch[1];

        const { data, error: fetchError } = await supabase
          .from('news_items')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!data) {
          setError('Nieuwsartikel niet gevonden');
          setLoading(false);
          return;
        }

        setNewsItem(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Fout bij laden van nieuwsartikel');
        setLoading(false);
      }
    };

    loadNews();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
          <p className="text-gray-600">Nieuwsartikel laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Sluit Preview
          </button>
        </div>
      </div>
    );
  }

  if (!newsItem) {
    return null;
  }

  const renderContent = () => {
    if (!newsItem.content) {
      return (
        <div className="text-gray-500 italic">
          Geen content beschikbaar. Dit artikel moet nog bewerkt worden.
        </div>
      );
    }

    if (typeof newsItem.content === 'string') {
      return <div dangerouslySetInnerHTML={{ __html: newsItem.content }} />;
    }

    if (newsItem.content.html) {
      return <div dangerouslySetInnerHTML={{ __html: newsItem.content.html }} />;
    }

    return (
      <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
        {JSON.stringify(newsItem.content, null, 2)}
      </pre>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-600">PREVIEW MODE</span>
            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
              newsItem.status === 'published'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {newsItem.status === 'published' ? 'Gepubliceerd' : 'Concept'}
            </span>
          </div>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Sluit Preview
          </button>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-6 py-12">
        {newsItem.featured_image && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={newsItem.featured_image}
              alt={newsItem.title}
              className="w-full h-auto"
            />
          </div>
        )}

        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {newsItem.title}
          </h1>

          {newsItem.excerpt && (
            <p className="text-xl text-gray-600 mb-6">
              {newsItem.excerpt}
            </p>
          )}

          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Calendar size={16} />
              <span>
                {new Date(newsItem.published_at || newsItem.created_at).toLocaleDateString('nl-NL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <User size={16} />
              <span>
                {newsItem.author_type === 'admin' ? 'Admin' : 'Brand'}
              </span>
            </div>
          </div>
        </header>

        <div className="prose prose-lg max-w-none">
          {renderContent()}
        </div>
      </article>

      <div className="max-w-4xl mx-auto px-6 py-8 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div>
            Slug: <code className="bg-gray-100 px-2 py-1 rounded">{newsItem.slug}</code>
          </div>
          <div>
            ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{newsItem.id}</code>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewsPreview;
