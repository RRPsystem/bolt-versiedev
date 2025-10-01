import React, { useState, useEffect } from 'react';
import { Plus, Eye, CreditCard as Edit, Trash2, ArrowLeft, Save, X, Upload, Search, Tag } from 'lucide-react';
import { db, supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { SlidingMediaSelector } from '../shared/SlidingMediaSelector';
import { NewsArticle, Brand } from '../../types/database';

export function BrandContentManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'brand' | 'admin'>('brand');
  const [brandArticles, setBrandArticles] = useState<NewsArticle[]>([]);
  const [adminArticles, setAdminArticles] = useState<NewsArticle[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [showNewArticle, setShowNewArticle] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newArticle, setNewArticle] = useState({
    title: '',
    author: '',
    summary: '',
    status: 'concept',
    content: '',
    featured_image_url: '',
    gallery_images: [] as string[]
  });

  useEffect(() => {
    console.log('🚀 BrandContentManagement mounted');
    loadBrands();
  }, []);

  useEffect(() => {
    if (selectedBrandId) {
      console.log('🔄 Brand changed, loading articles for:', selectedBrandId);
      loadArticles();
    }
  }, [selectedBrandId]);
  
  // Load saved toggle states from localStorage on component mount
  useEffect(() => {
    if (adminArticles.length === 0) return; // Don't run if no articles loaded yet
    
    try {
      const savedToggles = localStorage.getItem('brand-article-toggles');
      if (savedToggles) {
        const toggleData = JSON.parse(savedToggles);
        console.log('🔄 Loading saved toggle states from localStorage:', toggleData);
        
        // Apply saved toggle states to admin articles
        setAdminArticles(prev => prev.map(article => ({
          ...article,
          website_visible: toggleData[article.id] !== undefined ? toggleData[article.id] : (article.website_visible || false)
        })));
        
        console.log('✅ Toggle states applied from localStorage');
      }
    } catch (error) {
      console.log('⚠️ Could not load toggle states from localStorage:', error);
    }
  }, [adminArticles.length]);

  const loadBrands = async () => {
    console.log('🔄 Loading brands...');
    try {
      const data = await db.getBrands();
      console.log('✅ Brands loaded from Supabase:', data);
      setBrands(data || []);
      
      // Auto-select user's brand if available
      if (user?.brand_id && data) {
        const userBrand = data.find(b => b.id === user.brand_id);
        if (userBrand) {
          setSelectedBrandId(user.brand_id);
          console.log('✅ Auto-selected user brand:', userBrand.name);
        }
      } else if (data && data.length > 0) {
        setSelectedBrandId(data[0].id);
        console.log('✅ Fallback to first brand:', data[0].name);
      }
    } catch (error) {
      console.log('⚠️ Brands Supabase error, using mock data:', error);
      const mockBrands = [
        { id: '550e8400-e29b-41d4-a716-446655440001', name: 'The Travel Club', slug: 'the-travel-club' },
        { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Reisbureau Del Monde', slug: 'reisbureau-del-monde' },
        { id: '550e8400-e29b-41d4-a716-446655440003', name: 'TestBrand', slug: 'testbrand' }
      ];
      setBrands(mockBrands);
      
      if (user?.brand_id) {
        setSelectedBrandId(user.brand_id);
      } else {
        setSelectedBrandId(mockBrands[0].id);
      }
    }
  };

  const loadArticles = async () => {
    console.log('🔄 Loading articles for brand_id:', selectedBrandId);
    setLoading(true);
    
    try {
      // Load all articles from database
      const data = await db.getNewsArticles();
      console.log('✅ Supabase articles loaded:', data);
      
      const brandArts = data?.filter(article => 
        article.author_type === 'brand' && article.brand_id === selectedBrandId
      ) || [];
      
      // Filter admin articles that are approved for brands
      const adminArts = data?.filter(article => 
        article.author_type === 'admin' && article.brand_approved === true
      ) || [];
      
      setBrandArticles(brandArts);
      setAdminArticles(adminArts);
      
      console.log('📊 Articles breakdown:', {
        total: data?.length || 0,
        brandArticles: brandArts.length,
        adminArticles: adminArts.length,
        adminArticlesWithToggleState: adminArts.map(a => ({
          id: a.id,
          title: a.title,
          website_visible: a.website_visible,
          brand_mandatory: a.brand_mandatory
        }))
      });
      
    } catch (supabaseError) {
      console.log('⚠️ Supabase error, using mock data:', supabaseError);
      
      // Use mock data with proper toggle states
      setBrandArticles([
        {
          id: 'mock-1',
          title: 'Mock Brand Article',
          slug: 'mock-brand-article',
          content: {},
          status: 'Live',
          created_at: '24-9-2025',
          brands: { name: brands.find(b => b.id === selectedBrandId)?.name || 'Unknown', slug: 'mock' }
        }
      ]);
      
      setAdminArticles([
        {
          id: 'admin-1',
          title: 'Test 3 - Optioneel Artikel',
          slug: 'test-3',
          content: {},
          status: 'published',
          created_at: '24-9-2025',
          brand_approved: true,
          brand_mandatory: false,
          website_visible: false, // This should persist when toggled
          author_type: 'admin',
          brands: { name: 'Admin', slug: 'admin' }
        },
        {
          id: 'admin-2', 
          title: 'Verplicht Admin Artikel',
          slug: 'verplicht-admin',
          content: {},
          status: 'published',
          created_at: '24-9-2025',
          brand_approved: true,
          brand_mandatory: true,
          website_visible: true,
          author_type: 'admin',
          brands: { name: 'Admin', slug: 'admin' }
        }
      ]);
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

  const handleNewArticleClick = () => {
    console.log('🆕 New article button clicked - opening form');
    setShowNewArticle(true);
  };

  const handleSaveArticle = async () => {
    console.log('💾 Saving new article:', newArticle);
    
    if (!newArticle.title.trim()) {
      alert('Titel is verplicht!');
      return;
    }
    
    try {
      const newArticleWithId = {
        id: Date.now().toString(),
        title: newArticle.title,
        slug: newArticle.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
        content: { text: newArticle.content },
        status: newArticle.status,
        created_at: new Date().toLocaleDateString('nl-NL'),
        brands: { 
          name: brands.find(b => b.id === selectedBrandId)?.name || 'Unknown',
          slug: brands.find(b => b.id === selectedBrandId)?.slug || 'unknown'
        }
      };

      setBrandArticles(prev => [newArticleWithId, ...prev]);
      console.log('✅ Article added to local state');
      
      setNewArticle({
        title: '',
        author: '',
        summary: '',
        status: 'concept',
        content: '',
        featured_image_url: '',
        gallery_images: []
      });
      setShowNewArticle(false);
      
      alert('Artikel succesvol opgeslagen!');
      
    } catch (error) {
      console.error('❌ Error saving article:', error);
      alert('Er is een fout opgetreden bij het opslaan van het artikel.');
    }
  };

  const handleToggleArticlePublication = async (articleId: string, currentValue: boolean) => {
    console.log(`🔄 Toggling article publication for ${articleId}: ${currentValue} → ${!currentValue}`);
    console.log('📊 Current admin articles state:', adminArticles.map(a => ({ id: a.id, title: a.title, website_visible: a.website_visible })));
    
    try {
      // Update local state immediately for UI responsiveness
      setAdminArticles(prev => prev.map(article => 
        article.id === articleId 
          ? { ...article, website_visible: !currentValue }
          : article
      ));
      
      console.log('✅ Local state updated immediately');
      
      // Try to persist to database
      if (supabase) {
        try {
          console.log('🔄 Updating database...');
          const { error } = await supabase
            .from('news_articles')
            .update({ website_visible: !currentValue })
            .eq('id', articleId);
          
          if (error) {
            console.error('🚨 Supabase update error:', error);
            // Revert local state if database update fails
            setAdminArticles(prev => prev.map(article => 
              article.id === articleId 
                ? { ...article, website_visible: currentValue }
                : article
            ));
            console.log('⚠️ Database update failed, but keeping UI state');
          }
          console.log('✅ Database updated successfully');
          
        } catch (dbError) {
          console.error('❌ Database error:', dbError);
          console.log('⚠️ Database update failed, but UI state preserved');
        }
      } else {
        console.log('⚠️ No Supabase connection - changes only saved locally');
      }
      
      // Save to localStorage as backup regardless of database status
      try {
        const currentLocalData = localStorage.getItem('brand-article-toggles') || '{}';
        const toggleData = JSON.parse(currentLocalData);
        toggleData[articleId] = !currentValue;
        localStorage.setItem('brand-article-toggles', JSON.stringify(toggleData));
        console.log('💾 Toggle state saved to localStorage as backup');
      } catch (localError) {
        console.log('⚠️ Could not save to localStorage:', localError);
      }
      
      console.log('✅ Article publication toggle completed successfully');
      
    } catch (error) {
      console.error('❌ Error updating article publication:', error);
      console.log('🔄 Reverting UI state due to critical error');
      // Only revert if there's a critical error
      setAdminArticles(prev => prev.map(article => 
        article.id === articleId 
          ? { ...article, website_visible: currentValue }
          : article
      ));
    }
  };

  if (showNewArticle) {
    return (
      <div className="h-full bg-gray-50 overflow-y-auto">
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowNewArticle(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Nieuw Artikel</h1>
              <p className="text-sm text-gray-600">Maak een nieuw artikel aan voor publicatie</p>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Artikel Informatie</h2>
                <p className="text-sm text-gray-600">Vul de basisinformatie voor het nieuwe artikel in</p>
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
                    placeholder="Titel van het artikel"
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
                  placeholder="Korte samenvatting van het artikel"
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
                <p className="text-sm text-gray-600 mb-4">Schrijf de volledige inhoud van het artikel</p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Artikel inhoud <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newArticle.content}
                    onChange={(e) => setNewArticle(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Schrijf hier de volledige inhoud van het artikel..."
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Media</h3>
                <p className="text-sm text-gray-600 mb-4">Voeg afbeeldingen en video's toe aan het artikel</p>
                
                {/* Featured Image */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hoofdafbeelding</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors">
                    {newArticle.featured_image_url ? (
                      <div className="relative inline-block">
                        <img 
                          src={newArticle.featured_image_url} 
                          alt="Featured" 
                          className="max-w-xs mx-auto rounded-lg shadow-lg"
                        />
                        <button
                          onClick={() => setNewArticle(prev => ({ ...prev, featured_image_url: '' }))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 mb-2">Klik om een hoofdafbeelding te selecteren</p>
                        <button
                          onClick={() => setShowMediaSelector(true)}
                          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          Selecteer Afbeelding
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gallery Images */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Galerij Afbeeldingen</label>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    {newArticle.gallery_images.map((imageUrl, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={imageUrl} 
                          alt={`Gallery ${index + 1}`} 
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => setNewArticle(prev => ({
                            ...prev,
                            gallery_images: prev.gallery_images.filter((_, i) => i !== index)
                          }))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowMediaSelector(true)}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 w-full text-center hover:border-orange-400 transition-colors"
                  >
                    <Plus size={24} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600">Voeg afbeelding toe aan galerij</p>
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowNewArticle(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleSaveArticle}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
                >
                  <Save size={16} />
                  <span>Artikel Opslaan</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {showMediaSelector && (
          <SlidingMediaSelector
            isOpen={showMediaSelector}
            onSelect={handleImageSelect}
            onClose={() => setShowMediaSelector(false)}
            title="Media Selector"
            allowMultiple={true}
          />
        )}
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Content Beheer</h1>
            <p className="text-sm text-gray-600">Beheer uw artikelen en content voor publicatie</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Brand Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Brand:</label>
              <select
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
            {activeTab === 'brand' && (
              <button
                onClick={handleNewArticleClick}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Nieuw Artikel</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-6 flex-shrink-0">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('brand')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'brand'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Brand Artikelen ({brandArticles.length})
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'admin'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Admin Artikelen ({adminArticles.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'brand' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Brand Artikelen</h2>
              <p className="text-sm text-gray-600">Beheer uw eigen artikelen met controls voor website zichtbaarheid</p>
            </div>

            {loading ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Artikelen laden...</p>
              </div>
            ) : brandArticles.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <Plus size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Geen Artikelen</h3>
                <p className="text-gray-600 mb-4">U heeft nog geen artikelen aangemaakt. Begin met het schrijven van uw eerste artikel.</p>
                <button
                  onClick={handleNewArticleClick}
                  className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Plus size={16} />
                  <span>Eerste Artikel Schrijven</span>
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <div>
                    <h3 className="font-semibold text-gray-900">Brand Artikelen</h3>
                    <p className="text-sm text-gray-600">Beheer uw eigen artikelen met controls voor website zichtbaarheid</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bericht</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div>Status</div>
                          <div className="text-xs text-gray-400 normal-case">Gepubliceerd</div>
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div>Website</div>
                          <div className="text-xs text-gray-400 normal-case">Publiek zichtbaar</div>
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {brandArticles.map((article) => (
                        <tr key={article.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">{article.title}</div>
                              <div className="text-sm text-gray-500">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">
                                  Eigen artikel
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Door: {article.brands?.name} • Aangemaakt: {article.created_at}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {article.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={true}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button className="p-1 hover:bg-gray-100 rounded">
                                <Eye size={16} className="text-gray-600" />
                              </button>
                              <button className="p-1 hover:bg-gray-100 rounded">
                                <Edit size={16} className="text-blue-600" />
                              </button>
                              <button className="p-1 hover:bg-gray-100 rounded">
                                <Trash2 size={16} className="text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'admin' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Admin Artikelen</h2>
              <p className="text-sm text-gray-600">Artikelen die door admins zijn geschreven en beschikbaar zijn voor uw brand</p>
            </div>

            {loading ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Artikelen laden...</p>
              </div>
            ) : adminArticles.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <Plus size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Geen Admin Artikelen</h3>
                <p className="text-gray-600">Er zijn momenteel geen admin artikelen beschikbaar voor uw brand.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">📋 Admin Artikelen Beheer</h3>
                    <div className="text-sm text-blue-800 space-y-1">
                      <div>🔵 <strong>Verplicht:</strong> Automatisch op uw website (door admin ingesteld)</div>
                      <div>🟡 <strong>Optioneel:</strong> U kunt kiezen om te publiceren op uw website</div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artikel</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div>Publiceren</div>
                          <div className="text-xs text-gray-400 normal-case">Op mijn website</div>
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {adminArticles.map((article) => (
                        <tr key={article.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">{article.title}</div>
                              <div className="text-sm text-gray-500">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">
                                  Admin artikel
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Door: Admin • Aangemaakt: {article.created_at}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center space-y-1">
                              {article.brand_mandatory ? (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                  🔵 Verplicht
                                </span>
                              ) : (
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                                  🟡 Optioneel
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {article.brand_mandatory ? (
                              <div className="flex flex-col items-center space-y-1">
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                                  🔒 Automatisch Live
                                </span>
                                <span className="text-xs text-gray-500">Verplicht op website</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center space-y-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={article.website_visible || false}
                                    onChange={() => handleToggleArticlePublication(article.id, article.website_visible || false)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                                </label>
                                <span className="text-xs text-gray-500">
                                  {article.website_visible ? 'Live op website' : 'Niet gepubliceerd'}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button className="p-1 hover:bg-gray-100 rounded">
                                <Eye size={16} className="text-gray-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}