import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2
} from 'lucide-react';
import { db } from '../../lib/supabase';

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  content: any;
  status: string;
  created_at: string;
  brands?: { name: string; slug: string };
}

export function BrandContentManagement() {
  const [activeTab, setActiveTab] = useState<'brand' | 'admin'>('brand');
  const [brandArticles, setBrandArticles] = useState<NewsArticle[]>([]);
  const [adminArticles, setAdminArticles] = useState<NewsArticle[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('The Travel Club');

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      // Try to load from Supabase, but fall back to mock data if it fails
      try {
        const data = await db.getNewsArticles('the-travel-club');
        setBrandArticles(data || []);
      } catch (supabaseError) {
        console.log('Supabase not connected, using mock data');
        // Use mock data when Supabase is not available
        setBrandArticles([
          {
            id: '1',
            title: 'test 8',
            slug: 'test-8',
            content: {},
            status: 'Live',
            created_at: '24-9-2025',
            brands: { name: 'The Travel Club', slug: 'the-travel-club' }
          },
          {
            id: '2',
            title: 'test Alex',
            slug: 'test-alex',
            content: {},
            status: 'Live',
            created_at: '24-9-2025',
            brands: { name: 'The Travel Club', slug: 'the-travel-club' }
          }
        ]);
      }

      try {
        const adminData = await db.getNewsArticles();
        setAdminArticles(adminData?.filter(article => article.author_type === 'admin') || []);
      } catch (supabaseError) {
        console.log('Supabase not connected, using mock data for admin articles');
        setAdminArticles([
          {
            id: '3',
            title: 'Admin Article 1',
            slug: 'admin-article-1',
            content: {},
            status: 'Published',
            created_at: '24-9-2025',
            brands: { name: 'Admin', slug: 'admin' }
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading articles:', error);
    }
  };

  return (
    <div className="flex-1 bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nieuwsberichten</h1>
            <p className="text-gray-600 mt-1">Bekijk nieuwsberichten voor uw brand</p>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="The Travel Club">The Travel Club</option>
              <option value="Other Brand">Other Brand</option>
            </select>
            <button className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-orange-700 transition-colors">
              <Plus size={16} />
              <span>Nieuw Artikel</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('brand')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'brand'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mijn Berichten
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'admin'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Admin Artikelen
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'brand' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Mijn Berichten</h2>
              <p className="text-sm text-gray-600">Artikelen die door uw brand zijn geschreven</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Brand Artikelen</h3>
                    <p className="text-sm text-gray-600">Beheer uw eigen artikelen met controls voor website zichtbaarheid</p>
                  </div>
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
          </div>
        )}

        {activeTab === 'admin' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Admin Artikelen</h2>
              <p className="text-sm text-gray-600">Artikelen die door admins zijn geschreven en beschikbaar zijn voor uw brand</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <div className="text-gray-400 mb-4">
                <Plus size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Geen Admin Artikelen</h3>
              <p className="text-gray-600">Er zijn momenteel geen admin artikelen beschikbaar voor uw brand.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}