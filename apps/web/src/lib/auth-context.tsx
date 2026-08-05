'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createClient } from './supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null, loading: true,
  signIn: async () => {}, signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const finish = (u: User | null) => {
      setUser(u);
      setLoading(false);
    };

    // 3 秒超时保护：网络卡住时也能进入登录页
    const timeoutId = setTimeout(() => finish(null), 3000);

    supabase.auth.getSession()
      .then(({ data: { session } }) => finish(session?.user ?? null))
      .catch(() => finish(null))
      .finally(() => clearTimeout(timeoutId));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      finish(session?.user ?? null);
    });
    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string) => {
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    // 登出后跳转到首页登录
    if (typeof window !== 'undefined') window.location.href = '/flowos/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
