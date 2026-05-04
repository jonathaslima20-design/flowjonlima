'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ProFeatureCard } from '@/components/dashboard/ProFeatureCard';
import { validatePixelId, validateGaId } from '@/lib/tracking';
import { Check, ExternalLink, Activity, CircleAlert as AlertCircle, CircleCheck as CheckCircle2 } from 'lucide-react';

export default function IntegrationsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<any>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', u.user.id).maybeSingle();
      setProfile(data);
    })();
  }, []);

  function update(patch: any) {
    setProfile((prev: any) => ({ ...prev, ...patch }));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (!profile?.id) return;
      await supabase.from('profiles').update(patch).eq('id', profile.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 400);
  }

  if (!profile) return <div>Carregando...</div>;

  const pixelValid = validatePixelId(profile.meta_pixel_id);
  const gaValid = validateGaId(profile.ga_measurement_id);
  const pixelActive = pixelValid && profile.meta_pixel_enabled !== false;
  const gaActive = gaValid && profile.ga_enabled !== false;

  const publicUrl = typeof window !== 'undefined' && profile.username
    ? `${window.location.origin}/${profile.username}`
    : '';

  return (
    <ProFeatureCard
      feature="pixel_ga"
      title="Integrações"
      description="Conecte Meta Pixel e Google Analytics à sua bio para rastrear visitas e conversões."
      comingSoon={false}
    >
      <div className="flex flex-col gap-8">
        {/* Meta Pixel */}
        <div>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-xl">Meta Pixel</h3>
              <StatusBadge active={pixelActive} configured={pixelValid} />
            </div>
            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={profile.meta_pixel_enabled !== false}
                onChange={e => update({ meta_pixel_enabled: e.target.checked })}
                className="w-4 h-4 accent-black"
              />
              Ativo
            </label>
          </div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-2">Pixel ID</label>
          <input
            value={profile.meta_pixel_id || ''}
            onChange={e => update({ meta_pixel_id: e.target.value.trim() })}
            placeholder="123456789012345"
            className="brutal-input px-3 py-2 w-full"
          />
          {profile.meta_pixel_id && !pixelValid && (
            <p className="text-[11px] text-red-600 font-bold mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> ID inválido. Use apenas números (6-20 dígitos).
            </p>
          )}
          <details className="mt-3 text-xs">
            <summary className="cursor-pointer font-bold">Como obter meu Pixel ID</summary>
            <ol className="list-decimal ml-4 mt-2 space-y-1 text-black/70">
              <li>Acesse o <a className="underline font-bold" target="_blank" rel="noopener noreferrer" href="https://business.facebook.com/events_manager">Gerenciador de Eventos</a></li>
              <li>Crie um Pixel ou selecione um existente</li>
              <li>Copie o ID numérico e cole aqui</li>
            </ol>
          </details>
        </div>

        <div className="border-t-2 border-black" />

        {/* Google Analytics */}
        <div>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-xl">Google Analytics (GA4)</h3>
              <StatusBadge active={gaActive} configured={gaValid} />
            </div>
            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={profile.ga_enabled !== false}
                onChange={e => update({ ga_enabled: e.target.checked })}
                className="w-4 h-4 accent-black"
              />
              Ativo
            </label>
          </div>
          <label className="block text-xs font-bold uppercase tracking-wide mb-2">Measurement ID</label>
          <input
            value={profile.ga_measurement_id || ''}
            onChange={e => update({ ga_measurement_id: e.target.value.trim() })}
            placeholder="G-XXXXXXXXXX"
            className="brutal-input px-3 py-2 w-full"
          />
          {profile.ga_measurement_id && !gaValid && (
            <p className="text-[11px] text-red-600 font-bold mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> ID inválido. Use o formato G-XXXXXXXXXX.
            </p>
          )}
          <details className="mt-3 text-xs">
            <summary className="cursor-pointer font-bold">Como obter meu Measurement ID</summary>
            <ol className="list-decimal ml-4 mt-2 space-y-1 text-black/70">
              <li>Acesse <a className="underline font-bold" target="_blank" rel="noopener noreferrer" href="https://analytics.google.com">Google Analytics</a></li>
              <li>Admin → Fluxos de dados → selecione seu site</li>
              <li>Copie o ID de métrica (começa com G-) e cole aqui</li>
            </ol>
          </details>
        </div>

        <div className="brutal-border p-4 bg-neutral-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <Activity className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold">Testar configuração</p>
              <p className="text-[11px] text-black/60">Abre sua bio e dispara um PageView em tempo real.</p>
            </div>
          </div>
          {publicUrl && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="brutal-btn bg-white px-4 py-2 text-xs gap-2"
            >
              Abrir bio <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {saved && (
          <div className="flex items-center gap-2 font-bold text-sm">
            <Check className="w-4 h-4" /> Salvo!
          </div>
        )}
      </div>
    </ProFeatureCard>
  );
}

function StatusBadge({ active, configured }: { active: boolean; configured: boolean }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-biolime text-black px-2 py-1 brutal-border">
        <CheckCircle2 className="w-3 h-3" /> Ativo
      </span>
    );
  }
  if (configured) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-neutral-200 text-black px-2 py-1 brutal-border">
        Pausado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-white text-black/60 px-2 py-1 brutal-border">
      Inativo
    </span>
  );
}
