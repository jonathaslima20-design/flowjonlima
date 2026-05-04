'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GripVertical, Plus, Trash2, X } from 'lucide-react';
import { SOCIALS, SOCIALS_BY_KEY, normalizeSocial, type SocialKey } from '@/lib/socials';
import { usePlan } from '@/hooks/use-plan';
import { LimitBadge, UpgradeBanner } from '@/components/dashboard/LimitBadge';
import { isUnlimited } from '@/lib/plans';
import { useUpgradeModal } from '@/components/dashboard/UpgradeModal';

type Social = {
  id: string;
  platform: string;
  url: string;
  position: number;
  is_active: boolean;
};

export default function SocialsPage() {
  const [profileId, setProfileId] = useState('');
  const [socials, setSocials] = useState<Social[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selected, setSelected] = useState<SocialKey | null>(null);
  const [handleInput, setHandleInput] = useState('');
  const { limitOf, reload: reloadPlan } = usePlan();
  const { open: openUpgrade } = useUpgradeModal();
  const limit = limitOf('socials');
  const atLimit = !isUnlimited(limit) && socials.length >= limit;

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setProfileId(u.user.id);
      const { data } = await supabase.from('social_links').select('*').eq('profile_id', u.user.id).order('position');
      setSocials((data as Social[]) ?? []);
    })();
  }, []);

  async function confirmAdd() {
    if (!selected) return;
    if (atLimit) { alert('Limite de redes sociais do plano atingido.'); return; }
    if (!handleInput.trim()) return alert('Valor inválido.');
    const url = selected === 'location' ? handleInput.trim() : normalizeSocial(selected, handleInput);
    if (!url) return alert('Valor inválido.');
    const { data } = await supabase.from('social_links').insert({
      profile_id: profileId, platform: selected, url, position: socials.length,
    }).select().single();
    if (data) {
      setSocials([...socials, data as Social]);
      reloadPlan();
    }
    setSelected(null); setHandleInput(''); setPickerOpen(false);
  }

  async function update(id: string, patch: Partial<Social>) {
    setSocials(socials.map(s => s.id === id ? { ...s, ...patch } : s));
    await supabase.from('social_links').update(patch).eq('id', id);
  }

  async function remove(id: string) {
    setSocials(socials.filter(s => s.id !== id));
    await supabase.from('social_links').delete().eq('id', id);
  }

  async function onDrop(targetId: string) {
    if (!dragging || dragging === targetId) return;
    const ids = socials.map(s => s.id);
    const from = ids.indexOf(dragging);
    const to = ids.indexOf(targetId);
    const reordered = [...socials];
    const [m] = reordered.splice(from, 1);
    reordered.splice(to, 0, m);
    const updated = reordered.map((s, i) => ({ ...s, position: i }));
    setSocials(updated);
    setDragging(null);
    await Promise.all(updated.map(s => supabase.from('social_links').update({ position: s.position }).eq('id', s.id)));
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-4xl">Redes sociais</h1>
            <LimitBadge current={socials.length} limit={limit} />
          </div>
          <p className="text-sm font-bold text-black/60 mt-1">Adicione ícones que aparecem abaixo da sua bio.</p>
        </div>
        <button
          onClick={() => !atLimit && setPickerOpen(true)}
          disabled={atLimit}
          title={atLimit ? 'Limite de redes sociais atingido' : ''}
          className="brutal-btn bg-bioyellow px-4 py-2 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      {atLimit && <div className="mb-4"><UpgradeBanner resource="redes sociais" /></div>}

      <div className="flex flex-col gap-3">
        {socials.length === 0 && (
          <div className="brutal-card p-8 text-center">
            <p className="font-bold">Nenhuma rede social adicionada.</p>
          </div>
        )}
        {socials.map(s => {
          const meta = SOCIALS_BY_KEY[s.platform];
          const Icon = meta?.icon;
          return (
            <div
              key={s.id}
              draggable
              onDragStart={() => setDragging(s.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(s.id)}
              className="brutal-card p-3 flex items-center gap-3"
            >
              <GripVertical className="w-5 h-5 cursor-grab text-black/60" />
              <div
                className="w-10 h-10 brutal-border flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: meta?.color || '#000' }}
              >
                {Icon && <Icon className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm">{meta?.label || s.platform}</div>
                <input
                  value={s.url}
                  onChange={e => update(s.id, { url: e.target.value })}
                  className="brutal-input px-2 py-1 text-xs w-full mt-1"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-bold">
                <input type="checkbox" checked={s.is_active} onChange={e => update(s.id, { is_active: e.target.checked })} />
                Ativo
              </label>
              <button onClick={() => remove(s.id)} className="brutal-btn bg-white w-9 h-9">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {pickerOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPickerOpen(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-white brutal-border brutal-shadow-xl max-w-lg w-full p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl">Escolher rede</h2>
              <button onClick={() => setPickerOpen(false)} className="brutal-btn bg-white w-9 h-9">
                <X className="w-4 h-4" />
              </button>
            </div>
            {!selected ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {SOCIALS.map(s => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setSelected(s.key)}
                      className="brutal-border p-3 flex flex-col items-center gap-1 bg-white hover:bg-bioyellow transition-colors"
                    >
                      <span className="w-9 h-9 flex items-center justify-center text-white brutal-border" style={{ backgroundColor: s.color }}>
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className="text-[10px] font-bold">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  {(() => {
                    const meta = SOCIALS_BY_KEY[selected];
                    const Icon = meta.icon;
                    return (
                      <>
                        <span className="w-10 h-10 flex items-center justify-center text-white brutal-border" style={{ backgroundColor: meta.color }}>
                          <Icon className="w-5 h-5" />
                        </span>
                        <span className="font-display text-xl">{meta.label}</span>
                      </>
                    );
                  })()}
                </div>
                <input
                  autoFocus
                  value={handleInput}
                  onChange={e => setHandleInput(e.target.value)}
                  placeholder={SOCIALS_BY_KEY[selected].placeholder}
                  className="brutal-input px-3 py-2"
                />
                <div className="flex gap-2">
                  <button onClick={() => setSelected(null)} className="brutal-btn bg-white px-4 py-2 text-sm flex-1">Voltar</button>
                  <button onClick={confirmAdd} className="brutal-btn bg-bioblue text-white px-4 py-2 text-sm flex-1">Adicionar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
