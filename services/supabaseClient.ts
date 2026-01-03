
import { createClient } from '@supabase/supabase-js';

// Fungsi helper untuk mengambil env var dengan aman di berbagai environment (Vite/CRA/Node)
const getEnv = (key: string): string => {
  try {
    // Mencoba process.env (Standard/Node/CRA)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
    // Mencoba import.meta.env (Vite)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key] as string;
    }
    // Mencoba versi VITE_ prefix jika tidak ditemukan
    const viteKey = `VITE_${key}`;
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
      // @ts-ignore
      return import.meta.env[viteKey] as string;
    }
  } catch (e) {
    console.warn(`Error accessing environment variable ${key}:`, e);
  }
  return '';
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Mengekspor status untuk digunakan di UI
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Selalu panggil createClient dengan string yang valid (meskipun placeholder)
// Ini mencegah library Supabase melempar error "supabaseUrl is required" 
// yang menghentikan eksekusi seluruh aplikasi.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
