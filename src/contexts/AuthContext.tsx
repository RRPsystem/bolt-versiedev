import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types/database';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isBrand: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    if (supabase) {
      setLoading(true);
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setLoading(false);
        }
      });

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    } else {
      // No Supabase configuration, just set loading to false
      setUser(null);
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (userId: string) => {
    console.log('[DEBUG] fetchUserProfile - using hardcoded data temporarily');

    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const mockUsers: Record<string, any> = {
        '324acef5-a7dd-4f4b-8c8c-43f223d62a07': {
          id: '324acef5-a7dd-4f4b-8c8c-43f223d62a07',
          email: 'admin@travel.com',
          role: 'admin',
          brand_id: null
        },
        'a2cbb78c-0e98-478a-89f4-58dc8debf057': {
          id: 'a2cbb78c-0e98-478a-89f4-58dc8debf057',
          email: 'brand@travel.com',
          role: 'brand',
          brand_id: '123e4567-e89b-12d3-a456-426614174000'
        },
        'e45c912d-c67c-4d50-a485-d79a72cec63e': {
          id: 'e45c912d-c67c-4d50-a485-d79a72cec63e',
          email: 'operator@travel.com',
          role: 'operator',
          brand_id: null
        }
      };

      const userData = mockUsers[userId];
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('[DEBUG] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('[DEBUG] signIn called with email:', email);
    console.log('[DEBUG] Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

    if (!supabase) {
      console.error('[DEBUG] Supabase client not initialized');
      throw new Error('Invalid email or password');
    }

    console.log('[DEBUG] Calling supabase.auth.signInWithPassword...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('[DEBUG] signInWithPassword response data:', data);
    console.log('[DEBUG] signInWithPassword response error:', error);

    if (error) throw error;
  };

  const signOut = async () => {
    setUser(null);
    if (!supabase) return;
    
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Signout error:', error);
  };

  const isAdmin = user?.role === 'admin';
  const isBrand = user?.role === 'brand';
  const isOperator = user?.role === 'operator';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signOut,
      isAdmin,
      isBrand,
      isOperator
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}