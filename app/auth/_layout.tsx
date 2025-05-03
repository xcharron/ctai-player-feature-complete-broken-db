import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AuthLayout() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/(tabs)');
      }
    });
  }, []);

  return (
    <>
      <Stack 
        screenOptions={{ 
          headerShown: false,
          animation: 'fade',
          presentation: 'card'
        }}
      >
        <Stack.Screen 
          name="register" 
          options={{
            animationTypeForReplace: 'push'
          }}
        />
        <Stack.Screen 
          name="login"
          options={{
            animationTypeForReplace: 'pop'
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}