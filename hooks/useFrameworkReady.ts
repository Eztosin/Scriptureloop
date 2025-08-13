import { useEffect } from 'react';

export function useFrameworkReady() {
  useEffect(() => {
    // Framework ready hook for React Native - no window object needed
    console.log('Framework ready');
  }, []);
}
