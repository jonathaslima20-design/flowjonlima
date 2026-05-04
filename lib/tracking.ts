export function validatePixelId(id: string | null | undefined): boolean {
  if (!id) return false;
  return /^\d{6,20}$/.test(id.trim());
}

export function validateGaId(id: string | null | undefined): boolean {
  if (!id) return false;
  return /^(G-[A-Z0-9]{4,15}|UA-\d{4,10}-\d{1,4})$/.test(id.trim());
}

export type TrackEntity = 'link' | 'social' | 'banner' | 'video' | 'pageview';

export function firePixel(event: TrackEntity, entityId: string | null) {
  if (typeof window === 'undefined') return;
  const fbq = (window as any).fbq;
  if (typeof fbq !== 'function') return;
  try {
    if (event === 'pageview') {
      fbq('track', 'PageView');
      return;
    }
    if (event === 'link') {
      fbq('track', 'Lead', { content_ids: entityId ? [entityId] : [] });
      return;
    }
    fbq('trackCustom', entityToPixelEvent(event), { entity_id: entityId });
  } catch {}
}

function entityToPixelEvent(e: TrackEntity): string {
  if (e === 'social') return 'SocialClick';
  if (e === 'banner') return 'BannerClick';
  if (e === 'video') return 'VideoPlay';
  return 'BioflowzyClick';
}

export function fireGa(event: TrackEntity, entityId: string | null) {
  if (typeof window === 'undefined') return;
  const gtag = (window as any).gtag;
  if (typeof gtag !== 'function') return;
  try {
    if (event === 'pageview') {
      gtag('event', 'page_view');
      return;
    }
    gtag('event', `${event}_click`, { entity_id: entityId });
  } catch {}
}
