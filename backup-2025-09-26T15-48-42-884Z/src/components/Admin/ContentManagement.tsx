import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Upload,
  X,
  Tag
} from 'lucide-react';
import { db } from '../../lib/supabase';

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

interface MediaSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
}

function MediaSelector({ isOpen, onClose, onSelect }: MediaSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('barcelona');
  const [activeTab, setActiveTab] = useState<'upload' | 'unsplash' | 'youtube'>('unsplash');
  
  const unsplashImages = [
    'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?auto=compress&cs=tinysrgb&w=300',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-4xl h-3/4 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Media Selector</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'upload' 
                ? 'text-orange-600 border-b-2 border-orange-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Upload
          </button>
          <button
            onClick={() => setActiveTab('unsplash')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'unsplash' 
                ? 'text-orange-600 border-b-2 border-orange-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Unsplash
          </button>
          <button
            onClick={() => setActiveTab('youtube')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'youtube' 
                ? 'text-orange-600 border-b-2 border-orange-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            YouTube
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          {activeTab === 'unsplash' && (
            <div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Zoek afbeeldingen..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-600 text-white px-3 py-1 rounded text-sm">
                  <Search size={14} />
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {unsplashImages.map((image, index) => (
                  <div 
                    key={index}
                    onClick={() => onSelect(image)}
                    className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-orange-500"
                  >
                    <img 
                      src={image} 
                      alt={`Unsplash ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-4">
                <button className="text-orange-600 hover:text-orange-700 font-medium">
                  Laad meer afbeeldingen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ContentManagement() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewArticle, setShowNewArticle] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: '',
    author: '',
    summary: '',
    status: 'concept',
    content: '',
    featured_image_url: ''
  });

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
        setArticles(data || []);
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
    setNewArticle(prev => ({ ...prev, featured_image_url: imageUrl }));
    setShowMediaSelector(false);
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
              <h1 className="text-xl font-semibold text-gray-900">Nieuw Bericht</h1>
              <p className="text-sm text-gray-600">Maak een nieuw bericht aan voor publicatie</p>
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
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Hoofdafbeelding/Video</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  {newArticle.featured_image_url ? (
                    <div className="relative">
                      <img 
                        src={newArticle.featured_image_url} 
                        alt="Featured" 
                        className="max-w-xs mx-auto rounded-lg"
                      />
                      <button
                        onClick={() => setNewArticle(prev => ({ ...prev, featured_image_url: '' }))}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-2">Hoofdafbeelding/video toevoegen</p>
                      <button
                        onClick={() => setShowMediaSelector(true)}
                        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        Afbeelding toevoegen
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Galerij</label>
                <p className="text-sm text-gray-500 mb-2">Nog geen afbeeldingen toegevoegd aan de galerij</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <Tag className="mr-2" size={20} />
                Tags
              </h3>
              <p className="text-sm text-gray-600 mb-4">Voeg tags toe om je bericht te categoriseren</p>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowNewArticle(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                Bericht Opslaan
              </button>
            </div>
          </div>
        </div>

        <MediaSelector 
          isOpen={showMediaSelector}
          onClose={() => setShowMediaSelector(false)}
          onSelect={handleImageSelect}
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
            onClick={() => setShowNewArticle(true)}
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
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </td>
                      <td className="py-4 px-4 text-center">
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