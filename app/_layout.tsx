import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Image } from 'react-native';
import { 
  useFonts, 
  Inter_400Regular, 
  Inter_500Medium, 
  Inter_600SemiBold, 
  Inter_700Bold 
} from '@expo-google-fonts/inter';
import { 
  Orbitron_400Regular,
  Orbitron_500Medium,
  Orbitron_600SemiBold,
  Orbitron_700Bold
} from '@expo-google-fonts/orbitron';
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold
} from '@expo-google-fonts/roboto';
import {
  RobotoSlab_400Regular,
  RobotoSlab_700Bold
} from '@expo-google-fonts/roboto-slab';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { SoundProvider } from '../context/SoundContext';
import * as SplashScreen from 'expo-splash-screen';
import { Slot } from 'expo-router';
import { checkAuth } from '../lib/auth';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const [isRouterReady, setIsRouterReady] = useState(false);
  const [authState, setAuthState] = useState<{
    isLoading: boolean;
    isInitialized: boolean;
  }>({
    isLoading: true,
    isInitialized: false
  });

  useEffect(() => {
    // Wait for next frame to ensure router is ready
    requestAnimationFrame(() => {
      setIsRouterReady(true);
      setAuthState(prev => ({ ...prev, isInitialized: true }));
    });
  }, []);

  useEffect(() => {
    if (!isRouterReady || !authState.isInitialized) return;
    
    const checkAuthentication = async () => {
      try {
        setAuthState(prev => ({ ...prev, isLoading: true }));
        const { isAuthenticated } = await checkAuth();
        const inAuthGroup = segments[0] === 'auth';

        if (!isAuthenticated && !inAuthGroup) {
          router.replace('/auth/register');
        } else if (isAuthenticated && inAuthGroup) {
          router.replace('/(tabs)');
        }
      } finally {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkAuthentication();
  }, [segments, isRouterReady, authState.isInitialized]);

  return { isLoading: authState.isLoading };
}

export default function RootLayout() {
  useFrameworkReady();
  const { isLoading } = useProtectedRoute();
  const [isAppReady, setIsAppReady] = useState(false);
  const [initialRender, setInitialRender] = useState(true);
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Orbitron-Regular': Orbitron_400Regular,
    'Orbitron-Medium': Orbitron_500Medium,
    'Orbitron-SemiBold': Orbitron_600SemiBold,
    'Orbitron-Bold': Orbitron_700Bold,
    'Roboto-Regular': Roboto_400Regular,
    'Roboto-Medium': Roboto_500Medium,
    'Roboto-Bold': Roboto_700Bold,
    'RobotoSlab-Regular': RobotoSlab_400Regular,
    'RobotoSlab-Bold': RobotoSlab_700Bold,
  });

  useEffect(() => {
    if ((fontsLoaded || fontError) && !isLoading && initialRender) {
      setInitialRender(false);
      requestAnimationFrame(() => {
        setIsAppReady(true);
        SplashScreen.hideAsync().catch(() => {
          // Ignore errors from splash screen
        });
      });
    }
  }, [fontsLoaded, fontError, isLoading, initialRender]);

  // Keep splash screen visible while fonts are loading
  if (!isAppReady) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" translucent={false} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SoundProvider>
        <Slot />
      </SoundProvider>
      <StatusBar backgroundColor="#1A2C3E" style="light" translucent={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2C3E',
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1A2C3E',
  }
});