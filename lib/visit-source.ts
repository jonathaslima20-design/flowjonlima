// Detecta de onde veio a visita à página pública. Ordem: utm_source, navegador
// interno dos apps (Instagram, TikTok... normalmente não enviam referrer) e, por
// fim, o domínio do referrer. Sem nada disso, a visita é "direto".

const REFERRER_SOURCES: [RegExp, string][] = [
  [/(^|\.)instagram\.com$/, 'instagram'],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, 'facebook'],
  [/(^|\.)(tiktok\.com)$/, 'tiktok'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'youtube'],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, 'x'],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, 'linkedin'],
  [/(^|\.)(threads\.net|threads\.com)$/, 'threads'],
  [/(^|\.)(wa\.me|whatsapp\.com)$/, 'whatsapp'],
  [/(^|\.)(t\.me|telegram\.org)$/, 'telegram'],
  [/(^|\.)pinterest\./, 'pinterest'],
  [/(^|\.)google\./, 'google'],
  [/(^|\.)bing\.com$/, 'bing'],
];

const IN_APP_SOURCES: [RegExp, string][] = [
  [/Instagram/i, 'instagram'],
  [/FBAN|FBAV|FB_IAB/i, 'facebook'],
  [/musical_ly|BytedanceWebview|TikTok/i, 'tiktok'],
  [/LinkedInApp/i, 'linkedin'],
  [/Threads/i, 'threads'],
];

export function detectSource(): string {
  const utm = new URLSearchParams(window.location.search).get('utm_source');
  if (utm) return utm.toLowerCase().slice(0, 40);

  const ua = navigator.userAgent;
  for (const [re, source] of IN_APP_SOURCES) if (re.test(ua)) return source;

  if (!document.referrer) return 'direto';
  let host: string;
  try {
    host = new URL(document.referrer).hostname.replace(/^www\./, '');
  } catch {
    return 'direto';
  }
  if (host === window.location.hostname.replace(/^www\./, '')) return 'direto';
  for (const [re, source] of REFERRER_SOURCES) if (re.test(host)) return source;
  return host.slice(0, 40);
}

export function detectDevice(): 'mobile' | 'tablet' | 'desktop' {
  const ua = navigator.userAgent;
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return 'tablet';
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return 'mobile';
  return 'desktop';
}
