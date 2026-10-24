'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { supabase } from './supabase';

type Role = 'admin' | 'user' | null;

interface AuthState {
  userId: string | null;
  email: string | null;
  role: Role;
  suspended: boolean;
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
    suspended: false,
    ready: false,
  });
  const loadedForUser = useRef<string | null>(null);

  async function resolveAccess(userId: string): Promise<{ role: Role; suspended: boolean }> {
    const { data } = await supabase
      .from('profiles')
      .select('role, suspended_at')
      .eq('id', userId)
      .maybeSingle();
    return { role: (data?.role as Role) ?? 'user', suspended: !!data?.suspended_at };
  }

  async function refresh() {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) {
      loadedForUser.current = null;
      setState({ userId: null, email: null, role: null, suspended: false, ready: true });
      return;
    }
    if (loadedForUser.current === user.id) return;
    loadedForUser.current = user.id;
    const access = await resolveAccess(user.id);
    setState({ userId: user.id, email: user.email ?? null, ...access, ready: true });
  }

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        const user = session?.user;
        if (!user) {
          loadedForUser.current = null;
          setState({ userId: null, email: null, role: null, suspended: false, ready: true });
          return;
        }
        if (loadedForUser.current === user.id && event !== 'SIGNED_IN') return;
        loadedForUser.current = user.id;
        const access = await resolveAccess(user.id);
        setState({ userId: user.id, email: user.email ?? null, ...access, ready: true });
      })();
    });
    return () => { sub.subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    loadedForUser.current = null;
    setState({ userId: null, email: null, role: null, suspended: false, ready: true });
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
