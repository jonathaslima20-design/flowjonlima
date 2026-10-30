'use client';

import { useEffect, useState } from 'react';
import { CreditCard, LogIn, ShieldCheck, Sparkles, UserPlus, Layers, Gift } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { brl, planLabel } from '@/lib/plans';
import type { Json } from '@/lib/database.types';

type Event = { at: string | null; kind: string; title: string; details: Json; actor: string | null };

const ADMIN_ACTIONS: Record<string, string> = {
  plan_change: 'Plano alterado pelo admin',
  promote_admin: 'Promovido a admin',
  demote_admin: 'Removido de admin',
  suspend_user: 'Conta suspensa',
  unsuspend_user: 'Conta reativada',
  impersonate_start: 'Admin entrou na conta',
  impersonate_end: 'Admin saiu da conta',
  password_recovery_sent: 'E-mail de redefinição de senha enviado',
  password_recovery_link: 'Link de redefinição de senha gerado',
  revoke_sessions: 'Desconectado de todos os aparelhos',
  update_email: 'E-mail alterado',
  confirm_email: 'E-mail confirmado manualmente',
};

const PAYMENT_STATUS: Record<string, string> = {
  pending: 'pendente', approved: 'aprovado', rejected: 'recusado', cancelled: 'cancelado',
  refunded: 'estornado', in_process: 'em análise', charged_back: 'contestado',
};

const PERIOD: Record<string, string> = { quarterly: 'trimestral', annual: 'anual' };

// Registros antigos usam pro_monthly / pro_annual
const planName = (slug: string | null | undefined) => (slug?.startsWith('pro_') ? 'Pro' : planLabel(slug));

function describe(e: Event): string {
  const d = (e.details && typeof e.details === 'object' && !Array.isArray(e.details) ? e.details : {}) as Record<string, any>;
  switch (e.kind) {
    case 'signup':
      return d.source ? `Origem: ${d.source}${d.campaign ? ` / ${d.campaign}` : ''}` : '';
    case 'payment_created':
      return `${planLabel(d.plan)} ${PERIOD[d.period] ?? d.period ?? ''} · ${brl(Number(d.amount_cents ?? 0))} · ${PAYMENT_STATUS[d.status] ?? d.status}${d.provider ? ` · ${d.provider}` : ''}`;
    case 'payment_approved':
      return `${planLabel(d.plan)} ${PERIOD[d.period] ?? d.period ?? ''} · ${brl(Number(d.amount_cents ?? 0))}${d.until ? ` · até ${new Date(d.until).toLocaleDateString('pt-BR')}` : ''}`;
    case 'page_created':
      return `@${d.username}`;
    case 'referral':
      return `@${d.username ?? '?'}${d.commission ? ` · comissão ${brl(Number(d.commission))}` : ''}`;
    case 'admin': {
      const parts: string[] = [];
      if (e.title === 'plan_change' && d.after) {
        parts.push(`${planName(d.before?.plan)} → ${planName(d.after.plan)}`);
        parts.push(d.after.plan_expires_at ? `até ${new Date(d.after.plan_expires_at).toLocaleDateString('pt-BR')}` : 'sem expiração');
      }
      if (e.title === 'update_email') parts.push(`${d.before ?? '?'} → ${d.after ?? '?'}`);
      if (e.title === 'impersonate_end' && d.minutes != null) parts.push(`${d.minutes} min${d.reason === 'expired' ? ' (expirou)' : ''}`);
      if (e.title === 'revoke_sessions' && d.sessions != null) parts.push(`${d.sessions} sessão(ões)`);
      if (d.reason && e.title !== 'impersonate_end') parts.push(`Motivo: ${d.reason}`);
      return parts.join(' · ');
    }
  }
  return '';
}

function icon(e: Event) {
  const cls = 'w-4 h-4';
  switch (e.kind) {
    case 'signup': return <UserPlus className={cls} />;
    case 'login': return <LogIn className={cls} />;
    case 'payment_created': return <CreditCard className={cls} />;
    case 'payment_approved': return <Sparkles className={cls} />;
    case 'page_created': return <Layers className={cls} />;
    case 'referral': return <Gift className={cls} />;
    default: return <ShieldCheck className={cls} />;
  }
}

const DOT: Record<string, string> = {
  signup: 'bg-biolime', login: 'bg-white', payment_created: 'bg-white', payment_approved: 'bg-biolime',
  page_created: 'bg-bioyellow', referral: 'bg-bioyellow', admin: 'bg-black text-white',
};

// Linha do tempo da conta (RPC admin_user_timeline)
export function UserTimeline({ profileId, reloadKey }: { profileId: string; reloadKey: number }) {
  const [events, setEvents] = useState<Event[] | null>(null);

  useEffect(() => {
    supabase.rpc('admin_user_timeline', { p_profile_id: profileId }).then(({ data }) => setEvents((data ?? []) as Event[]));
  }, [profileId, reloadKey]);

  if (events === null) return <p className="text-sm text-gray-400 animate-pulse">Carregando...</p>;
  if (events.length === 0) return <p className="text-sm text-gray-400">Nada registrado ainda.</p>;

  return (
    <ol className="relative border-l-2 border-black ml-3">
      {events.map((e, i) => {
        const title = e.kind === 'admin' ? (ADMIN_ACTIONS[e.title] ?? e.title) : e.title;
        const text = describe(e);
        return (
          <li key={i} className="ml-6 mb-4">
            <span className={`absolute -left-[13px] w-6 h-6 brutal-border rounded-full flex items-center justify-center ${DOT[e.kind] ?? 'bg-white'}`}>
              {icon(e)}
            </span>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-bold text-sm">{title}</span>
              {e.actor && <span className="text-[11px] text-gray-500">por @{e.actor}</span>}
            </div>
            {text && <p className="text-xs text-gray-600 break-words">{text}</p>}
            <p className="text-[11px] text-gray-400">
              {e.at ? new Date(e.at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
