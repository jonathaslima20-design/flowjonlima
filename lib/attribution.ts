// Origem da primeira visita (utm_source/utm_campaign ou o site que trouxe a pessoa), guardada
// no navegador por 30 dias e enviada no cadastro (profiles.signup_source / signup_campaign)

const KEY = 'bioflowzy.attribution';
const TTL_MS = 30 * 24 * 3600 * 1000;

export type Attribution = { source: string; campaign: string | null; at: number };

function clean(v: string | null | undefined, max: number) {
  const s = (v ?? '').toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, max);
  return s || null;
}

function referrerSource(): string | null {
  try {
    if (!document.referrer) return null;
    const host = new URL(document.referrer).hostname.replace(/^www\./, '');
    if (host === window.location.hostname.replace(/^www\./, '')) return null;
    return clean(host.split('.').slice(-2, -1)[0] || host, 40);
  } catch {
    return null;
  }
}

export function readAttribution(): Attribution | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const a = JSON.parse(raw) as Attribution;
    return Date.now() - a.at < TTL_MS ? a : null;
  } catch {
    return null;
  }
}

// Primeiro toque vence: não sobrescreve uma origem ainda válida
export function captureAttribution() {
  if (typeof window === 'undefined' || readAttribution()) return;
  const params = new URLSearchParams(window.location.search);
  const source = clean(params.get('utm_source'), 40) ?? referrerSource();
  if (!source) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ source, campaign: clean(params.get('utm_campaign'), 60), at: Date.now() }));
  } catch {}
}
