import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, CreditCard as Edit, Trash2, ArrowLeft, Upload, X, Tag } from 'lucide-react';
import { db, supabase } from '../../lib/supabase';
import { SlidingMediaSelector } from '../shared/SlidingMediaSelector';

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  content: any;
  featured_image_url?: string;
  excerpt?: string;
  status: string;
  published_at?: string;
  brand_approved: boolean;
  brand_mandatory: boolean;
  website_visible: boolean;
  author_type: string;
  created_at: string;
  brands?: { name: string; slug: string };
}

export function ContentManagement() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewArticle, setShowNewArticle] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [newArticle, setNewArticle] = useState({
    title: '',
    author: '',
    summary: '',
    status: 'concept',
    content: '',
    featured_image_url: '',
    gallery_images: [] as string[]
  });
  const [articleTags, setArticleTags] = useState<string[]>([]);
  const [currentTagInput, setCurrentTagInput] = useState('');

  const resetForm = () => {
    setNewArticle({
      title: '',
      author: '',
      summary: '',
      status: 'concept',
      content: '',
      featured_image_url: '',
      gallery_images: []
    });
    setArticleTags([]);
    setCurrentTagInput('');
    setEditingArticle(null);
  };

  const handleNewArticleClick = () => {
    console.log('🆕 New article button clicked - resetting form completely');
    resetForm(); // Clear any existing editing state
    setShowNewArticle(true);
  };


  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    console.log('🔄 Loading articles...');
    try {
      // Try to load from Supabase, but fall back to mock data if it fails
      try {
        console.log('🔄 Attempting Supabase connection...');
        const data = await db.getNewsArticles();
        console.log('✅ Supabase data loaded:', data);
        // Filter only admin articles
        const adminArticles = (data || []).filter(article => article.author_type === 'admin');
        setArticles(adminArticles);
        console.log('📊 Admin articles filtered:', adminArticles.length);
      } catch (supabaseError) {
        console.log('⚠️ Supabase error, using mock data:', supabaseError);
        // Use mock data when Supabase is not available
        setArticles([
          {
            id: '1',
            title: 'test2',
            slug: 'test2',
            content: {},
            status: 'Brand Toegang',
            brand_approved: false,
            brand_mandatory: true,
            website_visible: false,
            author_type: 'admin',
            created_at: '2025-09-24',
            brands: { name: 'Admin', slug: 'admin' }
          },
          {
            id: '2',
            title: 'Admin vliegen',
            slug: 'admin-vliegen',
            content: {},
            status: 'Brand Toegang',
            brand_approved: true,
            brand_mandatory: true,
            website_visible: true,
            author_type: 'admin',
            created_at: '2025-09-24',
            brands: { name: 'Admin', slug: 'admin' }
          },
          {
            id: '3',
            title: 'Great Barrier Reef',
            slug: 'great-barrier-reef',
            content: {},
            status: 'Brand Toegang',
            brand_approved: true,
            brand_mandatory: true,
            website_visible: true,
            author_type: 'brand',
            created_at: '2025-09-23',
            brands: { name: 'Fleur', slug: 'fleur' }
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (imageUrl: string) => {
    if (newArticle.featured_image_url) {
      // Add to gallery if featured image already exists
      setNewArticle(prev => ({ 
        ...prev, 
        gallery_images: [...prev.gallery_images, imageUrl] 
      }));
    } else {
      // Set as featured image
      setNewArticle(prev => ({ ...prev, featured_image_url: imageUrl }));
    }
    setShowMediaSelector(false);
  };

  const handleTogglePublished = async (articleId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    console.log(`🔄 Toggling published status for ${articleId}: ${currentStatus} → ${newStatus}`);
    
    try {
      if (supabase) {
        const { error } = await supabase
          .from('news_articles')
          .update({ status: newStatus })
          .eq('id', articleId);
        
        if (error) throw error;
        console.log('✅ Status updated in Supabase');
      }
      
      // Update local state
      setArticles(prev => prev.map(article => 
        article.id === articleId 
          ? { ...article, status: newStatus }
          : article
      ));
    } catch (error) {
      console.error('❌ Error updating status:', error);
      alert(`Error updating status: ${error.message || error}`);
    }
  };

  const handleToggleBrandApproved = async (articleId: string, currentValue: boolean) => {
    console.log(`🔄 Toggling brand approved for ${articleId}: ${currentValue} → ${!currentValue}`);
    
    try {
      if (supabase) {
        const { error } = await supabase
          .from('news_articles')
          .update({ brand_approved: !currentValue })
          .eq('id', articleId);
        
        if (error) throw error;
        console.log('✅ Brand approved updated in Supabase');
      }
      
      // Update local state
      setArticles(prev => prev.map(article => 
        article.id === articleId 
          ? { ...article, brand_approved: !currentValue }
          : article
      ));
    } catch (error) {
      console.error('❌ Error updating brand approved:', error);
      alert(`Error updating brand approved: ${error.message || error}`);
    }
  };

  const handleToggleBrandMandatory = async (articleId: string, currentValue: boolean) => {
    console.log(`🔄 Toggling brand mandatory for ${articleId}: ${currentValue} → ${!currentValue}`);
    
    try {
      if (supabase) {
        const { error } = await supabase
          .from('news_articles')
          .update({ brand_mandatory: !currentValue })
          .eq('id', articleId);
        
        if (error) throw error;
        console.log('✅ Brand mandatory updated in Supabase');
      }
      
      // Update local state
      setArticles(prev => prev.map(article => 
        article.id === articleId 
          ? { ...article, brand_mandatory: !currentValue }
          : article
      ));
    } catch (error) {
      console.error('❌ Error updating brand mandatory:', error);
      alert(`Error updating brand mandatory: ${error.message || error}`);
    }
  };

  const handleToggleWebsiteVisible = async (articleId: string, currentValue: boolean) => {
    console.log(`🔄 Toggling website visible for ${articleId}: ${currentValue} → ${!currentValue}`);
    
    try {
      if (supabase) {
        const { error } = await supabase
          .from('news_articles')
          .update({ website_visible: !currentValue })
          .eq('id', articleId);
        
        if (error) throw error;
        console.log('✅ Website visible updated in Supabase');
      }
      
      // Update local state
      setArticles(prev => prev.map(article => 
        article.id === articleId 
          ? { ...article, website_visible: !currentValue }
          : article
      ));
    } catch (error) {
      console.error('❌ Error updating website visible:', error);
      alert(`Error updating website visible: ${error.message || error}`);
    }
  };

  const handleEditArticle = (articleId: string) => {
    console.log(`✏️ Edit article: ${articleId}`);
    const article = articles.find(a => a.id === articleId);
    if (article) {
      setEditingArticle(article);
      setNewArticle({
        title: article.title,
        author: 'Admin',
        summary: article.excerpt || '',
        status: article.status,
        content: typeof article.content === 'object' ? article.content.text || '' : article.content || '',
        featured_image_url: article.featured_image_url || '',
        gallery_images: typeof article.content === 'object' ? article.content.gallery_images || [] : []
      });
      setArticleTags(typeof article.content === 'object' ? (article.content.tags || []) : []);
      setShowNewArticle(true);
    }
  };

  const handleViewArticle = (articleId: string) => {
    console.log(`👁️ View article: ${articleId}`);
    alert(`View functionaliteit komt binnenkort! Article ID: ${articleId}`);
  };

  const handleSaveArticle = async () => {
    console.log('💾 Saving admin article:', newArticle, 'Editing:', !!editingArticle);
    
    if (!newArticle.title.trim()) {
      alert('Titel is verplicht!');
      return;
    }
    
    try {
      console.log('🔄 Starting save process...');
      console.log('📊 Supabase client available:', !!supabase);
      
      if (!supabase) {
        console.error('❌ Supabase client not available');
        alert('Supabase niet geconfigureerd - kan niet opslaan');
        return;
      }
      
      const tagsArray = articleTags;
      
      const articleData = {
        title: newArticle.title,
        slug: newArticle.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
        content: { 
          text: newArticle.content,
          gallery_images: newArticle.gallery_images,
          tags: tagsArray
        },
        featured_image_url: newArticle.featured_image_url,
        excerpt: newArticle.summary,
        status: newArticle.status,
        brand_approved: editingArticle ? editingArticle.brand_approved : false,
        brand_mandatory: editingArticle ? editingArticle.brand_mandatory : false,
        website_visible: editingArticle ? editingArticle.website_visible : false,
        author_type: 'admin',
        brand_id: null
      };
      
      console.log('📤 Sending to Supabase:', articleData);
      
      let data, error;
      
      if (editingArticle) {
        // Update existing article
        console.log('🔄 Updating existing article:', editingArticle.id);
        const result = await supabase
          .from('news_articles')
          .update(articleData)
          .eq('id', editingArticle.id)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        // Create new article
        console.log('🆕 Creating new article');
        const result = await supabase
          .from('news_articles')
          .insert([articleData])
          .select()
          .single();
        data = result.data;
        error = result.error;
      }
      
      if (error) {
        console.error('🚨 Supabase insert error:', error);
        console.error('🚨 Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setArticleTags('');
        alert(`Supabase insert error: ${error.message}\nDetails: ${error.details || 'None'}\nHint: ${error.hint || 'None'}`);
        return;
      }
      
      console.log('✅ Article saved to Supabase:', data);
      
      // Update local state
      if (editingArticle) {
        setArticles(prev => prev.map(article => 
          article.id === editingArticle.id ? { ...article, ...data } : article
        ));
      } else {
        setArticles(prev => [data, ...prev]);
      }
      
      // Reset form
      resetForm();
      setShowNewArticle(false);
      
      alert(editingArticle ? 'Artikel succesvol bijgewerkt!' : 'Artikel succesvol opgeslagen!');
      
    } catch (error) {
      console.error('❌ Error saving article:', error);
      alert(`Er is een fout opgetreden bij het opslaan: ${error instanceof Error ? error.message : String(error)}`);
    }
  };



  const updateArticleTitle = async (articleId: string, newTitle: string) => {
    console.log(`🔄 Updating article title: ${articleId} → ${newTitle}`);
    
    try {
      if (supabase) {
        const { error } = await supabase
          .from('news_articles')
          .update({ 
            title: newTitle,
            slug: newTitle.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
          })
          .eq('id', articleId);
        
        if (error) throw error;
        console.log('✅ Title updated in Supabase');
      }
      
      // Update local state
      setArticles(prev => prev.map(article => 
        article.id === articleId 
          ? { ...article, title: newTitle }
          : article
      ));
      
      alert('✅ Titel succesvol bijgewerkt!');
    } catch (error) {
      console.error('❌ Error updating title:', error);
      alert(`Error updating title: ${error.message || error}`);
    }
  };

  const handleDeleteArticle = async (articleId: string, articleTitle: string) => {
    if (!window.confirm(`🗑️ Weet je zeker dat je "${articleTitle}" wilt verwijderen?\n\n⚠️ Deze actie kan niet ongedaan worden gemaakt!`)) {
      return;
    }
    
    console.log(`🗑️ Deleting article: ${articleId}`);
    
    try {
      if (supabase) {
        console.log('🔄 Deleting from Supabase...');
        const { error } = await supabase
          .from('news_articles')
          .delete()
          .eq('id', articleId);
        
        if (error) {
          console.error('🚨 Supabase delete error:', error);
          throw error;
        }
        console.log('✅ Article deleted from Supabase');
      }
      
      // Update local state
      setArticles(prev => prev.filter(article => article.id !== articleId));
      console.log('✅ Article removed from local state');
      
      alert('✅ Artikel succesvol verwijderd!');
    } catch (error) {
      console.error('❌ Error deleting article:', error);
      alert(`❌ Error deleting article: ${error.message || error}`);
    }
  };

  if (showNewArticle) {
    return (
      <div className="flex-1 bg-gray-50">
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowNewArticle(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{editingArticle ? 'Artikel Bewerken' : 'Nieuw Bericht'}</h1>
              <p className="text-sm text-gray-600">{editingArticle ? 'Bewerk het geselecteerde artikel' : 'Maak een nieuw bericht aan voor publicatie'}</p>
            </div>
          </div>
        </div>

        <div className="p-6 max-w-4xl">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Bericht Informatie</h2>
              <p className="text-sm text-gray-600">Vul de basisinformatie voor het nieuwe bericht in</p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titel <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newArticle.title}
                  onChange={(e) => setNewArticle(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Voer de titel van het bericht in"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schrijver <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newArticle.author}
                  onChange={(e) => setNewArticle(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="Naam van de schrijver"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Samenvatting</label>
              <textarea
                value={newArticle.summary}
                onChange={(e) => setNewArticle(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="Korte samenvatting van het bericht"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={newArticle.status}
                onChange={(e) => setNewArticle(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="concept">Concept</option>
                <option value="review">Review</option>
                <option value="published">Gepubliceerd</option>
              </select>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Inhoud</h3>
              <p className="text-sm text-gray-600 mb-4">Schrijf de volledige inhoud van het bericht</p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bericht inhoud <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newArticle.content}
                  onChange={(e) => setNewArticle(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Schrijf hier de volledige inhoud van het bericht..."
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Media</h3>
              <p className="text-sm text-gray-600 mb-4">Voeg een hoofdafbeelding/video en galerij toe aan het bericht</p>
              
              {/* Featured Image */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Hoofdafbeelding/Video</label>
                {newArticle.featured_image_url ? (
                  <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden">
                    <img
                      src={newArticle.featured_image_url}
                      alt="Featured"
                      className="w-full h-80 object-cover"
                    />
                    <button
                      onClick={() => setNewArticle(prev => ({ ...prev, featured_image_url: '' }))}
                      className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">Hoofdafbeelding toevoegen</p>
                    <button
                      onClick={() => setShowMediaSelector(true)}
                      className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                    >
                      🖼️ Afbeelding Kiezen
                    </button>
                  </div>
                )}
              </div>

              {/* Gallery */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Galerij ({newArticle.gallery_images.length} afbeeldingen)</label>
                <div className="border border-gray-300 rounded-lg p-4">
                  {newArticle.gallery_images.length > 0 ? (
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      {newArticle.gallery_images.map((image, index) => (
                        <div key={index} className="relative aspect-square group">
                          <img 
                            src={image} 
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            onClick={() => setNewArticle(prev => ({
                              ...prev,
                              gallery_images: prev.gallery_images.filter((_, i) => i !== index)
                            }))}
                            className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-4 text-center py-8">Nog geen afbeeldingen toegevoegd aan de galerij</p>
                  )}
                  <button
                    onClick={() => setShowMediaSelector(true)}
                    className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    📸 Meer Afbeeldingen Toevoegen
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <Tag className="mr-2" size={20} />
                Tags
              </h3>
              <p className="text-sm text-gray-600 mb-4">Voeg tags toe om je bericht te categoriseren</p>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentTagInput}
                    onChange={(e) => setCurrentTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && currentTagInput.trim()) {
                        e.preventDefault();
                        setArticleTags(prev => [...prev, currentTagInput.trim()]);
                        setCurrentTagInput('');
                      }
                    }}
                    placeholder="Voer een tag in en druk Enter of klik op +"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (currentTagInput.trim()) {
                        setArticleTags(prev => [...prev, currentTagInput.trim()]);
                        setCurrentTagInput('');
                      }
                    }}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Tag Toevoegen
                  </button>
                </div>
                {articleTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {articleTags.map((tag, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        {tag}
                        <button
                          type="button"
                          onClick={() => setArticleTags(prev => prev.filter((_, i) => i !== index))}
                          className="hover:text-blue-900"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  resetForm();
                  setShowNewArticle(false);
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button 
                onClick={handleSaveArticle}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                {editingArticle ? 'Artikel Bijwerken' : 'Bericht Opslaan'}
              </button>
            </div>
          </div>
        </div>

        <SlidingMediaSelector 
          isOpen={showMediaSelector}
          onClose={() => setShowMediaSelector(false)}
          onSelect={handleImageSelect}
          title="Media Selector"
          allowMultiple={true}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nieuwsberichten</h1>
            <p className="text-gray-600 mt-1">Beheer nieuwsberichten en brand toegang</p>
          </div>
          <button
            onClick={handleNewArticleClick}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-orange-700 transition-colors"
          >
            <Plus size={16} />
            <span>Nieuw Bericht</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Status Toggles */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-4 h-4 bg-blue-600 rounded"></div>
            <h3 className="font-semibold text-blue-900">Admin Nieuwsberichten Overzicht</h3>
          </div>
          <p className="text-sm text-blue-700 mb-4">
            Hier zie je alleen artikelen die door admins zijn geschreven. Brand artikelen worden hier NIET getoond.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">Gepubliceerd</span>
              <span className="text-xs text-gray-500">= Live op website</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">Brand Goedgekeurd</span>
              <span className="text-xs text-gray-500">= Brands kunnen zien</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Verplicht</span>
              <span className="text-xs text-gray-500">= Alle brands moeten gebruiken</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm">Website Zichtbaar</span>
              <span className="text-xs text-gray-500">= Publiek zichtbaar</span>
            </div>
          </div>
        </div>

        {/* Brand Access Matrix */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Brand Toegang Matrix</h2>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm text-gray-600">3 admin artikelen</span>
                  <span className="text-sm text-green-600">Alleen Admin Artikelen</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Bericht & Brand Beheer</h3>
              <p className="text-sm text-gray-600">Beheer berichten met inline controle voor brand toegang en verplichte status</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Bericht</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">
                      <div>Gepubliceerd</div>
                      <div className="text-xs text-gray-500">Live status</div>
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">
                      <div>Brand</div>
                      <div className="text-xs text-gray-500">Goedgekeurd</div>
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">
                      <div>Verplicht</div>
                      <div className="text-xs text-gray-500">Voor alle brands</div>
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">
                      <div>Website</div>
                      <div className="text-xs text-gray-500">Publiek zichtbaar</div>
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article) => (
                    <tr key={article.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{article.title}</div>
                          <div className="text-sm text-gray-500">
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs mr-2">
                              {article.status}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Door: {article.brands?.name} • Aangemaakt: {article.created_at}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={article.status === 'published'}
                           onChange={() => handleTogglePublished(article.id, article.status)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={article.brand_approved}
                           onChange={() => handleToggleBrandApproved(article.id, article.brand_approved)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={article.brand_mandatory}
                           onChange={() => handleToggleBrandMandatory(article.id, article.brand_mandatory)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={article.website_visible}
                           onChange={() => handleToggleWebsiteVisible(article.id, article.website_visible)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button 
                            onClick={() => handleViewArticle(article.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Bekijk artikel"
                          >
                            <Eye size={16} className="text-gray-600" />
                          </button>
                          <button 
                            onClick={() => handleEditArticle(article.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Bewerk artikel"
                          >
                            <Edit size={16} className="text-blue-600" />
                          </button>
                          <button 
                            onClick={() => handleDeleteArticle(article.id, article.title)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Verwijder artikel"
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <details>
                <summary className="cursor-pointer text-sm font-medium text-gray-700 flex items-center">
                  <span className="mr-2">▶</span>
                  Debug Informatie (klik om uit te klappen)
                </summary>
                <div className="mt-2 text-xs text-gray-600">
                  <p>Hier zou debug informatie staan over de brand toegang matrix</p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}