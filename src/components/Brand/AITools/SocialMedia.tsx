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
  Crown,
  Zap,
  AlertCircle
} from 'lucide-react';

interface SocialAccount {
  id: string;
  platform: string;
  platform_username: string;
  is_active: boolean;
  connected_at: string;
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

interface TierLimits {
  tier: string;
  posts_per_month: number;
  max_platforms: number;
  can_schedule: boolean;
  can_use_analytics: boolean;
  ai_generations_per_month: number;
  price_per_month: number;
  features: string[];
}

interface BrandData {
  social_media_tier: string;
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
  const [activeTab, setActiveTab] = useState<'create' | 'accounts' | 'voice' | 'subscription'>('create');
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [brandVoice, setBrandVoice] = useState<BrandVoice>({});
  const [loading, setLoading] = useState(true);

  const [postContent, setPostContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [brandTier, setBrandTier] = useState<string>('free');
  const [tierLimits, setTierLimits] = useState<TierLimits | null>(null);
  const [allTiers, setAllTiers] = useState<TierLimits[]>([]);
  const [monthlyPostCount, setMonthlyPostCount] = useState(0);
  const [monthlyAiCount, setMonthlyAiCount] = useState(0);

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

      const [accountsRes, postsRes, voiceRes, brandRes, tiersRes] = await Promise.all([
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
          .maybeSingle(),

        supabase
          .from('brands')
          .select('social_media_tier')
          .eq('id', userData.brand_id)
          .single(),

        supabase
          .from('social_media_tier_limits')
          .select('*')
          .order('price_per_month', { ascending: true })
      ]);

      if (accountsRes.data) setAccounts(accountsRes.data);
      if (postsRes.data) setPosts(postsRes.data);
      if (voiceRes.data) setBrandVoice(voiceRes.data);
      if (brandRes.data) {
        setBrandTier(brandRes.data.social_media_tier || 'free');
        const currentTier = tiersRes.data?.find(t => t.tier === brandRes.data.social_media_tier);
        if (currentTier) setTierLimits(currentTier);
      }
      if (tiersRes.data) setAllTiers(tiersRes.data);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: postsThisMonth } = await supabase
        .from('social_media_posts')
        .select('id, ai_generated')
        .eq('brand_id', userData.brand_id)
        .gte('created_at', startOfMonth.toISOString())
        .in('status', ['published', 'scheduled']);

      if (postsThisMonth) {
        setMonthlyPostCount(postsThisMonth.length);
        setMonthlyAiCount(postsThisMonth.filter(p => p.ai_generated).length);
      }
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

