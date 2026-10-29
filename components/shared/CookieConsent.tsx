'use client';

import { useEffect, useState } from 'react';
import { Cookie, X } from 'lucide-react';
import { onConsentOpen, openConsentPreferences, saveConsent, useConsent } from '@/lib/consent';

// Banner de cookies. `site`: visual do BioFlowzy. `bio`: neutro e compacto, para não brigar com o tema da página.
export function CookieConsent({ variant = 'site', policyUrl = 'https://bioflowzy.com/privacidade#cookies' }: { variant?: 'site' | 'bio'; policyUrl?: string }) {
  const { consent, ready } = useConsent();
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    if (ready && !consent) setOpen(true);
  }, [ready, consent]);

  useEffect(() => onConsentOpen(() => {
    setAnalytics(consent?.analytics ?? true);
    setMarketing(consent?.marketing ?? true);
    setCustom(true);
    setOpen(true);
  }), [consent]);

  if (!open) return null;

  function choose(a: boolean, m: boolean) {
    saveConsent({ analytics: a, marketing: m });
    setOpen(false);
    setCustom(false);
  }

  const site = variant === 'site';
  const box = site
    ? 'bg-white text-black brutal-border brutal-shadow-lg'
    : 'bg-white text-neutral-900 rounded-2xl shadow-2xl ring-1 ring-black/10';
  const btnBase = site ? 'brutal-btn px-4 py-2 text-sm' : 'rounded-full px-4 py-2 text-sm font-semibold transition-colors';
  const primary = site ? `${btnBase} bg-bioblue text-white` : `${btnBase} bg-neutral-900 text-white hover:bg-neutral-700`;
  const secondary = site ? `${btnBase} bg-white` : `${btnBase} bg-neutral-100 hover:bg-neutral-200`;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Preferências de cookies"
      className={`fixed z-[200] bottom-3 left-3 right-3 sm:left-4 sm:right-auto sm:bottom-4 sm:max-w-md ${site ? 'font-body' : 'font-sans'}`}
    >
      <div className={`${box} p-4 sm:p-5`}>
        <div className="flex items-start gap-3">
          <span className={`shrink-0 w-9 h-9 flex items-center justify-center ${site ? 'bg-bioyellow brutal-border' : 'bg-neutral-100 rounded-full'}`}>
            <Cookie className="w-4 h-4" />
          </span>
          <div className="flex-1 min-w-0">
            <p className={site ? 'font-display text-base' : 'font-bold text-sm'}>Cookies</p>
            <p className={`text-xs mt-1 ${site ? 'text-black/70' : 'text-neutral-600'}`}>
              Usamos cookies essenciais para o site funcionar e, com sua permissão, cookies de estatísticas e de marketing para medir visitas e anúncios.{' '}
              <a href={policyUrl} target="_blank" rel="noopener noreferrer" className="underline font-semibold">Saiba mais</a>
            </p>
          </div>
          {consent && (
            <button onClick={() => { setOpen(false); setCustom(false); }} aria-label="Fechar" className="shrink-0 opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {custom && (
          <div className={`mt-4 space-y-2 text-sm ${site ? '' : 'text-neutral-800'}`}>
            <Toggle label="Essenciais" hint="Login, segurança e suas preferências. Sempre ativos." checked disabled site={site} />
            <Toggle label="Estatísticas" hint="Google Analytics, para entender como a página é usada." checked={analytics} onChange={setAnalytics} site={site} />
            <Toggle label="Marketing" hint="Meta Pixel, para medir e melhorar anúncios." checked={marketing} onChange={setMarketing} site={site} />
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {custom ? (
            <button onClick={() => choose(analytics, marketing)} className={primary}>Salvar escolhas</button>
          ) : (
            <>
              <button onClick={() => choose(true, true)} className={primary}>Aceitar todos</button>
              <button onClick={() => choose(false, false)} className={secondary}>Recusar</button>
              <button onClick={() => setCustom(true)} className={`${btnBase.replace('brutal-btn', '')} underline px-2`}>Personalizar</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, hint, checked, onChange, disabled, site }: {
  label: string; hint: string; checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean; site: boolean;
}) {
  return (
    <label className={`flex items-start justify-between gap-3 p-2 ${site ? 'brutal-border' : 'rounded-xl bg-neutral-50'} ${disabled ? 'opacity-70' : 'cursor-pointer'}`}>
      <span>
        <span className="font-bold block">{label}</span>
        <span className="text-xs opacity-70">{hint}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange?.(e.target.checked)}
        className="mt-1 w-4 h-4 accent-black shrink-0"
      />
    </label>
  );
}

// Link "Preferências de cookies" (rodapé) para reabrir o banner
export function CookiePreferencesLink({ className = '', label = 'Preferências de cookies' }: { className?: string; label?: string }) {
  return (
    <button type="button" onClick={openConsentPreferences} className={className}>
      {label}
    </button>
  );
}
