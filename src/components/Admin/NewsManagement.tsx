import React, { useState, useEffect } from 'react';
import { Newspaper, Plus, Edit2, Trash2, Send, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string;
  status: 'draft' | 'published';
  author_type: 'admin' | 'brand';
  is_mandatory: boolean;
  target_type: 'all_brands' | 'franchise' | 'custom_brand';
  published_at: string;
  created_at: string;
}

interface Brand {
  id: string;
  name: string;
  type: 'franchise' | 'custom';
}

export function NewsManagement() {
  const { user } = useAuth();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    target_type: 'all_brands' as 'all_brands' | 'franchise' | 'custom_brand',
    is_mandatory: false,
    selected_brands: [] as string[]
  });

  useEffect(() => {
    loadNewsItems();
    loadBrands();
  }, []);

  const loadNewsItems = async () => {
    try {
      const { data, error } = await supabase
        .from('news_items')
        .select('*')
        .eq('author_type', 'admin')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNewsItems(data || []);
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, type')
        .order('name');

      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error('Error loading brands:', error);
    }
  };

  const handleCreateNews = () => {
    setSelectedNews(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      target_type: 'all_brands',
      is_mandatory: false,
      selected_brands: []
    });
    setShowModal(true);
  };

  const handleEditNews = (news: NewsItem) => {
    setSelectedNews(news);
    setFormData({
      title: news.title,
      slug: news.slug,
      excerpt: news.excerpt || '',
      target_type: news.target_type,
      is_mandatory: news.is_mandatory,
      selected_brands: []
    });
    setShowModal(true);
  };

  const handleSaveNews = async () => {
    try {
      const newsData = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        author_id: user?.id,
        author_type: 'admin',
        target_type: formData.target_type,
        is_mandatory: formData.is_mandatory,
        status: 'draft'
      };

      if (selectedNews) {
        const { error } = await supabase
          .from('news_items')
          .update(newsData)
          .eq('id', selectedNews.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('news_items')
          .insert([newsData]);

        if (error) throw error;
      }

      setShowModal(false);
      loadNewsItems();
    } catch (error) {
      console.error('Error saving news:', error);
      alert('Failed to save news item');
    }
  };

  const handleDistribute = async (news: NewsItem) => {
    setSelectedNews(news);
    setFormData({
      ...formData,
      target_type: news.target_type,
      is_mandatory: news.is_mandatory,
      selected_brands: []
    });
    setShowDistributeModal(true);
  };

  const handleDistributeToSave = async () => {
    if (!selectedNews) return;

    try {
      let targetBrands: string[] = [];

      if (formData.target_type === 'all_brands') {
        targetBrands = brands.map(b => b.id);
      } else if (formData.target_type === 'franchise') {
        targetBrands = brands.filter(b => b.type === 'franchise').map(b => b.id);
      } else {
        targetBrands = formData.selected_brands;
      }

      const assignments = targetBrands.map(brandId => ({
        news_id: selectedNews.id,
        brand_id: brandId,
        status: formData.is_mandatory ? 'mandatory' : 'pending'
      }));

      const { error: assignError } = await supabase
        .from('news_brand_assignments')
        .upsert(assignments, { onConflict: 'news_id,brand_id' });

      if (assignError) throw assignError;

      const { error: updateError } = await supabase
        .from('news_items')
        .update({
          target_type: formData.target_type,
          is_mandatory: formData.is_mandatory,
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', selectedNews.id);

      if (updateError) throw updateError;

      setShowDistributeModal(false);
      loadNewsItems();
      alert(`News distributed to ${targetBrands.length} brand(s)`);
    } catch (error) {
      console.error('Error distributing news:', error);
      alert('Failed to distribute news');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this news item?')) return;

    try {
      const { error } = await supabase
        .from('news_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadNewsItems();
    } catch (error) {
      console.error('Error deleting news:', error);
      alert('Failed to delete news item');
    }
  };

  const openInBuilder = (newsId?: string) => {
    const builderUrl = import.meta.env.VITE_BUILDER_URL || 'https://windsurfer.builder';
    const jwtToken = localStorage.getItem('builder_jwt');

    if (newsId) {
      window.open(`${builderUrl}?jwt=${jwtToken}&content_type=news&content_id=${newsId}`, '_blank');
    } else {
      window.open(`${builderUrl}?jwt=${jwtToken}&content_type=news&mode=create`, '_blank');
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
          <h1 className="text-2xl font-bold">Admin News Management</h1>
        </div>
        <button
          onClick={handleCreateNews}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
        >
          <Plus className="w-5 h-5" />
          Create News
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {newsItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{item.title}</div>
                  <div className="text-sm text-gray-500">{item.slug}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm">
                    {item.target_type === 'all_brands' && 'All Brands'}
                    {item.target_type === 'franchise' && 'Franchise Only'}
                    {item.target_type === 'custom_brand' && 'Custom Brands'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    item.is_mandatory ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {item.is_mandatory ? 'Mandatory' : 'Optional'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    item.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openInBuilder(item.id)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit in Builder"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {item.status === 'draft' && (
                      <button
                        onClick={() => handleDistribute(item)}
                        className="text-green-600 hover:text-green-800"
                        title="Distribute to Brands"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {newsItems.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No news items yet. Create your first one!
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {selectedNews ? 'Edit News' : 'Create News'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Excerpt
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNews}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                Save & Continue in Builder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Distribute Modal */}
      {showDistributeModal && selectedNews && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Distribute News</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Audience
                </label>
                <select
                  value={formData.target_type}
                  onChange={(e) => setFormData({ ...formData, target_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="all_brands">All Brands</option>
                  <option value="franchise">Franchise Only</option>
                  <option value="custom_brand">Specific Brands</option>
                </select>
              </div>

              {formData.target_type === 'custom_brand' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Brands
                  </label>
                  <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
                    {brands.map((brand) => (
                      <label key={brand.id} className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          checked={formData.selected_brands.includes(brand.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                selected_brands: [...formData.selected_brands, brand.id]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                selected_brands: formData.selected_brands.filter(id => id !== brand.id)
                              });
                            }
                          }}
                        />
                        <span>{brand.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_mandatory}
                  onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
                  id="is_mandatory"
                />
                <label htmlFor="is_mandatory" className="text-sm font-medium text-gray-700">
                  Mandatory (brands must show this news)
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowDistributeModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDistributeToSave}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Distribute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
