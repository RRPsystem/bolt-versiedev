import React, { useState, useEffect } from 'react';
import { ExternalLink, Pencil as Edit, Copy, Trash2, Eye, Plus, RefreshCw, Upload, FileX } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { generateBuilderJWT, generateBuilderDeeplink } from '../../../lib/jwtHelper';
import { useAuth } from '../../../contexts/AuthContext';

interface Page {
  id: string;
  title: string;
  slug: string;
  status: string;
  updated_at: string;
  published_at: string | null;
  body_html?: string;
  show_in_menu: boolean;
  menu_order: number;
  parent_slug: string | null;
}

interface Props {
  brandId?: string;
  hideCreateButtons?: boolean;
}

export function PageManagementView({ brandId: propBrandId, hideCreateButtons = false }: Props = {}) {
  const { user } = useAuth();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandId, setBrandId] = useState<string>('');
  const [brandSlug, setBrandSlug] = useState<string>('');

  useEffect(() => {
    loadBrandAndPages();
  }, [user, propBrandId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && brandId) {
        console.log('Tab became visible, reloading pages...');
        setTimeout(() => loadPages(brandId, false), 500);
      }
    };

    const handleHashChange = () => {
      if (window.location.hash.includes('/brand/website/pages') && brandId) {
        console.log('Hash change detected, reloading pages...');
        setTimeout(() => loadPages(brandId, false), 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('hashchange', handleHashChange);

    if (window.location.hash.includes('/brand/website/pages') && brandId) {
      console.log('Initial hash detection, reloading pages...');
      setTimeout(() => loadPages(brandId, false), 1000);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [brandId]);

  const loadBrandAndPages = async () => {
    if (!user) return;

    if (!supabase) {
      console.error('Supabase not configured');
      setLoading(false);
      return;
    }

    try {
      if (propBrandId) {
        const { data: brand } = await supabase
          .from('brands')
          .select('id, slug')
          .eq('id', propBrandId)
          .single();

        if (brand) {
          setBrandId(brand.id);
          setBrandSlug(brand.slug);
          await loadPages(brand.id);
        }
      } else {
        const { data: userData } = await supabase
          .from('users')
          .select('brand_id, brands(slug)')
          .eq('id', user.id)
          .single();

        if (userData?.brand_id) {
          setBrandId(userData.brand_id);
          setBrandSlug(userData.brands?.slug || '');
          await loadPages(userData.brand_id);
        }
      }
    } catch (error) {
      console.error('Error loading brand:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPages = async (brandId: string, showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pages-api?brand_id=${brandId}`;

      const response = await fetch(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load pages:', response.status, errorData);
        throw new Error('Failed to load pages');
      }

      const data = await response.json();
      setPages(data.items || []);
    } catch (error) {
      console.error('Error loading pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const openInBuilder = async (pageId: string) => {
    console.log('[openInBuilder] Called with pageId:', pageId);
    console.log('[openInBuilder] user:', user);
    console.log('[openInBuilder] brandId:', brandId);

    if (!user || !brandId) {
      console.error('Missing user or brandId:', { user, brandId });
      alert('Gebruiker of brand ID ontbreekt');
      return;
    }

    try {
      console.log('Opening builder for page:', pageId);
      console.log('Brand ID:', brandId, 'User ID:', user.id);

      const returnUrl = `${window.location.origin}/#/brand/website/pages`;
      const page = pages.find(p => p.id === pageId);
      const jwtResponse = await generateBuilderJWT(brandId, user.id, undefined, {
        pageId,
        slug: page?.slug || '',
        forceBrandId: true,
        returnUrl: returnUrl,
      });
      console.log('Token generated successfully');

      if (jwtResponse.url) {
        console.log('[openInBuilder] Using URL:', jwtResponse.url);
        window.open(jwtResponse.url, '_blank');
      } else {
        const builderBaseUrl = 'https://www.ai-websitestudio.nl';
        const apiBaseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
        const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const encodedReturnUrl = encodeURIComponent(returnUrl.replace('#', '%23'));
        const deeplink = `${builderBaseUrl}/?api=${encodeURIComponent(apiBaseUrl)}&brand_id=${brandId}&token=${jwtResponse.token}&apikey=${encodeURIComponent(apiKey)}&page_id=${pageId}&return_url=${encodedReturnUrl}#/mode/page`;
        console.log('[openInBuilder] Generated deeplink:', deeplink);
        console.log('[openInBuilder] Deeplink params:', {
          api: apiBaseUrl,
          brand_id: brandId,
          page_id: pageId,
          return_url: returnUrl,
          token_length: jwtResponse.token.length
        });
        const newWindow = window.open(deeplink, '_blank');
        if (!newWindow) {
          alert('Popup geblokkeerd! Sta popups toe voor deze website.');
        }
      }
    } catch (error) {
      console.error('Error generating deeplink:', error);
      alert('Kon de website builder niet openen: ' + error);
    }
  };

  const createNewPage = async () => {
    if (!user || !brandId) return;

    try {
      const returnUrl = `${window.location.origin}/#/brand/website/pages`;
      const jwtResponse = await generateBuilderJWT(brandId, user.id, undefined, {
        forceBrandId: true,
        returnUrl: returnUrl,
      });
      if (jwtResponse.url) {
        window.open(jwtResponse.url, '_blank');
      } else {
        const builderBaseUrl = 'https://www.ai-websitestudio.nl';
        const apiBaseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
        const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const encodedReturnUrl = encodeURIComponent(returnUrl.replace('#', '%23'));
        const deeplink = `${builderBaseUrl}/?api=${encodeURIComponent(apiBaseUrl)}&brand_id=${brandId}&token=${jwtResponse.token}&apikey=${encodeURIComponent(apiKey)}&return_url=${encodedReturnUrl}#/mode/page`;
        window.open(deeplink, '_blank');
      }
    } catch (error) {
      console.error('Error generating deeplink:', error);
    }
  };

  const duplicatePage = async (pageId: string) => {
    try {
      const { data: originalPage } = await supabase
        .from('pages')
        .select('*')
        .eq('id', pageId)
        .single();

      if (originalPage) {
        await supabase.from('pages').insert({
          brand_id: originalPage.brand_id,
          owner_user_id: originalPage.owner_user_id,
          title: `${originalPage.title} (kopie)`,
          slug: `${originalPage.slug}-copy-${Date.now()}`,
          status: 'draft',
          content_json: originalPage.content_json,
        });

        await loadPages(brandId);
      }
    } catch (error) {
      console.error('Error duplicating page:', error);
    }
  };

  const deletePage = async (pageId: string) => {
    if (!user || !brandId) return;

    try {
      const jwtResponse = await generateBuilderJWT(brandId, user.id, undefined, {
        forceBrandId: true,
      });
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pages-api/${pageId}`;

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${jwtResponse.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete failed:', errorText);
        throw new Error('Failed to delete page');
      }

      await loadPages(brandId);
    } catch (error) {
      console.error('Error deleting page:', error);
    }
  };

  const publishPage = async (pageId: string, pageSlug: string) => {
    try {
      const jwtResponse = await generateBuilderJWT(brandId, user!.id, undefined, {
        forceBrandId: true,
      });
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pages-api/publish`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtResponse.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brand_id: brandId,
          page_id: pageId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish page');
      }

      await loadPages(brandId, false);
    } catch (error) {
      console.error('Error publishing page:', error);
    }
  };

  const unpublishPage = async (pageId: string) => {
    if (!confirm('Weet je zeker dat je deze pagina wilt depubliceren?')) return;

    try {
      await supabase
        .from('pages')
        .update({ status: 'draft' })
        .eq('id', pageId);

      await loadPages(brandId, false);
    } catch (error) {
      console.error('Error unpublishing page:', error);
    }
  };

  const toggleShowInMenu = async (pageId: string, currentValue: boolean) => {
    try {
      const jwtResponse = await generateBuilderJWT(brandId, user!.id, undefined, {
        forceBrandId: true,
      });
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pages-api/updateMenuSettings`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtResponse.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_id: pageId,
          show_in_menu: !currentValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update menu settings');
      }

      await loadPages(brandId, false);
    } catch (error) {
      console.error('Error updating menu settings:', error);
    }
  };

  const testSaveAPI = async () => {
    if (!brandId || !user) {
      alert('Brand ID of gebruiker ontbreekt');
      return;
    }

    try {
      console.log('[TEST] Testing save API...');
      const jwtResponse = await generateBuilderJWT(brandId, user.id, undefined, { forceBrandId: true });
      console.log('[TEST] JWT token generated');

      const testData = {
        brand_id: brandId,
        title: 'Test Pagina ' + Date.now(),
        slug: 'test-' + Date.now(),
        content_json: { test: true, created: new Date().toISOString() }
      };

      console.log('[TEST] Sending test save request:', testData);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pages-api/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtResponse.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });

      const result = await response.json();
      console.log('[TEST] Save response:', { status: response.status, result });

      if (response.ok) {
        alert('✅ Test save succesvol! Page ID: ' + result.page_id);
        await loadPages(brandId, false);
      } else {
        alert('❌ Test save mislukt: ' + JSON.stringify(result));
      }
    } catch (error) {
      console.error('[TEST] Test save error:', error);
      alert('❌ Test save error: ' + error.message);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-end mb-8 space-x-3">
        <button
          onClick={testSaveAPI}
          className="inline-flex items-center space-x-2 px-4 py-3 bg-purple-100 text-purple-700 rounded-lg font-medium transition-colors hover:bg-purple-200"
          title="Test Save API"
        >
          <span>🧪 Test Save</span>
        </button>
        <button
          onClick={() => loadPages(brandId, false)}
          className="inline-flex items-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors hover:bg-gray-200"
          title="Ververs pagina's"
        >
          <RefreshCw size={20} />
          <span>Ververs</span>
        </button>
        {!hideCreateButtons && (
          <button
            onClick={createNewPage}
            className="inline-flex items-center space-x-2 px-6 py-3 text-white rounded-lg font-medium transition-colors hover:bg-blue-700"
            style={{ backgroundColor: '#0ea5e9' }}
          >
            <Plus size={20} />
            <span>Nieuwe Pagina</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Pagina's laden...</p>
        </div>
      ) : pages.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-600 mb-4">Je hebt nog geen pagina's aangemaakt</p>
          {!hideCreateButtons && (
            <button
              onClick={createNewPage}
              className="inline-flex items-center space-x-2 px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-medium transition-colors hover:bg-blue-50"
            >
              <Plus size={20} />
              <span>Maak je eerste pagina</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Titel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  In Menu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Laatst gepubliceerd
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{page.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{page.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        page.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : page.status === 'review'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {page.status === 'published' ? 'Gepubliceerd' : page.status === 'review' ? 'Review' : 'Concept'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => toggleShowInMenu(page.id, page.show_in_menu)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        page.show_in_menu
                          ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={page.show_in_menu ? 'Verberg in menu' : 'Toon in menu'}
                    >
                      {page.show_in_menu ? 'Ja' : 'Nee'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(page.published_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openInBuilder(page.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Openen in Builder"
                      >
                        <Edit size={18} />
                      </button>
                      {page.status === 'published' ? (
                        <>
                          <button
                            onClick={() => window.open(`/preview?brand_id=${brandId}&slug=${page.slug}`, '_blank')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Preview"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => unpublishPage(page.id)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Depubliceren"
                          >
                            <FileX size={18} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => publishPage(page.id, page.slug)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Publiceren"
                        >
                          <Upload size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => duplicatePage(page.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Dupliceren"
                      >
                        <Copy size={18} />
                      </button>
                      <button
                        onClick={() => deletePage(page.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Verwijderen"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PageManagementView;
