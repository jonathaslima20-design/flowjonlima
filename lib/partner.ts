import { supabase } from './supabase';

// Programa de parceiros: regras em admin_settings.partner_program (leitura pública, editadas em
// Admin → Parceiros → Configurações). O link /p/<code> guarda o código no navegador e o cadastro
// envia como partner_code; o banco (handle_new_user → partner_signup) faz a atribuição.

export type PartnerTier = { name: string; min: number; rate: number };
export type PartnerBonus = { clients: number; cents: number };
export type PartnerProgram = {
  enabled: boolean;
  tiers: PartnerTier[];
  recurring_months: number;
  coupon_discount_pct: number;
  hold_days: number;
  cookie_days: number;
  min_payout_cents: number;
  bonuses: PartnerBonus[];
  trial_days: number;
  trial_plan: 'pro' | 'business';
  wholesale_enabled: boolean;
  wholesale_discount_pct: number;
  wholesale_min_qty: number;
};

export const DEFAULT_PROGRAM: PartnerProgram = {
  enabled: true,
  tiers: [
    { name: 'Parceiro', min: 0, rate: 25 },
    { name: 'Prata', min: 10, rate: 30 },
    { name: 'Ouro', min: 30, rate: 35 },
    { name: 'Diamante', min: 100, rate: 40 },
  ],
  recurring_months: 0,
  coupon_discount_pct: 10,
  hold_days: 30,
  cookie_days: 60,
  min_payout_cents: 5000,
  bonuses: [{ clients: 10, cents: 15000 }, { clients: 30, cents: 50000 }],
  trial_days: 14,
  trial_plan: 'pro',
  wholesale_enabled: true,
  wholesale_discount_pct: 40,
  wholesale_min_qty: 5,
};

export async function fetchPartnerProgram(): Promise<PartnerProgram> {
  const { data } = await supabase.from('admin_settings').select('value').eq('key', 'partner_program').maybeSingle();
  return { ...DEFAULT_PROGRAM, ...((data?.value as Partial<PartnerProgram> | null) ?? {}) };
}

export const PARTNER_KINDS: Record<string, string> = {
  agency: 'Agência de marketing',
  influencer: 'Influenciador / criador',
  media: 'Mídia / veículo',
  consultant: 'Consultor / freelancer',
  other: 'Outro',
};

export const PARTNER_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Em análise', className: 'bg-bioyellow' },
  active: { label: 'Ativo', className: 'bg-biolime' },
  rejected: { label: 'Recusado', className: 'bg-red-100' },
  suspended: { label: 'Suspenso', className: 'bg-red-200' },
};

export const CLIENT_SOURCES: Record<string, string> = {
  link: 'Link',
  coupon: 'Cupom',
  invite: 'Convite',
  manual: 'Manual',
  license: 'Licença',
};

// Estados de uma linha do extrato (calculados no banco)
export const COMMISSION_STATUS: Record<string, { label: string; className: string }> = {
  hold: { label: 'A liberar', className: 'bg-bioyellow' },
  available: { label: 'Disponível', className: 'bg-biolime' },
  requested: { label: 'Em saque', className: 'bg-bioblue text-white' },
  paid: { label: 'Paga', className: 'bg-black text-white' },
  reversed: { label: 'Estornada', className: 'bg-red-100' },
};

export const COMMISSION_KINDS: Record<string, string> = {
  commission: 'Comissão',
  bonus: 'Bônus de meta',
  reversal: 'Estorno',
  adjustment: 'Ajuste',
};

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://bioflowzy.com').replace(/\/$/, '');
export const partnerLink = (code: string) => `${SITE}/p/${code}`;
export const inviteLink = (token: string) => `${SITE}/register?pi=${token}`;

const KEY = 'bioflowzy.partner';

export function storePartnerCode(code: string, days: number) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ code: code.toLowerCase(), until: Date.now() + days * 86400000 }));
  } catch {}
}

export function readPartnerCode(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { code: string; until: number };
    return v.until > Date.now() ? v.code : null;
  } catch {
    return null;
  }
}

// Nível atual e próximo a partir dos clientes pagantes ativos
export function tierFor(tiers: PartnerTier[], active: number) {
  const sorted = [...tiers].sort((a, b) => a.min - b.min);
  const current = [...sorted].reverse().find(t => active >= t.min) ?? sorted[0];
  const next = sorted.find(t => t.min > active) ?? null;
  return { current, next };
}
