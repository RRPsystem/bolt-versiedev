import React, { useState, useEffect } from 'react';
import { Grid3x3, Wrench } from 'lucide-react';
import { generateBuilderJWT, generateBuilderDeeplink } from '../../../lib/jwtHelper';
import { useAuth } from '../../../contexts/AuthContext';
import { TemplateGallery } from './TemplateGallery';

interface Props {
  brandId?: string;
  onPageCreated?: () => void;
}

export function NewPage({ brandId: propBrandId, onPageCreated }: Props = {}) {
  const [initialPageCount, setInitialPageCount] = useState<number | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!propBrandId) return;

    const loadPageCount = async () => {
      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pages-api?brand_id=${propBrandId}`;
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const count = data.items?.length || 0;

          if (initialPageCount === null) {
            setInitialPageCount(count);
          } else if (count > initialPageCount && onPageCreated) {
            onPageCreated();
          }
        }
      } catch (error) {
        console.error('Error loading page count:', error);
      }
    };

    loadPageCount();
    const interval = setInterval(loadPageCount, 3000);

    return () => clearInterval(interval);
  }, [propBrandId, initialPageCount, onPageCreated]);

  const handleOpenPageBuilder = async () => {
    if (!propBrandId) {
      alert('Brand ID ontbreekt. Kan de builder niet openen.');
      return;
    }

    if (!user?.id) {
      alert('Gebruiker ID ontbreekt. Probeer opnieuw in te loggen.');
      return;
    }

    try {
      const jwtResponse = await generateBuilderJWT(propBrandId, user.id, undefined, { forceBrandId: true });
      if (jwtResponse.url) {
        window.open(jwtResponse.url, '_blank');
      } else {
        const deeplink = generateBuilderDeeplink(propBrandId, jwtResponse.token);
        window.open(deeplink, '_blank');
      }
    } catch (error) {
      console.error('Error opening builder:', error);
      alert('Kon de builder niet openen: ' + (error as Error).message);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nieuwe Pagina Maken</h1>
          <p className="text-gray-600">Kies een kant-en-klare template of bouw zelf een pagina met de pagebuilder</p>
        </div>

        {/* Two main options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Pagebuilder Option */}
          <div className="bg-white rounded-lg border-2 border-dashed border-transparent hover:border-orange-400 p-8 text-center transition-colors cursor-pointer">
            <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-orange-100 flex items-center justify-center">
              <Grid3x3 className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Pagebuilder</h3>
            <p className="text-gray-600 mb-6">Bouw je pagina helemaal zelf met drag-and-drop blokken</p>
            <button
              onClick={handleOpenPageBuilder}
              className="inline-flex items-center space-x-2 px-6 py-3 text-white rounded-lg font-medium transition-colors hover:bg-orange-700"
              style={{ backgroundColor: '#ff7700' }}
            >
              <Wrench size={18} />
              <span>Start met Bouwen</span>
            </button>
          </div>

          {/* Templates Option */}
          <div className="bg-white rounded-lg border-2 border-dashed border-transparent hover:border-blue-400 p-8 text-center transition-colors cursor-pointer">
            <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-blue-100 flex items-center justify-center">
              <Grid3x3 className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Kant-en-klare Templates</h3>
            <p className="text-gray-600 mb-6">Kies uit professionele templates en pas ze aan naar jouw wensen</p>
            <button className="inline-flex items-center space-x-2 px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-medium transition-colors hover:bg-blue-50">
              <span>Bekijk Templates Hieronder</span>
            </button>
          </div>
        </div>

        {/* Template Gallery - Real templates from database */}
        {propBrandId && (
          <TemplateGallery
            brandId={propBrandId}
            onTemplateSelected={onPageCreated}
          />
        )}
      </div>
    </div>
  );
}
