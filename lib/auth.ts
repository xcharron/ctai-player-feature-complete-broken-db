import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

const AUTH_STORAGE_KEY = '@calltuneai:auth';

interface StoredAuthData {
  session: Session;
  lastVerified: string;
  isVerified: boolean;
}

export async function storeAuthData(session: Session, isVerified: boolean) {
  const authData: StoredAuthData = {
    session,
    lastVerified: new Date().toISOString(),
    isVerified
  };
  
  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
}

export async function getStoredAuthData(): Promise<StoredAuthData | null> {
  const data = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
  return data ? JSON.parse(data) : null;
}

export async function clearAuthData() {
  await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function checkAuth() {
  try {
    // First check local storage
    const storedAuth = await getStoredAuthData();
    
    if (storedAuth?.isVerified) {
      return { isAuthenticated: true, session: storedAuth.session };
    }

    // If not verified locally, try online verification
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const { data: userData } = await supabase
        .from('users')
        .select('is_verified')
        .eq('id', session.user.id)
        .single();

      if (userData?.is_verified) {
        // Store verification status locally for offline access
        await storeAuthData(session, true);
        return { isAuthenticated: true, session };
      }
    }

    return { isAuthenticated: false, session: null };
  } catch (error) {
    console.error('Auth check error:', error);
    // If offline, fall back to stored auth data
    const storedAuth = await getStoredAuthData();
    return {
      isAuthenticated: !!storedAuth?.isVerified,
      session: storedAuth?.session || null
    };
  }
}