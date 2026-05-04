export type PlanSlug = 'free' | 'pro_monthly' | 'pro_annual';

export type ResourceKey = 'links' | 'banners' | 'videos' | 'socials';

export type PlanLimits = {
  links: number;
  banners: number;
  videos: number;
  socials: number;
  analytics: 'basic' | 'advanced';
  custom_domain: boolean;
  pixel_ga: boolean;
  priority_support: boolean;
  referral: boolean;
  remove_logo: boolean;
  early_access: boolean;
};

export type PlanDefinition = {
  slug: PlanSlug;
  name: string;
  priceCents: number;
  billingPeriod: 'free' | 'monthly' | 'annual';
  priceLabel: string;
  periodLabel: string;
  highlight?: boolean;
  badge?: string;
  features: string[];
  limits: PlanLimits;
};

export const PLANS: Record<PlanSlug, PlanDefinition> = {
  free: {
    slug: 'free',
    name: 'Free',
    priceCents: 0,
    billingPeriod: 'free',
    priceLabel: 'R$ 0',
    periodLabel: 'sempre',
    features: [
      '3 links',
      '2 links sociais',
      '1 banner',
      '1 vídeo',
      'Analytics básico',
    ],
    limits: {
      links: 3,
      banners: 1,
      videos: 1,
      socials: 2,
      analytics: 'basic',
      custom_domain: false,
      pixel_ga: false,
      priority_support: false,
      referral: false,
      remove_logo: false,
      early_access: false,
    },
  },
  pro_monthly: {
    slug: 'pro_monthly',
    name: 'Pro Mensal',
    priceCents: 2900,
    billingPeriod: 'monthly',
    priceLabel: 'R$ 29',
    periodLabel: '/mês',
    highlight: true,
    badge: 'Mais popular',
    features: [
      'Links sociais ilimitados',
      'Links ilimitados',
      'Vídeos ilimitados',
      'Banners ilimitados',
      'Domínio personalizado',
      'Meta Pixel e Google Analytics',
      'Suporte prioritário',
      'Indique e ganhe',
    ],
    limits: {
      links: -1,
      banners: -1,
      videos: -1,
      socials: -1,
      analytics: 'advanced',
      custom_domain: true,
      pixel_ga: true,
      priority_support: true,
      referral: true,
      remove_logo: false,
      early_access: false,
    },
  },
  pro_annual: {
    slug: 'pro_annual',
    name: 'Pro Anual',
    priceCents: 27900,
    billingPeriod: 'annual',
    priceLabel: 'R$ 279',
    periodLabel: '/ano',
    badge: 'Economize 20%',
    features: [
      'Tudo do Pro Mensal',
      'Remoção da logo Bioflowzy',
      'Desconto de 20%',
      'Acesso antecipado a novos recursos',
    ],
    limits: {
      links: -1,
      banners: -1,
      videos: -1,
      socials: -1,
      analytics: 'advanced',
      custom_domain: true,
      pixel_ga: true,
      priority_support: true,
      referral: true,
      remove_logo: true,
      early_access: true,
    },
  },
};

export const PLAN_ORDER: PlanSlug[] = ['free', 'pro_monthly', 'pro_annual'];

export function isPlanSlug(v: any): v is PlanSlug {
  return v === 'free' || v === 'pro_monthly' || v === 'pro_annual';
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
  | 'early_access';

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
