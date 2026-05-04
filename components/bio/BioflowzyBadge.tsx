import Link from 'next/link';
import { isLightColor } from '@/lib/color';
import { can } from '@/lib/plans';

type BadgeProfile = { plan?: string | null; plan_expires_at?: string | null; is_pro?: boolean | null } | null | undefined;

export function BioflowzyBadge({ bgColor, className = '', profile }: { bgColor?: string; className?: string; profile?: BadgeProfile }) {
  if (profile && can(profile, 'remove_logo')) return null;

  const light = isLightColor(bgColor);
  const textColor = light ? '#000000' : '#FFFFFF';
  const badgeBg = light ? '#000000' : '#FFFFFF';
  const badgeText = light ? '#FFFFFF' : '#000000';

  return (
    <div className={`mt-10 mb-4 text-center ${className}`}>
      <Link
        href="/"
        target="_blank"
        rel="noreferrer"
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
      </Link>
    </div>
  );
}
