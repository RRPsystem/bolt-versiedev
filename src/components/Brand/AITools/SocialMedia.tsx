import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Plus,
  Trash2,
  Send,
  Calendar,
  Image as ImageIcon,
  Video,
  Sparkles,
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface SocialAccount {
  id: string;
  platform: string;
  platform_username: string;
  is_active: boolean;
  connected_at: string;
  api_tier?: string;
  platform_account_type?: string;
  account_notes?: string;
}

interface Post {
  id: string;
  content: string;
  platforms: string[];
  status: string;
  scheduled_for?: string;
  published_at?: string;
  created_at: string;
}

interface BrandVoice {
  voice_prompt?: string;
  writing_style?: string;
  target_audience?: string;
  always_include?: string;
}


const platformIcons = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
};

const platformColors = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
  youtube: '#FF0000',
};

export function SocialMedia() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'accounts' | 'voice'>('create');
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [brandVoice, setBrandVoice] = useState<BrandVoice>({});
  const [loading, setLoading] = useState(true);

  const [postContent, setPostContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: userData } = await supabase
        .from('users')
        .select('brand_id')
        .eq('id', user.id)
        .single();

      if (!userData?.brand_id) return;

      const [accountsRes, postsRes, voiceRes] = await Promise.all([
        supabase
          .from('social_media_accounts')
          .select('*')
          .eq('brand_id', userData.brand_id)
          .order('connected_at', { ascending: false }),

        supabase
          .from('social_media_posts')
          .select('*')
          .eq('brand_id', userData.brand_id)
          .order('created_at', { ascending: false })
          .limit(10),

        supabase
          .from('brand_voice_settings')
          .select('*')
          .eq('brand_id', userData.brand_id)
          .maybeSingle()
      ]);

      if (accountsRes.data) setAccounts(accountsRes.data);
      if (postsRes.data) setPosts(postsRes.data);
      if (voiceRes.data) setBrandVoice(voiceRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIContent = async () => {
    if (!aiTopic.trim()) {
      alert('Voer een onderwerp in voor de AI');
      return;
    }

    setIsGenerating(true);
    try {
      const platformsText = selectedPlatforms.length > 0
        ? selectedPlatforms.join(', ')
        : 'social media';

      const prompt = `
Je bent een social media content creator.
${brandVoice.voice_prompt ? `Brand voice: ${brandVoice.voice_prompt}` : ''}
${brandVoice.writing_style ? `Schrijfstijl: ${brandVoice.writing_style}` : ''}
${brandVoice.target_audience ? `Doelgroep: ${brandVoice.target_audience}` : ''}

Schrijf een aantrekkelijke social media post over: ${aiTopic}

Voor platforms: ${platformsText}

${brandVoice.always_include ? `Zorg dat je dit altijd includeert: ${brandVoice.always_include}` : ''}

Maak de post kort, krachtig en engaging. Max 280 karakters voor Twitter, iets langer mag voor andere platforms.
`.trim();

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || ''}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'Je bent een social media expert die engaging content maakt.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.8,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      const generatedContent = data.choices[0].message.content;

      setPostContent(generatedContent);
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Fout bij het genereren van content. Controleer of de OpenAI API key is ingesteld.');
    } finally {
      setIsGenerating(false);
    }
  };

  const savePost = async (status: 'draft' | 'published') => {
    if (!postContent.trim()) {
      alert('Voer content in');
      return;
    }

    if (selectedPlatforms.length === 0) {
      alert('Selecteer minimaal 1 platform');
      return;
    }

    setIsSaving(true);
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('brand_id')
        .eq('id', user?.id)
        .single();

      if (!userData?.brand_id) throw new Error('Brand ID not found');

      const { error } = await supabase
        .from('social_media_posts')
        .insert({
          brand_id: userData.brand_id,
          created_by: user?.id,
          content: postContent,
          platforms: selectedPlatforms,
          status: status,
          published_at: status === 'published' ? new Date().toISOString() : null
        });

      if (error) throw error;

      alert(status === 'draft' ? 'Post opgeslagen als concept' : 'Post gepubliceerd!');
      setPostContent('');
      setAiTopic('');
      loadData();
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Fout bij opslaan');
    } finally {
      setIsSaving(false);
    }
  };

  const saveBrandVoice = async () => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('brand_id')
        .eq('id', user?.id)
        .single();

      if (!userData?.brand_id) throw new Error('Brand ID not found');

      const { error } = await supabase
        .from('brand_voice_settings')
        .upsert({
          brand_id: userData.brand_id,
          ...brandVoice
        });

      if (error) throw error;

      alert('Brand voice instellingen opgeslagen!');
    } catch (error) {
      console.error('Error saving brand voice:', error);
      alert('Fout bij opslaan');
    }
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle2 size={16} className="text-green-500" />;
      case 'failed': return <XCircle size={16} className="text-red-500" />;
      case 'scheduled': return <Clock size={16} className="text-blue-500" />;
      default: return <Clock size={16} className="text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-orange-600" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex space-x-4 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'create'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Post Maken
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'accounts'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Accounts ({accounts.length})
        </button>
        <button
          onClick={() => setActiveTab('voice')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'voice'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Brand Voice
        </button>
      </div>

      {activeTab === 'create' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">AI Content Generator</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Onderwerp voor AI
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Bijv: Lancering nieuwe collectie, zomervakantie tips..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  onClick={generateAIContent}
                  disabled={isGenerating || !aiTopic.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Bezig...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      <span>Genereer met AI</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Post Content
              </label>
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Schrijf je post of laat AI het voor je maken..."
              />
              <div className="text-xs text-gray-500 mt-1">
                {postContent.length} karakters
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Selecteer Platforms
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(platformIcons).map(([platform, Icon]) => {
                  const isConnected = accounts.some(acc => acc.platform === platform && acc.is_active);
                  const isSelected = selectedPlatforms.includes(platform);

                  return (
                    <button
                      key={platform}
                      onClick={() => isConnected && togglePlatform(platform)}
                      disabled={!isConnected}
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-orange-600 bg-orange-50'
                          : isConnected
                          ? 'border-gray-200 hover:border-gray-300'
                          : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <Icon
                        size={32}
                        style={{ color: platformColors[platform as keyof typeof platformColors] }}
                        className="mx-auto"
                      />
                      <div className="text-xs mt-2 capitalize font-medium">
                        {platform}
                      </div>
                      {!isConnected && (
                        <div className="text-xs text-red-500 mt-1">
                          Niet verbonden
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 size={16} className="text-orange-600" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => savePost('draft')}
                disabled={isSaving}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Opslaan als Concept
              </button>
              <button
                onClick={() => savePost('published')}
                disabled={isSaving}
                className="flex-1 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Bezig...</span>
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    <span>Publiceer Nu</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Recente Posts</h3>
            {posts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nog geen posts gemaakt</p>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(post.status)}
                        <span className="text-sm font-medium capitalize">{post.status}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(post.created_at).toLocaleDateString('nl-NL')}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">{post.content}</p>
                    <div className="flex space-x-2">
                      {(post.platforms as string[]).map((platform) => {
                        const Icon = platformIcons[platform as keyof typeof platformIcons];
                        return Icon ? (
                          <Icon
                            key={platform}
                            size={16}
                            style={{ color: platformColors[platform as keyof typeof platformColors] }}
                          />
                        ) : null;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'accounts' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Social Media Accounts</h3>
            <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center space-x-2">
              <Plus size={20} />
              <span>Account Toevoegen</span>
            </button>
          </div>

          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Nog geen accounts verbonden</p>
              <button className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                Verbind je eerste account
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => {
                const Icon = platformIcons[account.platform as keyof typeof platformIcons];
                return (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      {Icon && (
                        <Icon
                          size={32}
                          style={{ color: platformColors[account.platform as keyof typeof platformColors] }}
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <div className="font-medium capitalize">{account.platform}</div>
                          {account.api_tier && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded font-medium capitalize">
                              {account.api_tier} API
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">@{account.platform_username}</div>
                        {account.platform_account_type && (
                          <div className="text-xs text-gray-400 mt-1">{account.platform_account_type}</div>
                        )}
                        {account.account_notes && (
                          <div className="text-xs text-gray-500 mt-1 italic">{account.account_notes}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          account.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {account.is_active ? 'Actief' : 'Inactief'}
                      </span>
                      <button
                        onClick={() => {
                          alert('Edit functionaliteit komt eraan!');
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Settings size={18} />
                      </button>
                      <button className="text-red-600 hover:text-red-700">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Je Eigen Platform Accounts</h4>
                <p className="text-sm text-blue-800 mb-3">
                  Je verbindt jouw eigen social media accounts met deze tool. Kosten voor API toegang betaal je
                  direct aan het platform (Facebook, Twitter, etc.), niet aan ons. Wij helpen je alleen alles op één plek te beheren.
                </p>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Platform API Tiers:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• <strong>Facebook/Instagram:</strong> Gratis API of Meta Business Suite ($)</li>
                    <li>• <strong>Twitter/X:</strong> Free tier, Basic ($100/maand), Pro ($5000/maand)</li>
                    <li>• <strong>LinkedIn:</strong> Marketing API (Enterprise)</li>
                    <li>• <strong>TikTok:</strong> Business API (Betaald)</li>
                  </ul>
                </div>
                <p className="text-sm text-blue-800 mt-3">
                  Bij elk account kun je aangeven welk tier je daar hebt, zodat je weet wat je mogelijkheden zijn.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'voice' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Brand Voice Instellingen</h3>
          <p className="text-sm text-gray-600 mb-6">
            Configureer hoe AI content moet genereren voor jouw brand. Deze instellingen worden
            gebruikt bij het maken van social media posts.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand Voice Prompt
              </label>
              <textarea
                value={brandVoice.voice_prompt || ''}
                onChange={(e) => setBrandVoice({ ...brandVoice, voice_prompt: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Bijv: Wij zijn een luxe reismerk met een avontuurlijke en inspirerende toon. Onze posts zijn altijd positief en nodigen uit tot actie..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schrijfstijl
              </label>
              <select
                value={brandVoice.writing_style || 'professional'}
                onChange={(e) => setBrandVoice({ ...brandVoice, writing_style: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="professional">Professioneel</option>
                <option value="casual">Casual</option>
                <option value="friendly">Vriendelijk</option>
                <option value="formal">Formeel</option>
                <option value="enthusiastic">Enthousiast</option>
                <option value="luxurious">Luxe</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Doelgroep
              </label>
              <input
                type="text"
                value={brandVoice.target_audience || ''}
                onChange={(e) => setBrandVoice({ ...brandVoice, target_audience: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Bijv: Jonge professionals 25-40 jaar die van reizen houden"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Altijd Toevoegen
              </label>
              <input
                type="text"
                value={brandVoice.always_include || ''}
                onChange={(e) => setBrandVoice({ ...brandVoice, always_include: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Bijv: #TravelBro #ReisMeer, website link, etc."
              />
            </div>

            <button
              onClick={saveBrandVoice}
              className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
            >
              Instellingen Opslaan
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
