'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from './supabase';
import { useCurrentPage } from './page-context';

// Guia inicial do painel ("Sua página está X% pronta"). Os passos são calculados no banco
// (`onboarding_status`, mesma regra do funil em Admin → Métricas); só vale para a página principal
// da conta logada.

export type StepKey = 'avatar' | 'bio' | 'link' | 'social' | 'theme' | 'shared';

export const ONBOARDING_STEPS: { key: StepKey; label: string; hint: string; href: string; cta: string }[] = [
  { key: 'avatar', label: 'Adicione sua foto', hint: 'Páginas com foto passam mais confiança.', href: '/dashboard/settings', cta: 'Enviar foto' },
  { key: 'bio', label: 'Escreva sua bio', hint: 'Uma frase dizendo quem você é ou o que vende.', href: '/dashboard/settings', cta: 'Escrever bio' },
  { key: 'link', label: 'Crie seu primeiro link', hint: 'WhatsApp, loja, agenda, cardápio… o que quiser.', href: '/dashboard/links', cta: 'Adicionar link' },
  { key: 'social', label: 'Conecte suas redes', hint: 'Instagram, TikTok, YouTube e outras.', href: '/dashboard/socials', cta: 'Adicionar redes' },
  { key: 'theme', label: 'Escolha o visual', hint: 'Troque o tema ou as cores para a página ficar com a sua cara.', href: '/dashboard/customize', cta: 'Ver temas' },
  { key: 'shared', label: 'Compartilhe sua página', hint: 'Coloque o link na bio do Instagram e no WhatsApp.', href: '', cta: 'Copiar link' },
];

export const ONBOARDING_LEVELS = [
  { min: 0, name: 'Começando' },
  { min: 3, name: 'Quase lá' },
  { min: ONBOARDING_STEPS.length, name: 'Página pronta' },
];

type Status = {
  steps: Record<StepKey, boolean>;
  created_at: string | null;
  shared_at: string | null;
  completed_at: string | null;
  dismissed_at: string | null;
};

type OnboardingValue = {
  status: Status | null;
  done: number;
  total: number;
  level: string;
  complete: boolean;
  // Guia aparece: página principal do dono, ainda não fechado nem concluído antes
  active: boolean;
  // Acabou de chegar a 100% (mostra a comemoração até fechar)
  celebrate: boolean;
  reload: () => Promise<void>;
  markShared: () => void;
  dismiss: () => void;
};

const OnboardingContext = createContext<OnboardingValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { accountId, isMainPage } = useCurrentPage();
  const path = usePathname();
  const [status, setStatus] = useState<Status | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const enabled = !!accountId && isMainPage;

  const reload = useCallback(async () => {
    if (!enabled || !accountId) { setStatus(null); return; }
    const { data } = await supabase.rpc('onboarding_status', { p_profile_id: accountId });
    const s = data as unknown as Status | null;
    if (!s) return;
    const complete = ONBOARDING_STEPS.every(st => s.steps[st.key]);
    if (complete && !s.completed_at) {
      const now = new Date().toISOString();
      await supabase.from('profile_private').update({ onboarding_completed_at: now }).eq('profile_id', accountId);
      // Contas antigas que já estavam completas não ganham comemoração
      const recent = !!s.created_at && Date.now() - new Date(s.created_at).getTime() < 30 * 86400000;
      if (recent && !s.dismissed_at) setCelebrate(true);
      s.completed_at = now;
    }
    setStatus(s);
  }, [enabled, accountId]);

  // Recarrega ao trocar de tela: os passos são feitos nas outras telas do painel
  useEffect(() => { reload(); }, [reload, path]);

  const update = useCallback((patch: Partial<Status>, column: 'onboarding_shared_at' | 'onboarding_dismissed_at') => {
    if (!accountId) return;
    const now = new Date().toISOString();
    setStatus(s => (s ? { ...s, ...patch, ...(column === 'onboarding_shared_at' ? { shared_at: now } : { dismissed_at: now }) } : s));
    supabase.from('profile_private').update({ [column]: now }).eq('profile_id', accountId).then(() => reload());
  }, [accountId, reload]);

  const markShared = useCallback(() => {
    if (!status || status.shared_at) return;
    update({ steps: { ...status.steps, shared: true } }, 'onboarding_shared_at');
  }, [status, update]);

  const dismiss = useCallback(() => {
    setCelebrate(false);
    update({}, 'onboarding_dismissed_at');
  }, [update]);

  const done = status ? ONBOARDING_STEPS.filter(s => status.steps[s.key]).length : 0;
  const total = ONBOARDING_STEPS.length;
  const level = [...ONBOARDING_LEVELS].reverse().find(l => done >= l.min)?.name ?? ONBOARDING_LEVELS[0].name;
  const complete = done === total;
  const active = enabled && !!status && !status.dismissed_at && (!status.completed_at || celebrate);

  return (
    <OnboardingContext.Provider value={{ status, done, total, level, complete, active, celebrate, reload, markShared, dismiss }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
