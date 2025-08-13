import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from './database.types';

const supabaseUrl = 'https://rwjzgcqobathpqurjppe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3anpnY3FvYmF0aHBxdXJqcHBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTc3MzQsImV4cCI6MjA3MDQ5MzczNH0.DKjiT1xOhTfA0icy6F6WxJkJmlhtFQgXwkhUfoxempI';

// Always create client - it will work with real credentials
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Check if we have real credentials
export const isSupabaseConfigured = () => {
  console.log('Checking Supabase config:', { supabaseUrl, supabaseAnonKey: supabaseAnonKey.substring(0, 20) + '...' });
  const isConfigured = supabaseUrl.includes('rwjzgcqobathpqurjppe') && supabaseAnonKey.startsWith('eyJ');
  console.log('Is configured:', isConfigured);
  return isConfigured;
};