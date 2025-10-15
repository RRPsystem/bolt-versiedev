import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db, supabase } from '../../lib/supabase';
import { AgentManagement } from './AgentManagement';
import { BrandForm } from './BrandForm';
import { NewsManagement } from './NewsManagement';
import { TemplateManager } from './TemplateManager';
import { PageManagementView } from '../Brand/WebsiteManagement/PageManagementView';
import { MenuBuilderView } from '../Brand/WebsiteManagement/MenuBuilderView';
import { FooterBuilderView } from '../Brand/WebsiteManagement/FooterBuilderView';
import { NewPage } from '../Brand/WebsiteManagement/NewPage';
import DeeplinkTester from './DeeplinkTester';
import { HelpBot } from '../shared/HelpBot';
import { Users, Building2, FileText, Settings, Plus, Search, Filter, CreditCard as Edit, Trash2, LayoutGrid as Layout, Menu, Globe, Newspaper, MapPin, Plane, Link, Key, X, Lock } from 'lucide-react'
import { ChevronDown, ChevronRight } from 'lucide-react';

export function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showWebsiteSubmenu, setShowWebsiteSubmenu] = useState(false);
  const [showContentSubmenu, setShowContentSubmenu] = useState(false);
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [dashboardStats, setDashboardStats] = useState({
    totalBrands: 0,
    activeAgents: 0,
    publishedPages: 0,
    newsArticles: 0
  });
  const SYSTEM_BRAND_ID = '00000000-0000-0000-0000-000000000001';
  const [resetPasswordBrand, setResetPasswordBrand] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  React.useEffect(() => {
    if (['template-manager', 'page-management', 'menu-builder', 'footer-builder'].includes(activeSection)) {
      setShowWebsiteSubmenu(true);
      if (activeSection !== 'template-manager' && brands.length === 0) {
        loadBrands();
      }
    }
    if (['admin-news', 'destinations', 'trips'].includes(activeSection)) {
      setShowContentSubmenu(true);
    }
  }, [activeSection]);

  const loadBrands = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading brands...');
      const data = await db.getBrands();
      console.log('✅ Brands loaded:', data);
      setBrands(data || []);
      if (data && data.length > 0 && !selectedBrandId) {
        setSelectedBrandId(data[0].id);
      }
    } catch (error) {
      console.error('❌ Error loading brands:', error);
      setBrands([]);
      alert(`Database error: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const [brandsData, usersData, pagesData, newsData] = await Promise.all([
        db.getBrands(),
        db.getUsers(),
        db.getPages(),
        db.getNewsItems()
      ]);

      setDashboardStats({
        totalBrands: brandsData?.length || 0,
        activeAgents: usersData?.filter((u: any) => u.role === 'agent')?.length || 0,
        publishedPages: pagesData?.filter((p: any) => p.is_published)?.length || 0,
        newsArticles: newsData?.length || 0
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  React.useEffect(() => {
    if (activeSection === 'dashboard') {
      loadDashboardStats();
    }
    if (activeSection === 'brands' || ['page-management', 'menu-builder', 'footer-builder'].includes(activeSection)) {
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

  const handleResetBrandPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordBrand) return;

    setResetLoading(true);
    setResetError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not logged in');
      }

      const { data: brandUser } = await db.getUserByBrandId(resetPasswordBrand.id);
      if (!brandUser) {
        throw new Error('Brand user not found');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-user-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            user_id: brandUser.id,
            new_password: newPassword
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password');
      }

      setResetLoading(false);

      alert(`✅ Wachtwoord gereset!\n\n📧 Email: ${brandUser.email}\n🔑 Nieuw wachtwoord: ${newPassword}\n\n⚠️ Noteer dit wachtwoord - het wordt maar 1x getoond!`);

      setResetPasswordBrand(null);
      setNewPassword('');
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Settings },
    { id: 'brands', label: 'Brand Management', icon: Building2 },
    { id: 'agents', label: 'Agent Management', icon: Users },
    { id: 'deeplink-tester', label: 'Deeplink Tester', icon: Link },
  ];

  const websiteItems = [
    { id: 'template-manager', label: 'Template Manager', icon: Layout },
    { id: 'page-management', label: 'Pagina Beheer', icon: FileText },
    { id: 'menu-builder', label: 'Menu Builder', icon: Menu },
    { id: 'footer-builder', label: 'Footer Builder', icon: Layout },
  ];

  const contentItems = [
    { id: 'admin-news', label: 'Nieuwsbeheer', icon: Newspaper },
    { id: 'destinations', label: 'Bestemmingen', icon: MapPin },
    { id: 'trips', label: 'Reizen', icon: Plane },
  ];

  const handleTravelStudioClick = () => {
    window.open('https://travelstudio.travelstudio-accept.bookunited.com/login', '_blank');
  };

  if (showBrandForm) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-64 bg-slate-800 text-white flex flex-col min-h-screen">
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

              {/* Website Management Menu */}
              <li>
                <button
                  onClick={() => setShowWebsiteSubmenu(!showWebsiteSubmenu)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                    ['new-page', 'page-management', 'menu-builder', 'footer-builder'].includes(activeSection)
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Globe size={20} />
                    <span>Website Management</span>
                  </div>
                  {showWebsiteSubmenu ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {showWebsiteSubmenu && (
                  <ul className="mt-2 ml-6 space-y-1">
                    {websiteItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => setActiveSection(item.id)}
                            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-sm ${
                              activeSection === item.id
                                ? 'bg-slate-700 text-white'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                          >
                            <Icon size={16} />
                            <span>{item.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>

              {/* Travel Studio Link */}
              <li>
                <button
                  onClick={handleTravelStudioClick}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <Globe size={20} />
                  <span>Travel Studio</span>
                </button>
              </li>
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

            {/* Website Management Menu */}
            <li>
              <button
                onClick={() => setShowWebsiteSubmenu(!showWebsiteSubmenu)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                  ['new-page', 'page-management', 'menu-builder', 'footer-builder'].includes(activeSection)
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Globe size={20} />
                  <span>Website Management</span>
                </div>
                {showWebsiteSubmenu ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {showWebsiteSubmenu && (
                <ul className="mt-2 ml-6 space-y-1">
                  {websiteItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => setActiveSection(item.id)}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-sm ${
                            activeSection === item.id
                              ? 'bg-slate-700 text-white'
                              : 'text-slate-400 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          <Icon size={16} />
                          <span>{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>

            {/* Content Menu */}
            <li>
              <button
                onClick={() => setShowContentSubmenu(!showContentSubmenu)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                  ['admin-news', 'destinations', 'trips'].includes(activeSection)
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <FileText size={20} />
                  <span>Content</span>
                </div>
                {showContentSubmenu ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {showContentSubmenu && (
                <ul className="mt-2 ml-6 space-y-1">
                  {contentItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => setActiveSection(item.id)}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-sm ${
                            activeSection === item.id
                              ? 'bg-slate-700 text-white'
                              : 'text-slate-400 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          <Icon size={16} />
                          <span>{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>

            {/* Travel Studio Link */}
            <li>
              <button
                onClick={handleTravelStudioClick}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <Globe size={20} />
                <span>Travel Studio</span>
              </button>
            </li>
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
                {activeSection === 'admin-news' && 'Admin News Management'}
                {activeSection === 'deeplink-tester' && 'Deeplink Tester'}
                {activeSection === 'template-manager' && 'Template Manager'}
                {activeSection === 'page-management' && 'Pagina Beheer'}
                {activeSection === 'menu-builder' && 'Menu Builder'}
                {activeSection === 'footer-builder' && 'Footer Builder'}
              </h1>
              <p className="text-gray-600 mt-1">
                {activeSection === 'brands' && 'Manage all brands in the system'}
                {activeSection === 'dashboard' && 'System overview and statistics'}
                {activeSection === 'admin-news' && 'Create and manage news items for all brands'}
                {activeSection === 'deeplink-tester' && 'Test external builder integration'}
                {activeSection === 'template-manager' && 'Maak en beheer pagina templates voor brands'}
                {activeSection === 'page-management' && 'Beheer alle pagina\'s van je website'}
                {activeSection === 'menu-builder' && 'Bouw en organiseer je website navigatie'}
                {activeSection === 'footer-builder' && 'Ontwerp en beheer je website footer'}
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

            {['page-management', 'menu-builder', 'footer-builder'].includes(activeSection) && brands.length > 0 && (
              <div className="flex items-center space-x-3">
                <label htmlFor="brand-select" className="text-sm font-medium text-gray-700">Brand:</label>
                <select
                  id="brand-select"
                  value={selectedBrandId}
                  onChange={(e) => setSelectedBrandId(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                >
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          {activeSection === 'agents' && <AgentManagement />}
          {activeSection === 'admin-news' && <NewsManagement />}
          {activeSection === 'deeplink-tester' && <DeeplinkTester />}
          {activeSection === 'template-manager' && <TemplateManager />}

          {/* Website Management Content - Admin can select brand */}
          {activeSection === 'page-management' && (
            selectedBrandId ? (
              <PageManagementView brandId={selectedBrandId} hideCreateButtons={false} />
            ) : brands.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Geen brands gevonden</h3>
                <p className="text-gray-600 mb-4">Maak eerst een brand aan voordat je pagina's kunt beheren.</p>
                <button
                  onClick={() => setActiveSection('brands')}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Naar Brand Management
                </button>
              </div>
            ) : null
          )}
          {activeSection === 'menu-builder' && (
            selectedBrandId ? (
              <MenuBuilderView brandId={selectedBrandId} />
            ) : brands.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Geen brands gevonden</h3>
                <p className="text-gray-600 mb-4">Maak eerst een brand aan voordat je menu's kunt maken.</p>
                <button
                  onClick={() => setActiveSection('brands')}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Naar Brand Management
                </button>
              </div>
            ) : null
          )}
          {activeSection === 'footer-builder' && (
            selectedBrandId ? (
              <FooterBuilderView brandId={selectedBrandId} />
            ) : brands.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Geen brands gevonden</h3>
                <p className="text-gray-600 mb-4">Maak eerst een brand aan voordat je footers kunt maken.</p>
                <button
                  onClick={() => setActiveSection('brands')}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Naar Brand Management
                </button>
              </div>
            ) : null
          )}

          {activeSection === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Brands</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalBrands}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Agents</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.activeAgents}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Published Pages</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.publishedPages}</p>
                  </div>
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">News Articles</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.newsArticles}</p>
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
                                  onClick={() => setResetPasswordBrand(brand)}
                                  className="p-1 hover:bg-gray-100 rounded"
                                  title="Reset wachtwoord"
                                >
                                  <Key size={16} className="text-orange-600" />
                                </button>
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

      {resetPasswordBrand && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Key size={20} className="text-orange-600" />
                <span>Reset Wachtwoord</span>
              </h2>
              <button
                onClick={() => {
                  setResetPasswordBrand(null);
                  setNewPassword('');
                  setResetError('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleResetBrandPassword} className="p-6">
              {resetError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {resetError}
                </div>
              )}

              <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Brand</p>
                <p className="font-medium text-gray-900">{resetPasswordBrand.name}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center space-x-2">
                    <Lock size={16} />
                    <span>Nieuw Wachtwoord <span className="text-red-500">*</span></span>
                  </div>
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimaal 6 karakters"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-2">Het nieuwe wachtwoord wordt in een alert getoond na het resetten.</p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-orange-800">
                  <strong>Let op:</strong> Noteer het nieuwe wachtwoord. Het wordt maar 1x getoond!
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setResetPasswordBrand(null);
                    setNewPassword('');
                    setResetError('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {resetLoading ? 'Bezig...' : 'Wachtwoord Resetten'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <HelpBot />
    </div>
  );
}