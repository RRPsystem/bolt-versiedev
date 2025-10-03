import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export function PreviewPage() {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadPage = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const pageId = params.get('page_id');

        if (!pageId) {
          setError('Geen pagina ID opgegeven');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('pages')
          .select('body_html, status')
          .eq('id', pageId)
          .single();

        if (error) throw error;

        if (!data.body_html) {
          setError('Deze pagina heeft nog geen gepubliceerde inhoud');
          setLoading(false);
          return;
        }

        setHtml(data.body_html);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Fout bij laden van pagina');
        setLoading(false);
      }
    };

    loadPage();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Pagina laden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div dangerouslySetInnerHTML={{ __html: html }} />
  );
}

export default PreviewPage;
