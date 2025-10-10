import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Copy, ExternalLink, RefreshCw } from 'lucide-react';

interface Page {
  id: string;
  slug: string;
  title: string;
  brand_id: string;
}

export default function DeeplinkTester() {
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [deeplinkUrl, setDeeplinkUrl] = useState<string>('');
  const [jwtToken, setJwtToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    const { data } = await supabase
      .from('pages')
      .select('id, slug, title, brand_id')
      .limit(10);

    if (data) setPages(data);
  };

  const generateDeeplink = async (page: Page) => {
    setLoading(true);
    setSelectedPage(page);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('You must be logged in to generate deeplinks');
        setLoading(false);
        return;
      }

      const jwtResponse = await fetch(`${supabaseUrl}/functions/v1/generate-builder-jwt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!jwtResponse.ok) {
        const errorData = await jwtResponse.json();
        throw new Error(errorData.error || 'Failed to generate JWT');
      }

      const jwtData = await jwtResponse.json();
      const token = jwtData.token;
      setJwtToken(token);

      const url = `https://www.ai-webbuilder.studio/index.html?brand_id=${page.brand_id}&page_id=${page.id}&slug=${page.slug}&jwt=${token}&deeplink=${encodeURIComponent(supabaseUrl)}/functions/v1/wbctx-serve`;

      setDeeplinkUrl(url);
    } catch (error) {
      console.error('Error generating deeplink:', error);
      alert('Error generating deeplink. Check console.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(deeplinkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openInBuilder = () => {
    window.open(deeplinkUrl, '_blank');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Deeplink Tester</h2>
        <p className="text-gray-600">Generate working deeplink URLs for external builder</p>
      </div>

      <div className="grid gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">Step 1: Select a Page</h3>
          <div className="space-y-2">
            {pages.map(page => (
              <button
                key={page.id}
                onClick={() => generateDeeplink(page)}
                disabled={loading}
                className={`w-full text-left p-3 rounded border transition-colors ${
                  selectedPage?.id === page.id
                    ? 'bg-blue-50 border-blue-500'
                    : 'hover:bg-gray-50 border-gray-200'
                } disabled:opacity-50`}
              >
                <div className="font-medium">{page.title}</div>
                <div className="text-sm text-gray-500">Slug: {page.slug}</div>
              </button>
            ))}
          </div>
          <button
            onClick={loadPages}
            className="mt-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Pages
          </button>
        </div>

        {deeplinkUrl && (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Step 2: Complete Deeplink URL</h3>
              <div className="bg-gray-50 p-4 rounded border border-gray-200 font-mono text-sm break-all">
                {deeplinkUrl}
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied!' : 'Copy URL'}
                </button>
                <button
                  onClick={openInBuilder}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in Builder
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Debug Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Page ID:</span>
                  <code className="ml-2 bg-gray-100 px-2 py-1 rounded">{selectedPage?.id}</code>
                </div>
                <div>
                  <span className="font-medium">Slug:</span>
                  <code className="ml-2 bg-gray-100 px-2 py-1 rounded">{selectedPage?.slug}</code>
                </div>
                <div>
                  <span className="font-medium">Brand ID:</span>
                  <code className="ml-2 bg-gray-100 px-2 py-1 rounded">{selectedPage?.brand_id}</code>
                </div>
                <div>
                  <span className="font-medium">JWT Token:</span>
                  <div className="mt-1 bg-gray-100 p-2 rounded break-all font-mono text-xs">
                    {jwtToken}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">Expected Parameters in Builder:</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>✓ brand_id = {selectedPage?.brand_id}</li>
                <li>✓ page_id = {selectedPage?.id}</li>
                <li>✓ slug = {selectedPage?.slug}</li>
                <li>✓ jwt = [valid token with scopes]</li>
                <li>✓ deeplink = [edge function URL]</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
