import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TravelBro } from '../Brand/AITools/TravelBro';
import { SocialMedia } from '../Brand/AITools/SocialMedia';
import { Bot, User, Globe, ChevronDown, ChevronRight, Share2, Plane } from 'lucide-react';

export function AgentDashboard() {
  const { user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [showAISubmenu, setShowAISubmenu] = useState(false);

  React.useEffect(() => {
    if (['ai-travelbro', 'ai-social'].includes(activeSection)) {
      setShowAISubmenu(true);
    }
  }, [activeSection]);

  const sidebarItems = [
    { id: 'profile', label: 'Profiel', icon: User },
  ];

  const aiToolsItems = [
    { id: 'ai-social', label: 'Social Media', icon: Share2 },
    { id: 'ai-travelbro', label: 'AI TravelBRO', icon: Bot },
  ];

  const handleTravelStudioClick = () => {
    window.open('https://travelstudio.travelstudio-accept.bookunited.com/login', '_blank');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center" style={{ backgroundColor: '#ff7700' }}>
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <div className="font-semibold">Agent Dashboard</div>
              <div className="text-xs text-gray-400">{user?.email}</div>
            </div>
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
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}

            <li>
              <button
                onClick={() => setShowAISubmenu(!showAISubmenu)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                  ['ai-travelbro', 'ai-social'].includes(activeSection)
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Bot size={20} />
                  <span>AI Tools</span>
                </div>
                {showAISubmenu ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {showAISubmenu && (
                <ul className="mt-2 ml-6 space-y-1">
                  {aiToolsItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => setActiveSection(item.id)}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-sm ${
                            activeSection === item.id
                              ? 'bg-gray-700 text-white'
                              : 'text-gray-400 hover:text-white hover:bg-gray-700'
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

            <li>
              <button
                onClick={handleTravelStudioClick}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <Plane size={20} />
                <span>Travel Studio</span>
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={signOut}
            className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {activeSection === 'profile' && 'Profiel'}
                {activeSection === 'ai-travelbro' && 'AI TravelBRO'}
                {activeSection === 'ai-social' && 'Social Media Manager'}
              </h1>
              <p className="text-gray-600 mt-1">
                {activeSection === 'profile' && 'Beheer je profiel en instellingen'}
                {activeSection === 'ai-travelbro' && 'Your AI travel assistant'}
                {activeSection === 'ai-social' && 'Manage your social media presence'}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {activeSection === 'profile' && (
            <div className="p-6 max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border p-8">
                <div className="flex items-start space-x-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Welkom terug!</h2>
                    <p className="text-gray-600 mb-6">Hier kun je binnenkort je profiel beheren en instellingen aanpassen.</p>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                          {user?.email}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                        <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                            Agent
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Brand ID</label>
                        <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 font-mono text-sm">
                          {user?.brand_id || 'Niet gekoppeld'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2">Wat kun je hier straks doen?</h3>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Persoonlijke gegevens aanpassen</li>
                        <li>• Profielfoto uploaden</li>
                        <li>• Notificatie voorkeuren instellen</li>
                        <li>• Wachtwoord wijzigen</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'ai-travelbro' && <TravelBro />}
          {activeSection === 'ai-social' && <SocialMedia />}
        </main>
      </div>
    </div>
  );
}
