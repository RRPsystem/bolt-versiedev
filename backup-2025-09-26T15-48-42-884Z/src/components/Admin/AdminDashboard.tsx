import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/supabase';
import { ContentManagement } from './ContentManagement';
import { AgentManagement } from './AgentManagement';
import { BrandForm } from './BrandForm';
import { Users, Building2, FileText, Settings, Plus, Search, Filter, CreditCard as Edit, Trash2, Bot, Sparkles, Download, Import as FileImport } from 'lucide-react'

export function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBrands = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading brands...');
      const data = await db.getBrands();
      console.log('✅ Brands loaded:', data);
      setBrands(data || []);
    } catch (error) {
      console.error('❌ Error loading brands:', error);
      setBrands([]);
      alert(`Database error: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeSection === 'brands') {
      loadBrands();
    }
  }, [activeSection]);

  const handleBrandFormSuccess = () => {
    setShowBrandForm(false);
    setEditingBrand(null);
    loadBrands();
  };

  const handleEditBrand = (brand: any) => {
    setEditingBrand(brand);
    setShowBrandForm(true);
  };

  const handleDeleteBrand = async (brand: any) => {
    if (window.confirm(`Weet je zeker dat je "${brand.name}" wilt verwijderen?`)) {
      try {
        console.log('🗑️ Deleting brand:', brand.name, brand.id);
        await db.deleteBrand(brand.id);
        console.log('✅ Brand deleted successfully');
        await loadBrands();
      } catch (error) {
        console.error('❌ Error deleting brand:', error);
        alert(`Er is een fout opgetreden bij het verwijderen van de brand: ${error.message || error}`);
      }
    }
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Settings },
    { id: 'brands', label: 'Brand Management', icon: Building2 },
    { id: 'agents', label: 'Agent Management', icon: Users },
    { id: 'websites', label: 'Website Management', icon: FileText },
    { id: 'content', label: 'Content Management', icon: FileText },
  ];

  if (showBrandForm) {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-64 bg-slate-800 text-white flex flex-col">
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-semibold">Administrator</span>
            </div>
          </div>

          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeSection === item.id
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t border-slate-700">
            <button
              onClick={signOut}
              className="w-full flex items-center space-x-3 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Settings size={20} />
              <span>Settings</span>
            </button>
            <button
              onClick={signOut}
              className="w-full flex items-center space-x-3 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors mt-2"
            >
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Brand Form */}
        <BrandForm 
          onBack={() => setShowBrandForm(false)}
          onSuccess={handleBrandFormSuccess}
          editingBrand={editingBrand}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-64 bg-slate-800 text-white flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-semibold">Administrator</span>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeSection === item.id
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={signOut}
            className="w-full flex items-center space-x-3 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center space-x-3 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors mt-2"
          >
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {activeSection === 'dashboard' && 'Dashboard'}
                {activeSection === 'brands' && 'Brand Management'}
                {activeSection === 'agents' && 'Agent Management'}
                {activeSection === 'websites' && 'Website Management'}
                {activeSection === 'content' && 'Content Management'}
              </h1>
              <p className="text-gray-600 mt-1">
                {activeSection === 'brands' && 'Manage all brands in the system'}
                {activeSection === 'dashboard' && 'System overview and statistics'}
              </p>
            </div>
            
            {activeSection === 'brands' && (
              <button 
                onClick={() => setShowBrandForm(true)}
                className="bg-black text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-800 transition-colors"
              >
                <Plus size={16} />
                <span>Add Brand</span>
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          {activeSection === 'agents' && <AgentManagement />}
          {activeSection === 'content' && <ContentManagement />}
          
          {activeSection === 'websites' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Travel Club Website</h3>
                    <p className="text-sm text-gray-600 mb-3">travel-club.example.com</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>5 pages</span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Published</span>
                    </div>
                    <div className="flex space-x-2">
                      <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors">
                        Edit
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="h-32 bg-gradient-to-r from-green-500 to-blue-600"></div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Adventure Tours</h3>
                    <p className="text-sm text-gray-600 mb-3">adventure-tours.example.com</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>3 pages</span>
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Draft</span>
                    </div>
                    <div className="flex space-x-2">
                      <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors">
                        Edit
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-dashed border-gray-300 flex items-center justify-center min-h-64 hover:border-blue-400 transition-colors cursor-pointer">
                  <div className="text-center">
                    <Plus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Create New Website</h3>
                    <p className="text-gray-500">Create a new website</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeSection === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Brands</p>
                    <p className="text-2xl font-bold text-gray-900">12</p>
                  </div>
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Agents</p>
                    <p className="text-2xl font-bold text-gray-900">48</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Published Websites</p>
                    <p className="text-2xl font-bold text-gray-900">8</p>
                  </div>
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Content Articles</p>
                    <p className="text-2xl font-bold text-gray-900">156</p>
                  </div>
                  <FileText className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'brands' && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <Building2 size={20} />
                      <span>All Brands</span>
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {loading ? 'Loading...' : `${brands.length} brands in the system`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search brands..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <Filter size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mr-3"></div>
                            <span className="text-gray-500">Loading brands...</span>
                          </div>
                        </td>
                      </tr>
                    ) : brands.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center">
                          <div className="text-gray-500">
                            <Building2 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No brands yet</h3>
                            <p className="text-gray-600">Get started by creating your first brand.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      brands.map((brand, index) => {
                        const initials = brand.name
                          .split(' ')
                          .map((word: string) => word[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2);
                        
                        const colors = [
                          'bg-blue-100 text-blue-600',
                          'bg-green-100 text-green-600', 
                          'bg-purple-100 text-purple-600',
                          'bg-orange-100 text-orange-600',
                          'bg-pink-100 text-pink-600',
                          'bg-indigo-100 text-indigo-600'
                        ];
                        const colorClass = colors[index % colors.length];
                        
                        return (
                          <tr key={brand.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`w-8 h-8 ${colorClass} rounded-lg flex items-center justify-center mr-3`}>
                                  <span className="font-semibold text-sm">{initials}</span>
                                </div>
                                <span className="font-medium text-gray-900">{brand.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{brand.slug}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{brand.description || brand.business_type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(brand.created_at).toLocaleDateString('nl-NL')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => handleEditBrand(brand)}
                                  className="p-1 hover:bg-gray-100 rounded"
                                  title="Bewerk brand"
                                >
                                  <Edit size={16} className="text-blue-600" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteBrand(brand)}
                                  className="p-1 hover:bg-gray-100 rounded"
                                  title="Verwijder brand"
                                >
                                  <Trash2 size={16} className="text-red-600" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}