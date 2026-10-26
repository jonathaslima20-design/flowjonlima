import { isLightColor } from '@/lib/color';
import { can } from '@/lib/plans';

type BadgeProfile = { username?: string | null; plan?: string | null; plan_expires_at?: string | null; is_pro?: boolean | null; hide_branding?: boolean | null } | null | undefined;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://bioflowzy.com').replace(/\/$/, '');

// Endereço absoluto (no domínio próprio do usuário, "/" seria a própria página dele) com a origem
// marcada: cadastros vindos do selo aparecem como "badge" nas métricas do admin
function badgeHref(username?: string | null) {
  const params = new URLSearchParams({ utm_source: 'badge', utm_medium: 'bio' });
  if (username) params.set('utm_campaign', username);
  return `${SITE_URL}/?${params.toString()}`;
}

export function BioflowzyBadge({ bgColor, className = '', profile }: { bgColor?: string; className?: string; profile?: BadgeProfile }) {
  if (profile && can(profile, 'remove_logo') && profile.hide_branding) return null;

  const light = isLightColor(bgColor);
  const textColor = light ? '#000000' : '#FFFFFF';
  const badgeBg = light ? '#000000' : '#FFFFFF';
  const badgeText = light ? '#FFFFFF' : '#000000';

  return (
    <div className={`mt-10 mb-4 text-center ${className}`}>
      <a
        href={badgeHref(profile?.username)}
        target="_blank"
        rel="noopener"
        className="inline-flex items-center gap-1 text-[11px] font-bold tracking-tight"
        style={{ color: textColor, fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif' }}
      >
        <span>feito com</span>
        <span
          className="px-1.5 py-0.5"
          style={{ backgroundColor: badgeBg, color: badgeText }}
        >
          BioFlowzy
        </span>
      </a>
    </div>
  );
}
