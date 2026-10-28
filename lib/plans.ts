// Espelha a tabela `plans` do banco (limites e preços). O banco é a fonte da
// verdade para o checkout e para os limites aplicados por trigger; aqui ficam os
// textos e valores exibidos na interface.

export type PlanSlug = 'free' | 'pro' | 'business';
export type PaidPlanSlug = Exclude<PlanSlug, 'free'>;
export type BillingPeriod = 'quarterly' | 'annual';

export type ResourceKey = 'links' | 'banners' | 'videos' | 'socials';

export type PlanLimits = {
  links: number;
  banners: number;
  videos: number;
  socials: number;
  analytics: 'basic' | 'advanced';
  analytics_days: number;
  pro_themes: boolean;
  scheduling: boolean;
  seo: boolean;
  qr_code: boolean;
  custom_domain: boolean;
  pixel_ga: boolean;
  priority_support: boolean;
  referral: boolean;
  remove_logo: boolean;
  early_access: boolean;
  leads: number;
  pages: number;
  /** Pessoas com acesso de edição às páginas da conta (convites pendentes contam) */
  members: number;
  /** Bloco de contagem regressiva na página */
  countdown: boolean;
  /** Relatório mensal por e-mail */
  monthly_report: boolean;
};

export type PlanDefinition = {
  slug: PlanSlug;
  name: string;
  // Preço total de cada pacote, em centavos (0 no Free)
  prices: Record<BillingPeriod, number>;
  tagline: string;
  // Business só aparece para compra quando os recursos dele existirem
  available: boolean;
  features: string[];
  limits: PlanLimits;
};

export const PERIOD_MONTHS: Record<BillingPeriod, number> = { quarterly: 3, annual: 12 };

export const PERIOD_LABELS: Record<BillingPeriod, { name: string; adjective: string }> = {
  quarterly: { name: 'Trimestral', adjective: 'trimestral' },
  annual: { name: 'Anual', adjective: 'anual' },
};

export const PLANS: Record<PlanSlug, PlanDefinition> = {
  free: {
    slug: 'free',
    name: 'Free',
    prices: { quarterly: 0, annual: 0 },
    tagline: 'Para começar agora',
    available: true,
    features: [
      'Links ilimitados',
      'Redes sociais ilimitadas',
      '1 banner e 1 vídeo',
      'Temas grátis',
      'Analytics dos últimos 7 dias',
    ],
    limits: {
      links: -1,
      banners: 1,
      videos: 1,
      socials: -1,
      analytics: 'basic',
      analytics_days: 7,
      pro_themes: false,
      scheduling: false,
      seo: false,
      qr_code: false,
      custom_domain: false,
      pixel_ga: false,
      priority_support: false,
      referral: false,
      remove_logo: false,
      early_access: false,
      leads: 0,
      pages: 1,
      members: 0,
      countdown: false,
      monthly_report: false,
    },
  },
  pro: {
    slug: 'pro',
    name: 'Pro',
    prices: { quarterly: 8970, annual: 23880 },
    tagline: 'Para quem quer uma página profissional',
    available: true,
    features: [
      'Tudo do Free',
      'Todos os temas e personalização completa',
      'Remoção da marca BioFlowzy',
      'Banners e vídeos ilimitados',
      'Analytics completo: visitas, origem e dispositivo',
      'Captura de leads (até 100 por mês)',
      'Agendamento de links',
      'QR code da página',
      'SEO e prévia de compartilhamento',
      'Domínio personalizado',
      'Meta Pixel e Google Analytics',
      'Indique e ganhe',
    ],
    limits: {
      links: -1,
      banners: -1,
      videos: -1,
      socials: -1,
      analytics: 'advanced',
      analytics_days: 90,
      pro_themes: true,
      scheduling: true,
      seo: true,
      qr_code: true,
      custom_domain: true,
      pixel_ga: true,
      priority_support: false,
      referral: true,
      remove_logo: true,
      early_access: false,
      leads: 100,
      pages: 1,
      members: 0,
      countdown: false,
      monthly_report: false,
    },
  },
  business: {
    slug: 'business',
    name: 'Business',
    prices: { quarterly: 17970, annual: 47880 },
    tagline: 'Para agências e negócios com várias marcas',
    available: true,
    features: [
      'Tudo do Pro',
      'Até 5 páginas',
      'Acesso para clientes e equipe',
      'Contagem regressiva para lançamentos',
      'Relatório mensal por e-mail',
      'Leads ilimitados com exportação',
      'Analytics de 1 ano com exportação',
      'Suporte prioritário no WhatsApp',
    ],
    limits: {
      links: -1,
      banners: -1,
      videos: -1,
      socials: -1,
      analytics: 'advanced',
      analytics_days: 365,
      pro_themes: true,
      scheduling: true,
      seo: true,
      qr_code: true,
      custom_domain: true,
      pixel_ga: true,
      priority_support: true,
      referral: true,
      remove_logo: true,
      early_access: true,
      leads: -1,
      pages: 5,
      members: 3,
      countdown: true,
      monthly_report: true,
    },
  },
};

