'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth-context';

export type ManagedPage = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  owner_id: string | null;
};

type PageContextValue = {
  pages: ManagedPage[];
  page: ManagedPage | null;
  /** Página sendo editada no painel (perfil principal ou página extra) */
  pageId: string | null;
  /** Usuário logado; dono da conta, do plano e da pasta no storage */
  accountId: string | null;
  isMainPage: boolean;
  ready: boolean;
  setPageId: (id: string) => void;
  reloadPages: () => Promise<void>;
};

const STORAGE_KEY = 'bioflowzy.currentPage';
const PageContext = createContext<PageContextValue | null>(null);

function readStored(): string | null {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function writeStored(id: string) {
  try { localStorage.setItem(STORAGE_KEY, id); } catch {}
}

export function PageProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const [pages, setPages] = useState<ManagedPage[]>([]);
  const [pageId, setPageIdState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const reloadPages = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, owner_id')
      .or(`id.eq.${userId},owner_id.eq.${userId}`)
      .order('created_at');
    // Página principal primeiro
    const list = ((data ?? []) as ManagedPage[]).sort((a, b) => Number(!!a.owner_id) - Number(!!b.owner_id));
    setPages(list);
    setPageIdState(current => {
      const wanted = current ?? readStored();
      return list.some(p => p.id === wanted) ? wanted : userId;
    });
    setReady(true);
  }, [userId]);

  useEffect(() => { void reloadPages(); }, [reloadPages]);

  const setPageId = useCallback((id: string) => {
    setPageIdState(id);
    writeStored(id);
  }, []);

  const value = useMemo<PageContextValue>(() => {
    const page = pages.find(p => p.id === pageId) ?? null;
    return {
      pages,
      page,
      pageId,
      accountId: userId,
      isMainPage: !!pageId && pageId === userId,
      ready,
      setPageId,
      reloadPages,
    };
  }, [pages, pageId, userId, ready, setPageId, reloadPages]);

  return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
}

export function useCurrentPage(): PageContextValue {
  const ctx = useContext(PageContext);
  if (!ctx) throw new Error('useCurrentPage precisa estar dentro de PageProvider');
  return ctx;
}

/** Versão que não exige o provider (componentes usados fora do painel) */
export function useOptionalCurrentPage(): PageContextValue | null {
  return useContext(PageContext);
}

/** Id da página editada; as telas do painel só renderizam depois que ele existe */
export function usePageId(): string {
  const { pageId } = useCurrentPage();
  if (!pageId) throw new Error('Página ainda não carregada');
  return pageId;
}