    if (tierLimits && monthlyAiCount >= tierLimits.ai_generations_per_month) {
      alert(`Je hebt je limiet van ${tierLimits.ai_generations_per_month} AI generaties deze maand bereikt. Upgrade je plan voor meer!`);
      setActiveTab('subscription');
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
      setMonthlyAiCount(prev => prev + 1);
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

    if (status === 'published' && tierLimits && monthlyPostCount >= tierLimits.posts_per_month) {
      alert(`Je hebt je limiet van ${tierLimits.posts_per_month} posts deze maand bereikt. Upgrade je plan voor meer!`);
      setActiveTab('subscription');
      return;
    }

    if (selectedPlatforms.length > (tierLimits?.max_platforms || 2)) {
      alert(`Je plan ondersteunt maximaal ${tierLimits?.max_platforms || 2} platforms. Upgrade voor meer!`);
      setActiveTab('subscription');
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

      const wasAiGenerated = monthlyAiCount > 0 && postContent.length > 50;

      const { error } = await supabase
        .from('social_media_posts')
        .insert({
          brand_id: userData.brand_id,
          created_by: user?.id,
          content: postContent,
          platforms: selectedPlatforms,
          status: status,
          published_at: status === 'published' ? new Date().toISOString() : null,
          ai_generated: wasAiGenerated
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
        <button
          onClick={() => setActiveTab('subscription')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'subscription'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Crown size={16} />
            <span>Abonnement</span>
          </div>
        </button>
      </div>

      {tierLimits && (
        <div className="mb-6 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Crown size={20} className="text-orange-600" />
                <span className="font-semibold text-gray-900 capitalize">{brandTier} Plan</span>
              </div>
              <div className="text-sm text-gray-600">
                {monthlyPostCount}/{tierLimits.posts_per_month} posts deze maand
              </div>
              <div className="text-sm text-gray-600">
                •
              </div>
              <div className="text-sm text-gray-600">
                {monthlyAiCount}/{tierLimits.ai_generations_per_month} AI generaties
              </div>
            </div>
            {brandTier === 'free' && (
              <button
                onClick={() => setActiveTab('subscription')}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium flex items-center space-x-2"
              >
                <Zap size={16} />
                <span>Upgrade</span>
              </button>
            )}
          </div>
        </div>
      )}

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
                      <div>
                        <div className="font-medium capitalize">{account.platform}</div>
                        <div className="text-sm text-gray-500">@{account.platform_username}</div>
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
            <h4 className="font-medium text-blue-900 mb-2">OAuth Verbinding Instructies</h4>
            <p className="text-sm text-blue-800">
              Om accounts te verbinden moet je OAuth setup configureren voor elk platform.
              Dit vereist API credentials van Facebook, Twitter, LinkedIn, etc.
            </p>
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

      {activeTab === 'subscription' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-2xl font-bold mb-2">Kies je Social Media Plan</h3>
            <p className="text-gray-600 mb-6">Selecteer het plan dat bij je behoeften past</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {allTiers.map((tier) => {
                const isCurrentPlan = tier.tier === brandTier;
                const isUpgrade = tier.price_per_month > (tierLimits?.price_per_month || 0);

                return (
                  <div
                    key={tier.tier}
                    className={`relative border-2 rounded-lg p-6 transition-all ${
                      isCurrentPlan
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    {isCurrentPlan && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-orange-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                          Huidig
                        </span>
                      </div>
                    )}

                    <div className="mb-4">
                      <h4 className="text-xl font-bold capitalize mb-2">{tier.tier}</h4>
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold">€{tier.price_per_month}</span>
                        <span className="text-gray-600 ml-2">/maand</span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center space-x-2 text-sm">
                        <CheckCircle2 size={16} className="text-green-600" />
                        <span>{tier.posts_per_month === 999999 ? 'Onbeperkt' : tier.posts_per_month} posts/maand</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <CheckCircle2 size={16} className="text-green-600" />
                        <span>{tier.max_platforms} platforms</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <CheckCircle2 size={16} className="text-green-600" />
                        <span>{tier.ai_generations_per_month === 999999 ? 'Onbeperkte' : tier.ai_generations_per_month} AI generaties</span>
                      </div>
                      {tier.can_schedule && (
                        <div className="flex items-center space-x-2 text-sm">
                          <CheckCircle2 size={16} className="text-green-600" />
                          <span>Post scheduling</span>
                        </div>
                      )}
                      {tier.can_use_analytics && (
                        <div className="flex items-center space-x-2 text-sm">
                          <CheckCircle2 size={16} className="text-green-600" />
                          <span>Analytics</span>
                        </div>
                      )}
                      {tier.can_bulk_post && (
                        <div className="flex items-center space-x-2 text-sm">
                          <CheckCircle2 size={16} className="text-green-600" />
                          <span>Bulk posting</span>
                        </div>
                      )}
                    </div>

                    {isCurrentPlan ? (
                      <button
                        disabled
                        className="w-full py-2 bg-gray-300 text-gray-600 rounded-lg font-medium cursor-not-allowed"
                      >
                        Huidig Plan
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            const { data: userData } = await supabase
                              .from('users')
                              .select('brand_id')
                              .eq('id', user?.id)
                              .single();

                            if (!userData?.brand_id) throw new Error('Brand ID not found');

                            const { error } = await supabase
                              .from('brands')
                              .update({ social_media_tier: tier.tier })
                              .eq('id', userData.brand_id);

                            if (error) throw error;

                            alert(`Geüpgraded naar ${tier.tier} plan!`);
                            loadData();
                          } catch (error) {
                            console.error('Error upgrading:', error);
                            alert('Fout bij upgraden');
                          }
                        }}
                        className={`w-full py-2 rounded-lg font-medium transition-colors ${
                          isUpgrade
                            ? 'bg-orange-600 text-white hover:bg-orange-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {isUpgrade ? 'Upgrade' : 'Downgrade'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle size={24} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Account Tiers per Platform</h4>
                <p className="text-sm text-blue-800 mb-3">
                  Elk social media platform heeft ook zijn eigen API tiers. Voor volledige functionaliteit heb je mogelijk
                  betaalde accounts nodig bij de platforms zelf:
                </p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Facebook/Instagram:</strong> Gratis API (beperkt) of Meta Business API (betaald)</li>
                  <li>• <strong>Twitter/X:</strong> Free, Basic ($100/maand), Pro ($5000/maand)</li>
                  <li>• <strong>LinkedIn:</strong> LinkedIn Marketing API (betaald, enterprise)</li>
                  <li>• <strong>TikTok:</strong> TikTok Business API (betaald)</li>
                </ul>
                <p className="text-sm text-blue-800 mt-3">
                  Deze platform kosten zijn gescheiden van je abonnement hier. Je kunt in je account settings
                  aangeven welk API tier je per platform gebruikt.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
