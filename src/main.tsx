import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const CURRENT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const STORED_URL_KEY = 'supabase_url_v1';

const storedUrl = localStorage.getItem(STORED_URL_KEY);
if (storedUrl !== CURRENT_SUPABASE_URL) {
  console.log('🔄 Supabase URL changed, clearing all auth data...');
  console.log('Old URL:', storedUrl);
  console.log('New URL:', CURRENT_SUPABASE_URL);

  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('supabase') || key.includes('auth'))) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => {
    console.log('Removing:', key);
    localStorage.removeItem(key);
  });

  sessionStorage.clear();

  localStorage.setItem(STORED_URL_KEY, CURRENT_SUPABASE_URL);
  console.log('✅ Storage cleared, page will reload...');
  window.location.reload();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
