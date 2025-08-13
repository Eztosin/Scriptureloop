import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View, Text } from 'react-native';
import { supabase } from '../lib/supabase';
import { revenueCatService } from '../services/revenueCatService';

export default function Index() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    checkAuthState();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/auth');
      } else if (event === 'SIGNED_IN' && session) {
        router.replace('/(tabs)');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Wait for router to be ready
      setTimeout(async () => {
        if (session) {
          // Initialize RevenueCat for existing session
          await revenueCatService.initialize(session.user.id);
          router.replace('/(tabs)');
        } else {
          router.replace('/auth');
        }
        setIsReady(true);
      }, 100);
    } catch (error) {
      console.error('Auth check error:', error);
      setTimeout(() => {
        router.replace('/auth');
        setIsReady(true);
      }, 100);
    }
  };

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E3A8A' }}>
        <Text style={{ color: 'white', fontSize: 24 }}>📖</Text>
        <Text style={{ color: 'white', fontSize: 18, marginTop: 8 }}>ScriptureLoop</Text>
      </View>
    );
  }

  return null;
}