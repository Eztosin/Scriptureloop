// SUPABASE CLIENT CONFIGURATION
// This file sets up the Supabase client for ScriptureLoop
// Handles both client-side (anon key) and server-side (service role) connections

// Required polyfill for React Native URL handling
import 'react-native-url-polyfill/auto';

// Supabase JavaScript client
import { createClient } from '@supabase/supabase-js';

// React Native async storage for session persistence
import AsyncStorage from '@react-native-async-storage/async-storage';

// ENVIRONMENT VARIABLES
// These must be set in your .env file
// EXPO_PUBLIC_* variables are safe to expose in client-side code
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// VALIDATION
// Ensure required environment variables are present
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// CLIENT-SIDE SUPABASE CLIENT
// This client uses the anonymous key and is safe for client-side use
// Row Level Security (RLS) policies control what data users can access
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use AsyncStorage to persist user sessions across app restarts
    storage: AsyncStorage,
    
    // Automatically refresh expired tokens
    autoRefreshToken: true,
    
    // Keep user logged in between app sessions
    persistSession: true,
    
    // Don't try to detect sessions from URL (not needed in mobile app)
    detectSessionInUrl: false,
  },
});

// SERVER-SIDE SERVICE CLIENT FACTORY
// Creates a client with service role key for server-side operations
// WARNING: Service role key bypasses RLS - only use in secure server environments
// Never expose service role key in client-side code!
export const createServiceClient = () => {
  // Service role key should only be available in server environments
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('Service role key not available');
  }
  
  // Create client with service role privileges
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      // Don't auto-refresh tokens for service client
      autoRefreshToken: false,
      
      // Don't persist sessions for service client
      persistSession: false
    }
  });
};