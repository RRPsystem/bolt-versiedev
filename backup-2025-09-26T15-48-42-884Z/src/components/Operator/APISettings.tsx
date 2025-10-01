import React, { useState } from 'react';
import { 
  Key, 
  Eye, 
  EyeOff, 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  Globe,
  Bot,
  Map,
  Search,
  TestTube
} from 'lucide-react';

interface APIConfig {
  id: string;
  name: string;
  provider: string;
  key: string;
  status: 'active' | 'inactive' | 'error';
  lastTested: string;
  usage: {
    current: number;
    limit: number;
    cost: number;
  };
  endpoints: string[];
}

export function APISettings() {
  const [apiConfigs, setApiConfigs] = useState<APIConfig[]>([
    {
      id: 'openai',
      name: 'OpenAI API',
      provider: 'OpenAI',
      key: 'sk-proj-***************************',
      status: 'active',
      lastTested: '2 minutes ago',
      usage: {
        current: 1247,
        limit: 10000,
        cost: 24.50
      },
      endpoints: ['chat/completions', 'images/generations']
    },
    {
      id: 'google-search',
      name: 'Google Custom Search',
      provider: 'Google',
      key: 'AIza***************************',
      status: 'inactive',
      lastTested: '1 hour ago',
      usage: {
        current: 156,
        limit: 1000,
        cost: 0.00
      },
      endpoints: ['customsearch/v1']
    },
    {
      id: 'google-maps',
      name: 'Google Maps API',
      provider: 'Google',
      key: 'AIza***************************',
      status: 'error',
      lastTested: '3 hours ago',
      usage: {
        current: 89,
        limit: 2500,
        cost: 12.30
      },
      endpoints: ['maps/api/place', 'maps/api/directions']
    }
  ]);

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [testingAPI, setTestingAPI] = useState<string | null>(null);

  const handleToggleKeyVisibility = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEditKey = (id: string, currentKey: string) => {
    setEditingKey(id);
    setNewKeyValue(currentKey);
  };

  const handleSaveKey = (id: string) => {
    setApiConfigs(prev => prev.map(config => 
      config.id === id ? { ...config, key: newKeyValue } : config
    ));
    setEditingKey(null);
    setNewKeyValue('');
  };

  const handleTestAPI = async (id: string) => {
    setTestingAPI(id);
    
    // Simulate API test
    setTimeout(() => {
      setApiConfigs(prev => prev.map(config => 
        config.id === id 
          ? { 
              ...config, 
              status: Math.random() > 0.3 ? 'active' : 'error',
              lastTested: 'Just now'
            } 
          : config
      ));
      setTestingAPI(null);
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'OpenAI':
        return <Bot className="w-6 h-6 text-green-600" />;
      case 'Google':
        return <Globe className="w-6 h-6 text-blue-600" />;
      default:
        return <Key className="w-6 h-6 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">API Settings</h2>
          <p className="text-gray-600">Manage external API integrations and keys</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCw size={16} />
            <span>Test All APIs</span>
          </button>
        </div>
      </div>

      {/* API Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active APIs</p>
              <p className="text-2xl font-bold text-gray-900">
                {apiConfigs.filter(api => api.status === 'active').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total API Calls</p>
              <p className="text-2xl font-bold text-gray-900">
                {apiConfigs.reduce((sum, api) => sum + api.usage.current, 0).toLocaleString()}
              </p>
            </div>
            <RefreshCw className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Cost</p>
              <p className="text-2xl font-bold text-gray-900">Configure APIs</p>
              <p className="text-sm text-gray-500">Set up your API keys</p>
            </div>
            <Key className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* API Configurations */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">API Configurations</h3>
          <p className="text-sm text-gray-600 mt-1">Manage your external API keys and settings</p>
        </div>

        <div className="divide-y divide-gray-200">
          {apiConfigs.map((config) => (
            <div key={config.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getProviderIcon(config.provider)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900">{config.name}</h4>
                      {getStatusIcon(config.status)}
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        config.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : config.status === 'error'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {config.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Provider: {config.provider} • Last tested: {config.lastTested}
                    </p>

                    {/* API Key Management */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                      <div className="flex items-center space-x-3">
                        {editingKey === config.id ? (
                          <div className="flex-1 flex items-center space-x-2">
                            <input
                              type="text"
                              value={newKeyValue}
                              onChange={(e) => setNewKeyValue(e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                              placeholder="Enter API key..."
                            />
                            <button
                              onClick={() => handleSaveKey(config.id)}
                              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-1"
                            >
                              <Save size={14} />
                              <span>Save</span>
                            </button>
                            <button
                              onClick={() => setEditingKey(null)}
                              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center space-x-2">
                            <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm">
                              {showKeys[config.id] ? config.key : '••••••••••••••••••••••••••••••'}
                            </div>
                            <button
                              onClick={() => handleToggleKeyVisibility(config.id)}
                              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              {showKeys[config.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button
                              onClick={() => handleEditKey(config.id, config.key)}
                              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Usage Stats */}
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Usage</p>
                        <p className="text-sm font-medium">
                          {config.usage.current.toLocaleString()} / {config.usage.limit.toLocaleString()}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(config.usage.current / config.usage.limit) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Monthly Cost</p>
                        <p className="text-sm font-medium">${config.usage.cost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Endpoints</p>
                        <p className="text-sm font-medium">{config.endpoints.length} active</p>
                      </div>
                    </div>

                    {/* Endpoints */}
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">Available Endpoints</p>
                      <div className="flex flex-wrap gap-2">
                        {config.endpoints.map((endpoint, index) => (
                          <span 
                            key={index}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono"
                          >
                            {endpoint}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Google APIs zijn optioneel!</h4>
                  <p className="text-sm text-blue-800">
                    De app werkt perfect met alleen OpenAI. Google APIs voegen extra features toe:
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>• <strong>Google Search:</strong> Actuele reisinformatie</li>
                    <li>• <strong>Google Maps:</strong> Route planning en bezienswaardigheden</li>
                    <li>• <strong>Zonder Google:</strong> Alleen OpenAI content generatie</li>
                  </ul>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleTestAPI(config.id)}
                    disabled={testingAPI === config.id}
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    {testingAPI === config.id ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <TestTube size={16} />
                    )}
                    <span>Test</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Documentation Links */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">API Documentation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a 
            href="https://platform.openai.com/docs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Bot className="w-6 h-6 text-green-600" />
            <div>
              <div className="font-medium text-gray-900">OpenAI API</div>
              <div className="text-sm text-gray-500">Chat completions & image generation</div>
            </div>
          </a>
          <a 
            href="https://developers.google.com/custom-search" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Search className="w-6 h-6 text-blue-600" />
            <div>
              <div className="font-medium text-gray-900">Google Search API</div>
              <div className="text-sm text-gray-500">Custom search integration</div>
            </div>
          </a>
          <a 
            href="https://developers.google.com/maps" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Map className="w-6 h-6 text-red-600" />
            <div>
              <div className="font-medium text-gray-900">Google Maps API</div>
              <div className="text-sm text-gray-500">Places & directions</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}