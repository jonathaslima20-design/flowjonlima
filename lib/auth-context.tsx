'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { supabase } from './supabase';

type Role = 'admin' | 'user' | null;

interface AuthState {
  userId: string | null;
  email: string | null;
  role: Role;
  ready: boolean;
}

interface AuthContextValue extends AuthState {
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    userId: null,
    email: null,
    role: null,
    ready: false,
  });
  const loadedForUser = useRef<string | null>(null);

  async function resolveRole(userId: string): Promise<Role> {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    return (data?.role as Role) ?? 'user';
  }

  async function refresh() {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) {
      loadedForUser.current = null;
      setState({ userId: null, email: null, role: null, ready: true });
      return;
    }
    if (loadedForUser.current === user.id) return;
    loadedForUser.current = user.id;
    const role = await resolveRole(user.id);
    setState({ userId: user.id, email: user.email ?? null, role, ready: true });
  }

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        const user = session?.user;
        if (!user) {
          loadedForUser.current = null;
          setState({ userId: null, email: null, role: null, ready: true });
          return;
        }
        if (loadedForUser.current === user.id && event !== 'SIGNED_IN') return;
        loadedForUser.current = user.id;
        const role = await resolveRole(user.id);
        setState({ userId: user.id, email: user.email ?? null, role, ready: true });
      })();
    });
    return () => { sub.subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    loadedForUser.current = null;
    setState({ userId: null, email: null, role: null, ready: true });
  }

  return (
    <AuthContext.Provider value={{ ...state, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
