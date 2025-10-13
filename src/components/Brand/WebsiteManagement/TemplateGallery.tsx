import React, { useState, useEffect } from 'react';
import { Eye, Copy, FileText, Layout, Home, Info, Mail, Users } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface Template {
  id: string;
  title: string;
  slug: string;
  template_category: string;
  preview_image_url: string | null;
  content_json: any;
  body_html: string | null;
  created_at: string;
}

const categoryIcons: Record<string, any> = {
  home: Home,
  about: Info,
  contact: Mail,
  team: Users,
  general: FileText,
};

const categoryLabels: Record<string, string> = {
  home: 'Home Pagina\'s',
  about: 'Over Ons',
  contact: 'Contact',
  team: 'Team',
  general: 'Algemeen',
};

interface Props {
  brandId: string;
  onTemplateSelected?: () => void;
}

export function TemplateGallery({ brandId, onTemplateSelected }: Props) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('is_template', true)
        .order('template_category')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyTemplate = async (template: Template) => {
    if (!user) return;

    try {
      setCopying(template.id);

      const { error } = await supabase
        .from('pages')
        .insert({
          brand_id: brandId,
          owner_user_id: user.id,
          template_id: template.id,
          title: template.title,
          slug: `${template.slug}-${Date.now()}`,
          status: 'draft',
          content_json: template.content_json,
          body_html: template.body_html,
          is_template: false,
          template_category: template.template_category,
        });

      if (error) throw error;

      alert('Template succesvol gekopieerd naar je account!');
      if (onTemplateSelected) {
        onTemplateSelected();
      }
    } catch (error) {
      console.error('Error copying template:', error);
      alert('Er is een fout opgetreden bij het kopiëren van de template');
    } finally {
      setCopying(null);
    }
  };

  const categories = ['all', ...new Set(templates.map(t => t.template_category))];
  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.template_category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
        <Layout className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Geen templates beschikbaar</h3>
        <p className="text-gray-600">Er zijn nog geen pagina templates aangemaakt.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Pagina Templates</h2>
          <span className="text-sm text-gray-600">{templates.length} templates beschikbaar</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Alle Templates
          </button>
          {categories.filter(c => c !== 'all').map((category) => {
            const Icon = categoryIcons[category] || FileText;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                  selectedCategory === category
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon size={16} />
                <span>{categoryLabels[category] || category}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const Icon = categoryIcons[template.template_category] || FileText;
          return (
            <div key={template.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
              {template.preview_image_url ? (
                <img
                  src={template.preview_image_url}
                  alt={template.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
                  <Icon className="h-16 w-16 text-orange-600" />
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{template.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {categoryLabels[template.template_category] || template.template_category}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => copyTemplate(template)}
                    disabled={copying === template.id}
                    className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copying === template.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Kopiëren...</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>Gebruik Template</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
