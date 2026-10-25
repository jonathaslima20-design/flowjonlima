'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { can } from '@/lib/plans';

export type CountdownData = { title: string | null; endsAt: string; accent: string };

const CountdownContext = createContext<CountdownData | null>(null);

// Dados do bloco a partir do perfil (só quando o plano da página inclui o recurso)
export function countdownFromProfile(profile: any): CountdownData | null {
  if (!profile?.countdown_ends_at || !can(profile, 'countdown')) return null;
  return { title: profile.countdown_title || null, endsAt: profile.countdown_ends_at, accent: profile.button_color || 'currentColor' };
}

// A página pública e as prévias do painel fornecem o bloco; os temas só o posicionam
export function CountdownProvider({ value, children }: { value: CountdownData | null; children: React.ReactNode }) {
  return <CountdownContext.Provider value={value}>{children}</CountdownContext.Provider>;
}

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { dias: Math.floor(s / 86400), horas: Math.floor((s % 86400) / 3600), min: Math.floor((s % 3600) / 60), seg: s % 60 };
}

export function PageCountdown() {
  const data = useContext(CountdownContext);
  // Só calcula no navegador: o horário do servidor geraria diferença na hidratação
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!data || now === null) return null;
  const remaining = new Date(data.endsAt).getTime() - now;
  if (!(remaining > 0)) return null;

  const p = parts(remaining);
  const units: [string, number][] = [['dias', p.dias], ['horas', p.horas], ['min', p.min], ['seg', p.seg]];

  return (
    <div
      role="timer"
      aria-label={data.title ? `${data.title}: termina em ${p.dias} dias, ${p.horas} horas e ${p.min} minutos` : undefined}
      style={{
        width: '100%',
        padding: '14px 12px',
        borderRadius: 16,
        border: '1px solid color-mix(in srgb, currentColor 18%, transparent)',
        background: 'color-mix(in srgb, currentColor 5%, transparent)',
        textAlign: 'center',
      }}
    >
      {data.title && (
        <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 8px', letterSpacing: '0.02em' }}>{data.title}</p>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        {units.map(([label, value]) => (
          <div key={label} style={{ minWidth: 54 }}>
            <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1, color: data.accent, fontVariantNumeric: 'tabular-nums' }}>
              {String(value).padStart(2, '0')}
            </div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.7 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