export const PLAN_ORDER: PlanSlug[] = ['free', 'pro', 'business'];

export function isPlanSlug(v: any): v is PlanSlug {
  return v === 'free' || v === 'pro' || v === 'business';
}

export function brl(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Preço por mês de um pacote, para exibição ("R$ 19,90/mês no anual")
export function monthlyPrice(plan: PlanSlug, period: BillingPeriod): number {
  return Math.round(PLANS[plan].prices[period] / PERIOD_MONTHS[period]);
}

// Desconto do anual em relação a pagar o trimestral o ano todo
export function annualDiscount(plan: PaidPlanSlug): number {
  const { quarterly, annual } = PLANS[plan].prices;
  return Math.round((1 - annual / (quarterly * 4)) * 100);
}

export function getPlanFor(profile: { plan?: string | null; plan_expires_at?: string | null } | null | undefined): PlanDefinition {
  if (!profile) return PLANS.free;
  const slug = isPlanSlug(profile.plan) ? profile.plan : 'free';
  if (slug === 'free') return PLANS.free;
  if (profile.plan_expires_at) {
    const exp = new Date(profile.plan_expires_at).getTime();
    if (!Number.isNaN(exp) && exp <= Date.now()) return PLANS.free;
  }
  return PLANS[slug];
}

export function isPlanActive(profile: { plan?: string | null; plan_expires_at?: string | null } | null | undefined): boolean {
  return getPlanFor(profile).slug !== 'free';
}

export function getLimits(plan: PlanDefinition | PlanSlug): PlanLimits {
  const def = typeof plan === 'string' ? PLANS[plan] : plan;
  return def.limits;
}

export function isUnlimited(n: number): boolean {
  return n < 0;
}

export type FeatureFlag =
  | 'custom_domain'
  | 'pixel_ga'
  | 'priority_support'
  | 'referral'
  | 'remove_logo'
  | 'early_access'
  | 'pro_themes'
  | 'scheduling'
  | 'seo'
  | 'qr_code'
  | 'countdown'
  | 'monthly_report';

export function can(profile: any, feature: FeatureFlag): boolean {
  const limits = getPlanFor(profile).limits;
  return Boolean((limits as any)[feature]);
}

export function canAdd(profile: any, resource: ResourceKey, currentCount: number): boolean {
  const limit = getPlanFor(profile).limits[resource];
  if (isUnlimited(limit)) return true;
  return currentCount < limit;
}

export function limitFor(profile: any, resource: ResourceKey): number {
  return getPlanFor(profile).limits[resource];
}

export function planLabel(slug: string | null | undefined): string {
  if (!isPlanSlug(slug)) return 'Free';
  return PLANS[slug].name;
}

// Página extra (owner_id preenchido) só fica no ar enquanto o plano da conta permitir várias páginas
export function isPageLive(profile: { owner_id?: string | null; plan?: string | null; plan_expires_at?: string | null } | null | undefined): boolean {
  if (!profile?.owner_id) return true;
  const pages = getPlanFor(profile).limits.pages;
  return pages < 0 || pages > 1;
}
