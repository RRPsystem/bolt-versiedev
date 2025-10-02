import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('🚀 App starting...');
console.log('📍 Current Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('📍 Supabase Key (first 20):', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20));
console.log('📍 All env vars:', import.meta.env);

const CURRENT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const VERSION_KEY = 'app_version';
const CURRENT_VERSION = '2.0.0';

console.log('🔍 Checking localStorage...');
const storedVersion = localStorage.getItem(VERSION_KEY);
console.log('Stored version:', storedVersion);
console.log('Current version:', CURRENT_VERSION);

if (storedVersion !== CURRENT_VERSION) {
  console.log('⚠️ Version mismatch detected!');
  console.log('🧹 Clearing ALL localStorage and sessionStorage...');

  localStorage.clear();
  sessionStorage.clear();

  localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
  console.log('✅ Storage cleared!');
  console.log('🔄 Reloading page...');

  setTimeout(() => {
    window.location.href = window.location.href.split('?')[0] + '?v=' + Date.now();
  }, 100);
} else {
  console.log('✅ Version check passed, app loading normally');

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
