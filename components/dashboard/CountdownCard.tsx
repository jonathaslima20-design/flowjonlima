'use client';

import { useEffect, useState } from 'react';
import { Lock, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { usePlan } from '@/hooks/use-plan';
import { useUpgradeModal } from './UpgradeModal';
import { PLANS } from '@/lib/plans';
import { fromLocalInput, toLocalInput } from '@/lib/datetime-local';

// Editor do bloco de contagem regressiva da página (Business)
export function CountdownCard({ pageId, onSaved }: { pageId: string; onSaved?: () => void }) {
  const { has } = usePlan();
  const { open: openUpgrade } = useUpgradeModal();
  const unlocked = has('countdown');
  const [title, setTitle] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [active, setActive] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('countdown_title, countdown_ends_at').eq('id', pageId).maybeSingle();
      setTitle(data?.countdown_title ?? '');
      setEndsAt(toLocalInput(data?.countdown_ends_at));
      setActive(!!data?.countdown_ends_at);
    })();
  }, [pageId]);

  async function save(clear = false) {
    const iso = clear ? null : fromLocalInput(endsAt);
    if (!clear && (!iso || new Date(iso).getTime() <= Date.now())) {
      toast.error('Escolha uma data e hora no futuro.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      countdown_title: clear ? null : title.trim() || null,
      countdown_ends_at: iso,
    }).eq('id', pageId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    if (clear) { setTitle(''); setEndsAt(''); }
    setActive(!clear);
    toast.success(clear ? 'Contagem removida da página.' : 'Contagem regressiva salva!');
    onSaved?.();
  }

  const expired = active && endsAt && new Date(endsAt).getTime() <= Date.now();

  return (
    <section className="brutal-card p-5 mt-8">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
        <h2 className="font-display text-xl flex items-center gap-2"><Timer className="w-5 h-5" /> Contagem regressiva</h2>
        {active && !expired && <span className="text-[10px] font-bold uppercase tracking-wide bg-green-500 text-white px-2 py-1">No ar</span>}
        {expired && <span className="text-[10px] font-bold uppercase tracking-wide bg-neutral-800 text-white px-2 py-1">Encerrada</span>}
      </div>
      <p className="text-sm text-black/70 mb-4">
        Um cronômetro acima dos links da página, para lançamentos, promoções e eventos. Some sozinho quando o prazo acaba.
      </p>

      {unlocked ? (
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold flex flex-col gap-1">
            Título (opcional)
            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={80} placeholder="A promoção acaba em" className="brutal-input px-3 py-2 font-normal" />
          </label>
          <label className="text-xs font-bold flex flex-col gap-1">
            Termina em
            <input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} className="brutal-input px-3 py-2 font-normal" />
          </label>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => save()} disabled={saving || !endsAt} className="brutal-btn bg-bioyellow px-4 py-2 text-sm disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar contagem'}
            </button>
            {active && (
              <button onClick={() => save(true)} disabled={saving} className="brutal-btn bg-white px-4 py-2 text-sm disabled:opacity-50">
                Remover da página
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          <Lock className="w-5 h-5" />
          <span className="text-sm font-bold flex-1">Recurso do plano Business.</span>
          {PLANS.business.available ? (
            <button onClick={openUpgrade} className="brutal-btn bg-black text-white px-4 py-2 text-xs">Conhecer o Business</button>
          ) : (
            <span className="brutal-border bg-white px-3 py-2 text-xs font-bold">Business em breve</span>
          )}
        </div>
      )}
    </section>
  );
}
