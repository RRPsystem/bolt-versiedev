import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Key,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface APISetting {
  id: string;
  provider: string;
  service_name: string;
  api_key: string;
  is_active: boolean;
  last_tested: string | null;
  test_status: string;
  usage_count: number;
  metadata: any;
}

export function APISettings() {
  const [settings, setSettings] = useState<APISetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchError } = await supabase
        .from('api_settings')
        .select('*')
        .order('provider', { ascending: true });

      if (fetchError) throw fetchError;
      setSettings(data || []);
    } catch (err: any) {
      console.error('Error loading API settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateAPIKey = async (id: string, api_key: string, is_active: boolean) => {
    setSaving(id);
    setError('');
    try {
      const { error: updateError } = await supabase
        .from('api_settings')
        .update({
          api_key,
          is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setSettings(prev =>
        prev.map(s => s.id === id ? { ...s, api_key, is_active } : s)
      );

      alert('API key succesvol opgeslagen!');
    } catch (err: any) {
      console.error('Error updating API key:', err);
      setError(err.message);
      alert(`Fout bij opslaan: ${err.message}`);
    } finally {
      setSaving(null);
    }
  };

  const testAPIKey = async (setting: APISetting) => {
    if (!setting.api_key || setting.api_key.trim() === '') {
      alert('Voer eerst een API key in');
      return;
    }

    setTesting(setting.id);
    setError('');

    try {
      if (setting.provider === 'OpenAI') {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${setting.api_key}`
          }
        });

        if (response.ok) {
          const { error: updateError } = await supabase
            .from('api_settings')
            .update({
              test_status: 'success',
              last_tested: new Date().toISOString()
            })
            .eq('id', setting.id);

          if (updateError) throw updateError;

          setSettings(prev =>
            prev.map(s => s.id === setting.id ? { ...s, test_status: 'success', last_tested: new Date().toISOString() } : s)
          );

          alert('API key werkt correct!');
        } else {
          throw new Error('API key is ongeldig of heeft onvoldoende rechten');
        }
      } else {
        alert('Test functie nog niet geïmplementeerd voor deze provider');
      }
    } catch (err: any) {
      console.error('Error testing API key:', err);

      const { error: updateError } = await supabase
        .from('api_settings')
        .update({
          test_status: 'failed',
          last_tested: new Date().toISOString()
        })
        .eq('id', setting.id);

      if (!updateError) {
        setSettings(prev =>
          prev.map(s => s.id === setting.id ? { ...s, test_status: 'failed', last_tested: new Date().toISOString() } : s)
        );
      }

      alert(`API test mislukt: ${err.message}`);
    } finally {
      setTesting(null);
    }
  };

  const toggleShowKey = (id: string) => {
    setShowKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">API Instellingen</h2>
          <p className="text-gray-600 mt-1">Beheer externe API keys en configuraties</p>
        </div>
        <button
          onClick={loadSettings}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Ververs
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Fout bij laden</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {settings.map((setting) => (
          <div key={setting.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Key className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{setting.service_name}</h3>
                  <p className="text-sm text-gray-600">{setting.provider}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(setting.test_status)}
                <span className="text-sm text-gray-600">
                  {setting.test_status === 'success' ? 'Getest' :
                   setting.test_status === 'failed' ? 'Test mislukt' : 'Niet getest'}
                </span>
              </div>
            </div>

            {setting.metadata?.description && (
              <p className="text-sm text-gray-600 mb-4">{setting.metadata.description}</p>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showKey[setting.id] ? 'text' : 'password'}
                      value={setting.api_key || ''}
                      onChange={(e) => {
                        setSettings(prev =>
                          prev.map(s => s.id === setting.id ? { ...s, api_key: e.target.value } : s)
                        );
                      }}
                      placeholder="Voer API key in..."
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey(setting.id)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showKey[setting.id] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={setting.is_active}
                    onChange={(e) => {
                      setSettings(prev =>
                        prev.map(s => s.id === setting.id ? { ...s, is_active: e.target.checked } : s)
                      );
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Actief</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => updateAPIKey(setting.id, setting.api_key, setting.is_active)}
                  disabled={saving === setting.id}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving === setting.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Opslaan...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Opslaan
                    </>
                  )}
                </button>
                <button
                  onClick={() => testAPIKey(setting)}
                  disabled={testing === setting.id || !setting.api_key}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {testing === setting.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Testen...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Test Key
                    </>
                  )}
                </button>
              </div>

              {setting.last_tested && (
                <div className="text-xs text-gray-500 pt-2">
                  Laatst getest: {new Date(setting.last_tested).toLocaleString('nl-NL')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {settings.length === 0 && (
        <div className="text-center py-12">
          <Key className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Geen API instellingen gevonden</p>
        </div>
      )}
    </div>
  );
}
