'use client';

import { useEffect, useState } from 'react';

// Consentimento de cookies (LGPD). Fica no navegador do visitante, por domínio: no site e em cada
// domínio próprio de usuário a escolha é separada. Essenciais (login, preferências) não dependem dele;
// estatísticas = Google Analytics; marketing = Meta Pixel / CAPI.

export type Consent = { v: 1; analytics: boolean; marketing: boolean; at: string };

const KEY = 'bf_consent';
const CHANGE_EVENT = 'bf-consent-change';
const OPEN_EVENT = 'bf-consent-open';

export function readConsent(): Consent | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.v === 1 ? parsed : null;
  } catch {
    return null;
  }
}

export function saveConsent(choice: { analytics: boolean; marketing: boolean }) {
  const value: Consent = { v: 1, analytics: choice.analytics, marketing: choice.marketing, at: new Date().toISOString() };
  try { window.localStorage.setItem(KEY, JSON.stringify(value)); } catch {}
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: value }));
}

export function openConsentPreferences() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onConsentOpen(handler: () => void) {
  window.addEventListener(OPEN_EVENT, handler);
  return () => window.removeEventListener(OPEN_EVENT, handler);
}

// Estado atual do consentimento; `ready` evita decidir antes de ler o navegador
export function useConsent() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setConsent(readConsent());
    setReady(true);
    const onChange = (e: Event) => setConsent((e as CustomEvent<Consent>).detail);
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  }, []);

  return { consent, ready };
}
