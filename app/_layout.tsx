import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  useEffect(() => {
    // Basic initialization for development
    console.log('ScriptureLoop starting in development mode');
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="challenge" />
        <Stack.Screen name="flashcards" />
        <Stack.Screen name="learning-path" />
        <Stack.Screen name="grace-pass" />
        <Stack.Screen name="premium" />
      </Stack>
    </>
  );
}