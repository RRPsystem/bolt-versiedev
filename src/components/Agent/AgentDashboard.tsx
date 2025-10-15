import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TravelBro } from '../Brand/AITools/TravelBro';
import { SocialMedia } from '../Brand/AITools/SocialMedia';
import { AIContentGenerator } from '../Brand/AIContentGenerator';
import AgentProfileEdit from './AgentProfileEdit';
import { HelpBot } from '../shared/HelpBot';
import { Bot, User, ChevronDown, ChevronRight, Share2, Plane, Sparkles, Import as FileImport, Map } from 'lucide-react';
import RoadmapBoard from '../Brand/RoadmapBoard';

export function AgentDashboard() {
  const { user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [showAISubmenu, setShowAISubmenu] = useState(false);

  React.useEffect(() => {
    if (['ai-content', 'ai-travelbro', 'ai-import'].includes(activeSection)) {
      setShowAISubmenu(true);
    }
  }, [activeSection]);

  const sidebarItems = [
    { id: 'profile', label: 'Profiel', icon: User },
    { id: 'social-media', label: 'Social Media', icon: Share2 },
  ];

  const aiToolsItems = [
    { id: 'ai-content', label: 'Travel Content Generator', icon: Sparkles },
    { id: 'ai-import', label: 'Reis Import', icon: FileImport },
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
                  ['ai-content', 'ai-travelbro', 'ai-import'].includes(activeSection)
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

        <div className="p-4 border-t border-gray-700 space-y-2">
          <button
            onClick={() => setActiveSection('roadmap')}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
              activeSection === 'roadmap'
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Map size={20} />
            <span>Roadmap</span>
          </button>
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
                {activeSection === 'social-media' && 'Social Media'}
                {activeSection === 'ai-content' && 'Travel Content Generator'}
                {activeSection === 'ai-import' && 'Reis Import'}
                {activeSection === 'ai-travelbro' && 'AI TravelBRO'}
                {activeSection === 'roadmap' && 'Roadmap'}
              </h1>
              <p className="text-gray-600 mt-1">
                {activeSection === 'profile' && 'Beheer je profiel en instellingen'}
                {activeSection === 'social-media' && 'Beheer je social media accounts en posts'}
                {activeSection === 'ai-content' && 'Generate travel content with AI'}
                {activeSection === 'ai-import' && 'Import travel data with AI'}
                {activeSection === 'ai-travelbro' && 'Your AI travel assistant'}
                {activeSection === 'roadmap' && 'Vote on features and track development progress'}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {activeSection === 'profile' && <AgentProfileEdit />}
          {activeSection === 'social-media' && <SocialMedia />}

          {activeSection === 'ai-content' && <AIContentGenerator />}
          {activeSection === 'ai-travelbro' && <TravelBro />}
          {activeSection === 'roadmap' && <RoadmapBoard />}
          {activeSection === 'ai-import' && (
            <div className="p-6">
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center max-w-2xl mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ff7700, #ffaa44)' }}>
                  <FileImport className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Reis Import</h2>
                <p className="text-gray-600 mb-6">Import en verwerk reisgegevens intelligent met AI</p>
                <button className="text-white px-6 py-3 rounded-lg font-medium transition-colors hover:bg-orange-700" style={{ backgroundColor: '#ff7700' }}>
                  Start Import Proces
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
      <HelpBot />
    </div>
  );
}
