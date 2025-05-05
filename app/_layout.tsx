import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { Slot, SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import { SoundProvider } from '../context/SoundContext';
import { checkAuth } from '../lib/auth';
import { StatusBar } from 'expo-status-bar';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Orbitron_400Regular,
  Orbitron_500Medium,
  Orbitron_600SemiBold,
  Orbitron_700Bold,
} from '@expo-google-fonts/orbitron';
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from '@expo-google-fonts/roboto';
import {
  RobotoSlab_400Regular,
  RobotoSlab_700Bold,
} from '@expo-google-fonts/roboto-slab';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [initialAuthCheckDone, setInitialAuthCheckDone] = useState(false);
  const router = useRouter();
  const segments = useSegments();

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

  const handleAuthRouting = useCallback(async () => {
    try {
      const { isAuthenticated } = await checkAuth();
      const currentRoute = segments[0] || '';

      if (__DEV__) console.log('Auth status:', isAuthenticated, 'Current route:', currentRoute);

      if (!isAuthenticated && currentRoute !== 'auth') {
        if (__DEV__) console.log('Redirecting to register');
        router.replace('/auth/register');
      } else if (isAuthenticated && currentRoute === 'auth') {
        if (__DEV__) console.log('Redirecting to tabs');
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/auth/register');
    } finally {
      setInitialAuthCheckDone(true);
    }
  }, [segments, router]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && !initialAuthCheckDone) {
      handleAuthRouting();
    }
  }, [fontsLoaded, fontError, initialAuthCheckDone, handleAuthRouting]);

  useEffect(() => {
    if (initialAuthCheckDone && (fontsLoaded || fontError)) {
      const timer = setTimeout(() => {
        setAppIsReady(true);
        SplashScreen.hideAsync().catch(console.warn);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialAuthCheckDone, fontsLoaded, fontError]);

  useEffect(() => {
    if (fontError) {
      console.error('Font loading error:', fontError);
    }
  }, [fontError]);

  if (!appIsReady) {
    return (
      <SoundProvider>
        <Slot />
      </SoundProvider>
    );
  }

  console.log('Initial auth check done:', appIsReady);
  return (
    <SoundProvider>
      <View style={styles.container}>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="light" />
      </View>
    </SoundProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2C3E',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
