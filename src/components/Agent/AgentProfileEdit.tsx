import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Award,
  Calendar,
  Star,
  Upload,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface AgentProfile {
  id?: string;
  name: string;
  email: string;
  phone: string;
  slug: string;
  bio: string;
  profile_image_url: string;
  location: string;
  specializations: string[];
  years_experience: number;
  rating: number;
  review_count: number;
  is_top_advisor: boolean;
  specialist_since: string;
  certifications: string[];
  phone_visible: boolean;
  whatsapp_enabled: boolean;
  is_published: boolean;
}

export default function AgentProfileEdit() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profile, setProfile] = useState<AgentProfile>({
    name: '',
    email: user?.email || '',
    phone: '',
    slug: '',
    bio: '',
    profile_image_url: '',
    location: '',
    specializations: [],
    years_experience: 0,
    rating: 0,
    review_count: 0,
    is_top_advisor: false,
    specialist_since: new Date().getFullYear().toString(),
    certifications: [],
    phone_visible: true,
    whatsapp_enabled: false,
    is_published: false
  });
  const [newSpecialization, setNewSpecialization] = useState('');
  const [newCertification, setNewCertification] = useState('');

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile({
          ...data,
          specializations: data.specializations || [],
          certifications: data.certifications || []
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ type: 'error', text: 'Fout bij laden van profiel' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const profileData = {
        ...profile,
        email: user?.email,
        brand_id: user?.brand_id,
        updated_at: new Date().toISOString()
      };

      if (profile.id) {
        const { error } = await supabase
          .from('agents')
          .update(profileData)
          .eq('id', profile.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('agents')
          .insert([profileData]);

        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Profiel succesvol opgeslagen!' });
      await loadProfile();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: error.message || 'Fout bij opslaan van profiel' });
    } finally {
      setSaving(false);
    }
  };

  const addSpecialization = () => {
    if (newSpecialization.trim() && !profile.specializations.includes(newSpecialization.trim())) {
      setProfile({
        ...profile,
        specializations: [...profile.specializations, newSpecialization.trim()]
      });
      setNewSpecialization('');
    }
  };

  const removeSpecialization = (spec: string) => {
    setProfile({
      ...profile,
      specializations: profile.specializations.filter(s => s !== spec)
    });
  };

  const addCertification = () => {
    if (newCertification.trim() && !profile.certifications.includes(newCertification.trim())) {
      setProfile({
        ...profile,
        certifications: [...profile.certifications, newCertification.trim()]
      });
      setNewCertification('');
    }
  };

  const removeCertification = (cert: string) => {
    setProfile({
      ...profile,
      certifications: profile.certifications.filter(c => c !== cert)
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Basis Informatie</h2>
          {profile.slug && (
            <a
              href={`/agents/${profile.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              <Eye className="w-4 h-4" />
              Bekijk publiek profiel
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Naam *
            </label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => {
                const name = e.target.value;
                setProfile({
                  ...profile,
                  name,
                  slug: profile.slug || generateSlug(name)
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Je volledige naam"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL Slug *
            </label>
            <input
              type="text"
              value={profile.slug}
              onChange={(e) => setProfile({ ...profile, slug: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="je-naam"
            />
            <p className="text-xs text-gray-500 mt-1">Je profiel wordt: /agents/{profile.slug}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 inline mr-1" />
              Telefoon *
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+31 6 12345678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Locatie *
            </label>
            <input
              type="text"
              value={profile.location}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Zwolle, Overijssel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Upload className="w-4 h-4 inline mr-1" />
              Profielfoto URL
            </label>
            <input
              type="url"
              value={profile.profile_image_url}
              onChange={(e) => setProfile({ ...profile, profile_image_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio / Over mij
            </label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Vertel wat over jezelf, je ervaring en passie voor reizen..."
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Ervaring & Expertise</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Jaren ervaring
            </label>
            <input
              type="number"
              value={profile.years_experience}
              onChange={(e) => setProfile({ ...profile, years_experience: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specialist sinds
            </label>
            <input
              type="text"
              value={profile.specialist_since}
              onChange={(e) => setProfile({ ...profile, specialist_since: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="2016"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Star className="w-4 h-4 inline mr-1" />
              Top Adviseur
            </label>
            <label className="flex items-center space-x-3 mt-2">
              <input
                type="checkbox"
                checked={profile.is_top_advisor}
                onChange={(e) => setProfile({ ...profile, is_top_advisor: e.target.checked })}
                className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">Toon TOP ADVISEUR badge</span>
            </label>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Specialisaties (bijv. Azië, Cultuurreizen)
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newSpecialization}
              onChange={(e) => setNewSpecialization(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Voeg specialisatie toe"
            />
            <button
              type="button"
              onClick={addSpecialization}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Toevoegen
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.specializations.map((spec, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {spec}
                <button
                  type="button"
                  onClick={() => removeSpecialization(spec)}
                  className="hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Award className="w-4 h-4 inline mr-1" />
            Certificaten
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newCertification}
              onChange={(e) => setNewCertification(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Thailand Specialist Certificaat"
            />
            <button
              type="button"
              onClick={addCertification}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Toevoegen
            </button>
          </div>
          <div className="space-y-2">
            {profile.certifications.map((cert, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <span className="text-sm text-gray-700">{cert}</span>
                <button
                  type="button"
                  onClick={() => removeCertification(cert)}
                  className="text-red-600 hover:text-red-800"
                >
                  Verwijder
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Privacy & Zichtbaarheid</h2>

        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={profile.phone_visible}
              onChange={(e) => setProfile({ ...profile, phone_visible: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">Telefoon zichtbaar</div>
              <div className="text-sm text-gray-600">Toon je telefoonnummer op je publieke profiel</div>
            </div>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={profile.whatsapp_enabled}
              onChange={(e) => setProfile({ ...profile, whatsapp_enabled: e.target.checked })}
              className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
            />
            <div>
              <div className="font-medium text-gray-900">WhatsApp inschakelen</div>
              <div className="text-sm text-gray-600">Toon WhatsApp contact knop op je profiel</div>
            </div>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={profile.is_published}
              onChange={(e) => setProfile({ ...profile, is_published: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">Profiel publiceren</div>
              <div className="text-sm text-gray-600">Maak je profiel publiek zichtbaar op /agents/{profile.slug}</div>
            </div>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Opslaan...' : 'Profiel Opslaan'}
        </button>
      </div>
    </div>
  );
}
