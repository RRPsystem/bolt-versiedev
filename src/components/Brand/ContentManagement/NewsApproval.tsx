import React, { useState, useEffect } from 'react';
import { Newspaper, Eye, Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { generateBuilderJWT, generateBuilderDeeplink } from '../../../lib/jwtHelper';

interface NewsAssignment {
  id: string;
  news_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'mandatory' | 'brand';
  is_published: boolean;
  assigned_at: string;
  page_id?: string;
  news_item: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    featured_image: string;
    is_mandatory: boolean;
    published_at: string;
  };
}

export function NewsApproval() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<NewsAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignments();
  }, [user]);

  const loadAssignments = async () => {
    if (!user?.brand_id) return;

    try {
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('news_brand_assignments')
        .select(`
          id,
          news_id,
          status,
          is_published,
          assigned_at,
          news_items!inner (
            id,
            title,
            slug,
            excerpt,
            featured_image,
            is_mandatory,
            published_at
          )
        `)
        .eq('brand_id', user.brand_id)
        .order('assigned_at', { ascending: false });

      if (assignmentError) throw assignmentError;

      const formattedAssignments = (assignmentData || []).map(item => ({
        id: item.id,
        news_id: item.news_id,
        status: item.status,
        is_published: item.is_published || false,
        assigned_at: item.assigned_at,
        news_item: Array.isArray(item.news_items) ? item.news_items[0] : item.news_items
      }));

      const { data: brandNewsItems, error: newsItemsError } = await supabase
        .from('news_items')
        .select('id, title, slug, excerpt, featured_image, is_mandatory, published_at, created_at')
        .eq('author_type', 'brand')
        .eq('brand_id', user.brand_id)
        .order('created_at', { ascending: false });

      if (newsItemsError) throw newsItemsError;

      const { data: brandPagesData, error: pagesError } = await supabase
        .from('pages')
        .select('id, title, slug, created_at, published_at, status')
        .eq('content_type', 'news')
        .eq('brand_id', user.brand_id)
        .order('created_at', { ascending: false });

      if (pagesError) throw pagesError;

      const formattedNewsItems = (brandNewsItems || []).map(item => ({
        id: `brand-item-${item.id}`,
        news_id: item.id,
        status: 'brand' as const,
        is_published: true,
        assigned_at: item.created_at,
        news_item: item
      }));

      const formattedPagesNews = (brandPagesData || []).map(item => ({
        id: `brand-page-${item.id}`,
        news_id: item.id,
        page_id: item.id,
        status: 'brand' as const,
        is_published: item.status === 'published',
        assigned_at: item.created_at,
        news_item: {
          id: item.id,
          title: item.title,
          slug: item.slug,
          excerpt: '',
          featured_image: '',
          is_mandatory: false,
          published_at: item.published_at
        }
      }));

      const formattedBrandNews = [...formattedNewsItems, ...formattedPagesNews];

      const allNews = [...formattedAssignments, ...formattedBrandNews].sort((a, b) =>
        new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime()
      );

      setAssignments(allNews);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (assignmentId: string, currentValue: boolean, assignment: NewsAssignment) => {
    try {
      if (assignment.status === 'brand' && assignment.page_id) {
        const { error } = await supabase
          .from('pages')
          .update({ status: !currentValue ? 'published' : 'draft' })
          .eq('id', assignment.page_id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('news_brand_assignments')
          .update({
            is_published: !currentValue,
            status: !currentValue ? 'accepted' : 'pending'
          })
          .eq('id', assignmentId);

        if (error) throw error;
      }
      await loadAssignments();
    } catch (error) {
      console.error('Error toggling publish:', error);
      alert('Failed to update');
    }
  };

  const handleToggleApprove = async (assignmentId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';

      const { error } = await supabase
        .from('news_brand_assignments')
        .update({
          status: newStatus,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (error) throw error;
      loadAssignments();
    } catch (error) {
      console.error('Error toggling approval:', error);
      alert('Failed to update');
    }
  };

  const openPreview = (slug: string) => {
    window.open(`/preview/news/${slug}`, '_blank');
  };

  const handleEdit = async (assignment: NewsAssignment) => {
    if (!user?.brand_id || !user?.id || !assignment.page_id) return;

    try {
      const token = await generateBuilderJWT(user.brand_id, user.id);
      const deeplink = generateBuilderDeeplink(user.brand_id, token, { pageId: assignment.page_id });
      window.open(deeplink, '_blank');
    } catch (error) {
      console.error('Error opening builder:', error);
      alert('Kon de website builder niet openen');
    }
  };

  const handleDelete = async (assignment: NewsAssignment) => {
    if (!assignment.page_id) return;

    if (!confirm(`Weet je zeker dat je "${assignment.news_item.title}" wilt verwijderen?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', assignment.page_id);

      if (error) throw error;
      await loadAssignments();
    } catch (error) {
      console.error('Error deleting page:', error);
      alert('Failed to delete');
    }
  };

  const createNewArticle = async () => {
    if (!user?.brand_id || !user?.id) return;

    try {
      const token = await generateBuilderJWT(user.brand_id, user.id);
      const deeplink = generateBuilderDeeplink(user.brand_id, token, { contentType: 'news' });
      window.open(deeplink, '_blank');
    } catch (error) {
      console.error('Error opening builder:', error);
      alert('Kon de website builder niet openen');
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Newspaper className="w-8 h-8 text-orange-600" />
          <h1 className="text-2xl font-bold">Nieuwsbeheer</h1>
        </div>
        <button
          onClick={createNewArticle}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nieuw Bericht
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Publiceren</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acties</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {assignments.map((assignment) => (
              <tr key={assignment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{assignment.news_item.title}</div>
                  <div className="text-sm text-gray-500">{assignment.news_item.slug}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(assignment.assigned_at).toLocaleDateString('nl-NL')}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    assignment.status === 'mandatory' ? 'bg-red-100 text-red-800' :
                    assignment.status === 'brand' ? 'bg-purple-100 text-purple-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {assignment.status === 'mandatory' ? 'Verplicht' :
                     assignment.status === 'brand' ? 'Eigen Nieuws' :
                     'Optioneel'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {assignment.status === 'mandatory' ? (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="relative inline-flex h-6 w-11 items-center rounded-full bg-green-500 opacity-75 cursor-not-allowed"
                        disabled={true}
                        title="Verplichte nieuwsberichten zijn altijd gepubliceerd"
                      >
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleTogglePublish(assignment.id, assignment.is_published, assignment)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        assignment.is_published ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          assignment.is_published ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => openPreview(assignment.news_item.slug)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {assignment.status === 'brand' && assignment.page_id && (
                      <>
                        <button
                          onClick={() => handleEdit(assignment)}
                          className="text-orange-600 hover:text-orange-800"
                          title="Bewerken"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(assignment)}
                          className="text-red-600 hover:text-red-800"
                          title="Verwijderen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {assignments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Geen nieuwsberichten beschikbaar
          </div>
        )}
      </div>
    </div>
  );
}
