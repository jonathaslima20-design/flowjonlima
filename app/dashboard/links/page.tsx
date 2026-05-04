'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GripVertical, Plus, Trash2, ExternalLink } from 'lucide-react';
import { BioPreview } from '@/components/dashboard/BioPreview';
import { usePlan } from '@/hooks/use-plan';
import { LimitBadge, UpgradeBanner } from '@/components/dashboard/LimitBadge';
import { isUnlimited } from '@/lib/plans';

type Link = { id: string; title: string; url: string; position: number; is_active: boolean };

export default function LinksPage() {
  const [profileId, setProfileId] = useState<string>('');
  const [links, setLinks] = useState<Link[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const { limitOf, reload: reloadPlan } = usePlan();
  const limit = limitOf('links');
  const atLimit = !isUnlimited(limit) && links.length >= limit;

  async function load(pid: string) {
    const { data } = await supabase.from('links').select('*').eq('profile_id', pid).order('position');
    setLinks(data as Link[] ?? []);
  }

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setProfileId(u.user.id);
      load(u.user.id);
    })();
  }, []);

  async function addLink() {
    if (atLimit) return;
    const { data } = await supabase.from('links').insert({
      profile_id: profileId,
      title: 'Novo link',
      url: 'https://',
      position: links.length,
    }).select().single();
    if (data) {
      setLinks([...links, data as Link]);
      reloadPlan();
    }
  }

  async function updateLink(id: string, patch: Partial<Link>) {
    setLinks(links.map(l => l.id === id ? { ...l, ...patch } : l));
    await supabase.from('links').update(patch).eq('id', id);
  }

  async function removeLink(id: string) {
    setLinks(links.filter(l => l.id !== id));
    await supabase.from('links').delete().eq('id', id);
  }

  async function onDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) return;
    const ids = links.map(l => l.id);
    const from = ids.indexOf(draggingId);
    const to = ids.indexOf(targetId);
    const reordered = [...links];
    const [m] = reordered.splice(from, 1);
    reordered.splice(to, 0, m);
    const updated = reordered.map((l, i) => ({ ...l, position: i }));
    setLinks(updated);
    setDraggingId(null);
    await Promise.all(updated.map(l => supabase.from('links').update({ position: l.position }).eq('id', l.id)));
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8">
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl md:text-4xl">Seus Links</h1>
            <LimitBadge current={links.length} limit={limit} />
          </div>
          <button onClick={addLink} disabled={atLimit} title={atLimit ? 'Limite do plano Free atingido' : ''} className="brutal-btn bg-bioyellow px-3 py-2 gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <Plus className="w-4 h-4" /> Novo link
          </button>
        </div>

        {atLimit && <div className="mb-4"><UpgradeBanner resource="links" /></div>}

        <div className="flex flex-col gap-3">
          {links.length === 0 && (
            <div className="brutal-card p-8 text-center">
              <p className="font-bold">Nenhum link ainda. Clique em "Novo link" para começar.</p>
            </div>
          )}
          {links.map(link => (
            <div
              key={link.id}
              draggable
              onDragStart={() => setDraggingId(link.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(link.id)}
              className="brutal-card p-3 md:p-4 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <GripVertical className="w-5 h-5 cursor-grab text-black/60 mt-2 shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <input
                    value={link.title}
                    onChange={e => updateLink(link.id, { title: e.target.value })}
                    className="brutal-input px-3 py-2 font-bold w-full"
                    placeholder="Título"
                  />
                  <input
                    value={link.url}
                    onChange={e => updateLink(link.id, { url: e.target.value })}
                    className="brutal-input px-3 py-2 text-sm w-full"
                    placeholder="https://"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 pl-8 sm:pl-0 shrink-0">
                <label className="flex items-center gap-2 text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={link.is_active}
                    onChange={e => updateLink(link.id, { is_active: e.target.checked })}
                  />
                  Ativo
                </label>
                <div className="flex items-center gap-2">
                  <a href={link.url} target="_blank" rel="noreferrer" className="brutal-btn bg-white w-9 h-9 shrink-0" aria-label="Abrir link">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button onClick={() => removeLink(link.id)} className="brutal-btn bg-white w-9 h-9 shrink-0" aria-label="Remover link">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-6">
          <h2 className="font-display text-lg mb-4">Preview</h2>
          <BioPreview profileId={profileId} links={links} />
        </div>
      </div>
    </div>
  );
}
