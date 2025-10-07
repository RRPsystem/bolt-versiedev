import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { generateBuilderJWT, generateBuilderDeeplink } from '../../../lib/jwtHelper';
import { Plus, Edit, Trash2, Eye, ExternalLink } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  content: any;
  status: string;
  created_at: string;
  updated_at: string;
  author_type?: 'admin' | 'brand';
  is_mandatory?: boolean;
}

export function NewsItemsView() {
  const { user } = useAuth();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.brand_id) {
      loadNewsItems();
    }
  }, [user?.brand_id]);

  const loadNewsItems = async () => {
    if (!user?.brand_id) return;

    try {
      setLoading(true);

      const token = await generateBuilderJWT(user.brand_id, user.id, ['content:read']);
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/content-api/list?type=news_items&brand_id=${user.brand_id}&include_assigned=true`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load news items');
      }

      const data = await response.json();
      setNewsItems(data.items || []);
    } catch (err) {
      console.error('Error loading news items:', err);
      setError(err instanceof Error ? err.message : 'Failed to load news items');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    if (!user?.brand_id || !user?.id) return;

    try {
      const token = await generateBuilderJWT(user.brand_id, user.id, ['content:read', 'content:write']);
      const builderBaseUrl = 'https://www.ai-websitestudio.nl/index.html';
      const apiBaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const deeplink = `${builderBaseUrl}?api=${encodeURIComponent(apiBaseUrl)}&apikey=${encodeURIComponent(apiKey)}&brand_id=${user.brand_id}&token=${token}&author_type=brand&author_id=${user.id}#/mode/news`;

      window.open(deeplink, '_blank');
    } catch (err) {
      console.error('Error generating deeplink:', err);
      alert('Failed to generate builder link');
    }
  };

  const handleEdit = async (newsItem: NewsItem) => {
    if (!user?.brand_id || !user?.id) return;

    try {
      const token = await generateBuilderJWT(user.brand_id, user.id, ['content:read', 'content:write']);
      const builderBaseUrl = 'https://www.ai-websitestudio.nl/index.html';
      const apiBaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const deeplink = `${builderBaseUrl}?api=${encodeURIComponent(apiBaseUrl)}&apikey=${encodeURIComponent(apiKey)}&brand_id=${user.brand_id}&token=${token}&news_slug=${newsItem.slug}&author_type=brand&author_id=${user.id}#/mode/news`;

      window.open(deeplink, '_blank');
    } catch (err) {
      console.error('Error generating deeplink:', err);
      alert('Failed to generate builder link');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.brand_id || !confirm('Weet je zeker dat je dit nieuwsbericht wilt verwijderen?')) return;

    try {
      const token = await generateBuilderJWT(user.brand_id, user.id, ['content:read', 'content:write']);
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/content-api/${id}?type=news_items`;

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete news item');
      }

      await loadNewsItems();
    } catch (err) {
      console.error('Error deleting news item:', err);
      alert('Failed to delete news item');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nieuwsberichten</h2>
          <p className="text-gray-600 mt-1">Beheer nieuwsberichten voor je website</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center space-x-2 px-4 py-2 text-white rounded-lg hover:bg-orange-700 transition-colors"
          style={{ backgroundColor: '#ff7700' }}
        >
          <Plus size={20} />
          <span>Nieuw Bericht</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {newsItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="w-16 h-16 mx-auto mb-4 rounded-lg flex items-center justify-center bg-gray-100">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Geen nieuwsberichten</h3>
          <p className="text-gray-600 mb-4">Begin met het toevoegen van je eerste nieuwsbericht</p>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center space-x-2 px-4 py-2 text-white rounded-lg hover:bg-orange-700 transition-colors"
            style={{ backgroundColor: '#ff7700' }}
          >
            <Plus size={20} />
            <span>Nieuw Bericht</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {newsItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.status === 'published' ? 'Gepubliceerd' : 'Concept'}
                    </span>
                    {item.author_type === 'admin' && (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        Van Admin
                      </span>
                    )}
                    {item.is_mandatory && (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                        Verplicht
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Slug: {item.slug}</p>
                  <p className="text-xs text-gray-500">
                    Laatst bijgewerkt: {new Date(item.updated_at).toLocaleDateString('nl-NL')}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {item.author_type === 'brand' && (
                    <>
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                        title="Bewerken in Builder"
                      >
                        <ExternalLink size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Verwijderen"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                  {item.author_type === 'admin' && (
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Bekijken"
                    >
                      <Eye size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
