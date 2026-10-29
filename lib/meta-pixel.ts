'use client';

import { supabase } from '@/lib/supabase';
import { readConsent } from '@/lib/consent';

// Meta Pixel do site BioFlowzy (Admin → Rastreamento). Não confundir com o Pixel que cada usuário
// configura para a própria página (components/bio/BioAnalytics).
// Cada evento vai para o Pixel no navegador e, nos de conversão, também para a API de Conversões
// (edge function meta-events) com o mesmo event_id, para o Meta deduplicar.

// Rotas do próprio site; qualquer outro primeiro segmento é a página de um usuário
const SITE_SEGMENTS = ['', 'login', 'register', 'forgot-password', 'dashboard', 'admin', 'exemplos', 'termos', 'privacidade', 'convite'];
const SITE_HOSTS = ['bioflowzy.com', 'netlify.app', 'localhost', '127.0.0.1', 'vercel.app'];

export function isSiteHost(host: string) {
  const h = host.toLowerCase();
  return SITE_HOSTS.some(s => h === s || h.endsWith(`.${s}`));
}

export function isSitePath(pathname: string) {
  return SITE_SEGMENTS.includes(pathname.split('/')[1] ?? '');
}

declare global {
  interface Window { fbq?: (...args: any[]) => void }
}

function cookie(name: string) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

// Identificadores do Meta no navegador (_fbp e _fbc, criados pelo Pixel); só com consentimento de marketing
export function getMetaContext() {
  if (typeof window === 'undefined' || !readConsent()?.marketing) return undefined;
  let fbc = cookie('_fbc');
  const fbclid = new URLSearchParams(window.location.search).get('fbclid');
  if (!fbc && fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`;
  return { consent: true as const, fbp: cookie('_fbp'), fbc, url: window.location.href };
}

export type MetaCustomData = {
  value?: number;
  currency?: 'BRL';
  content_name?: string;
  content_ids?: string[];
  content_type?: string;
  num_items?: number;
  payment_type?: string;
  status?: string;
};

// Dados do plano nos eventos de checkout e compra
export function planEventData(plan: string, period: string, cents: number): MetaCustomData {
  return {
    value: cents / 100,
    currency: 'BRL',
    content_ids: [`${plan}_${period}`],
    content_name: `BioFlowzy ${plan} ${period}`,
    content_type: 'product',
    num_items: 1,
  };
}

// Compra no navegador com o mesmo event_id do Purchase enviado pelo servidor (purchase_<id do pagamento>)
export function trackPurchase(paymentId: string, data: MetaCustomData) {
  trackMeta('Purchase', data, { eventId: `purchase_${paymentId}` });
}

export function trackMeta(eventName: string, customData: MetaCustomData = {}, opts: { capi?: boolean; eventId?: string } = {}) {
  if (typeof window === 'undefined') return;
  const ctx = getMetaContext();
  if (!ctx) return;
  const eventId = opts.eventId ?? `${eventName.toLowerCase()}_${crypto.randomUUID()}`;
  try { window.fbq?.('track', eventName, customData, { eventID: eventId }); } catch {}
  if (opts.capi) {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      supabase.functions.invoke('meta-events', {
        body: { action: 'track', event_name: eventName, event_id: eventId, event_source_url: ctx.url, custom_data: customData, fbp: ctx.fbp, fbc: ctx.fbc, consent: true },
      }).catch(() => {});
    });
  }
}
