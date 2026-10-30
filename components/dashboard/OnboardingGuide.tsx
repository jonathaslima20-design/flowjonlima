'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronRight, Copy, ExternalLink, PartyPopper, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { ONBOARDING_LEVELS, ONBOARDING_STEPS, useOnboarding } from '@/lib/onboarding';
import { BioPreview } from '@/components/dashboard/BioPreview';
import { IconWhatsapp } from '@/lib/social-icons';

const SITE = 'bioflowzy.com';

// Botões de compartilhar (passo "Compartilhe" e comemoração)
export function ShareButtons({ username, compact }: { username: string; compact?: boolean }) {
  const { markShared } = useOnboarding();
  const url = `https://${SITE}/${username}`;
  const btn = `brutal-btn ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} gap-2`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado! Cole na bio do Instagram, no WhatsApp…');
    } catch {
      toast.message(url);
    }
    markShared();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={copy} className={`${btn} bg-bioyellow`}><Copy className="w-4 h-4" /> Copiar link</button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`Conheça minha página: ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={markShared}
        className={`${btn} bg-white`}
      >
        <IconWhatsapp className="w-4 h-4 text-green-600" /> WhatsApp
      </a>
      <a href={`/${username}`} target="_blank" rel="noopener noreferrer" onClick={markShared} className={`${btn} bg-white`}>
        <ExternalLink className="w-4 h-4" /> Ver página
      </a>
    </div>
  );
}

// Prévia do celular com o conteúdo atual da página
function LivePreview({ profileId }: { profileId: string }) {
  const [data, setData] = useState<{ links: any[]; socials: any[]; videos: any[]; banners: any[] } | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from('links').select('*').eq('profile_id', profileId).order('position'),
      supabase.from('social_links').select('*').eq('profile_id', profileId).eq('is_active', true).order('position'),
      supabase.from('videos').select('*').eq('profile_id', profileId).eq('is_active', true).order('position'),
      supabase.from('banners').select('*').eq('profile_id', profileId).eq('is_active', true).order('position'),
    ]).then(([l, s, v, b]) => setData({ links: l.data ?? [], socials: s.data ?? [], videos: v.data ?? [], banners: b.data ?? [] }));
  }, [profileId]);

  if (!data) return <div className="w-[320px] h-[622px] bg-neutral-100 animate-pulse mx-auto" />;
  return <BioPreview profileId={profileId} {...data} />;
}

export function OnboardingGuide({ profileId, username, reloadKey }: { profileId: string; username: string; reloadKey: number }) {
  const { status, done, total, level, celebrate, dismiss } = useOnboarding();
  if (!status) return null;

  const percent = Math.round((done / total) * 100);
  const next = ONBOARDING_STEPS.find(s => !status.steps[s.key]);

  if (celebrate) {
    return (
      <section className="brutal-card bg-bioyellow p-6 mt-8 relative">
        <button onClick={dismiss} aria-label="Fechar" className="absolute top-3 right-3 p-1 hover:bg-black/10"><X className="w-5 h-5" /></button>
        <PartyPopper className="w-10 h-10" />
        <h2 className="font-display text-3xl mt-2">Sua página está pronta!</h2>
        <p className="text-sm font-bold text-black/70 mt-1 mb-4">
          Agora é hora de mostrar para o mundo. Coloque o link na bio do Instagram e mande para seus clientes. As visitas e os
          cliques aparecem aqui no painel.
        </p>
        <ShareButtons username={username} />
      </section>
    );
  }

  return (
    <section className="brutal-card bg-white mt-8 overflow-hidden">
      <div className="p-5 md:p-6 border-b-2 border-black bg-biolime">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wide bg-black text-white px-2 py-0.5">Nível: {level}</span>
            <h2 className="font-display text-2xl md:text-3xl mt-2">Sua página está {percent}% pronta</h2>
            <p className="text-sm font-bold text-black/70 mt-1">
              {done === 0 ? 'Leva menos de 5 minutos. Vamos montar juntos?' : total - done === 1 ? 'Falta só 1 passo para deixar tudo no jeito.' : `Faltam ${total - done} passos para deixar tudo no jeito.`}
            </p>
          </div>
          <button onClick={dismiss} className="text-xs font-bold underline text-black/60 shrink-0">Ocultar guia</button>
        </div>
        <div className="mt-4 flex gap-1.5">
          {ONBOARDING_STEPS.map((s, i) => (
            <div key={s.key} className={`h-3 flex-1 brutal-border ${i < done ? 'bg-black' : 'bg-white'}`} />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] font-bold uppercase text-black/60">
          {ONBOARDING_LEVELS.map(l => <span key={l.name} className={l.name === level ? 'text-black' : ''}>{l.name}</span>)}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px]">
        <ol className="p-3 md:p-4 flex flex-col gap-2">
          {ONBOARDING_STEPS.map((s, i) => {
            const ok = status.steps[s.key];
            const isNext = next?.key === s.key;
            return (
              <li
                key={s.key}
                className={`flex items-start gap-3 p-3 ${isNext ? 'brutal-border bg-bioyellow/40' : 'border-2 border-transparent'}`}
              >
                <span className={`w-7 h-7 shrink-0 rounded-full brutal-border flex items-center justify-center text-xs font-bold ${ok ? 'bg-black text-white' : 'bg-white'}`}>
                  {ok ? <Check className="w-4 h-4" /> : i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-bold text-sm ${ok ? 'line-through text-black/50' : ''}`}>{s.label}</span>
                    {isNext && <span className="text-[10px] font-bold uppercase bg-black text-white px-1.5 py-0.5">Próximo passo</span>}
                  </div>
                  {!ok && <p className="text-xs text-black/60 mt-0.5">{s.hint}</p>}
                  {!ok && isNext && (
                    <div className="mt-3">
                      {s.key === 'shared' ? (
                        <ShareButtons username={username} compact />
                      ) : (
                        <Link href={s.href} className="brutal-btn bg-black text-white px-4 py-2 text-xs gap-1 inline-flex">
                          {s.cta} <ChevronRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  )}
                </div>
                {!ok && !isNext && s.key !== 'shared' && (
                  <Link href={s.href} className="text-xs font-bold underline shrink-0 mt-1">{s.cta}</Link>
                )}
              </li>
            );
          })}
        </ol>
        <div className="hidden lg:flex flex-col items-center gap-2 border-l-2 border-black bg-[#F7F7F5] py-5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-black/60">Como está ficando</span>
          <LivePreview key={reloadKey} profileId={profileId} />
        </div>
      </div>
    </section>
  );
}

// Lembrete no menu lateral enquanto o guia não termina
export function OnboardingSidebarCard() {
  const { done, total, level } = useOnboarding();
  return (
    <Link href="/dashboard" className="brutal-border p-3 mt-3 bg-biolime block hover:brutal-shadow transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">Sua página</span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-black text-white">{done}/{total}</span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={`h-2 flex-1 border border-black ${i < done ? 'bg-black' : 'bg-white'}`} />
        ))}
      </div>
      <p className="text-[11px] font-bold mt-2 flex items-center justify-between">
        {level} <span className="underline">Continuar</span>
      </p>
    </Link>
  );
}
