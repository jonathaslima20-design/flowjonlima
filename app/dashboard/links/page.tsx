'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GripVertical, Plus, Trash2, ExternalLink, Image as ImageIcon, RefreshCw, Upload, X } from 'lucide-react';
import { BioPreview } from '@/components/dashboard/BioPreview';
import { usePlan } from '@/hooks/use-plan';
import { LimitBadge, UpgradeBanner } from '@/components/dashboard/LimitBadge';
import { isUnlimited } from '@/lib/plans';

type Link = {
  id: string;
  title: string;
  url: string;
  position: number;
  is_active: boolean;
  icon?: string | null;
  icon_source?: 'none' | 'auto' | 'custom' | null;
  show_icon?: boolean | null;
  icon_fetched_at?: string | null;
};

export default function LinksPage() {
  const [profileId, setProfileId] = useState<string>('');
  const [links, setLinks] = useState<Link[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [fetchingIcon, setFetchingIcon] = useState<Record<string, boolean>>({});
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

  async function fetchAutoIcon(link: Link) {
    if (!link.url || !/^https?:\/\//i.test(link.url)) return;
    setFetchingIcon(prev => ({ ...prev, [link.id]: true }));
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/fetch-link-icon`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: link.url }),
      });
      const data = await res.json();
      if (data?.icon) {
        await updateLink(link.id, {
          icon: data.icon,
          icon_source: 'auto',
          show_icon: true,
          icon_fetched_at: new Date().toISOString(),
        });
      }
    } catch {
      // silent
    } finally {
      setFetchingIcon(prev => ({ ...prev, [link.id]: false }));
    }
  }

  async function uploadCustomIcon(link: Link, file: File) {
    if (!profileId) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Imagem muito grande. Tamanho maximo: 2MB.');
      return;
    }
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const path = `${profileId}/${link.id}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('link-icons').upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    });
    if (upErr) {
      alert('Falha no upload: ' + upErr.message);
      return;
    }
    const { data } = supabase.storage.from('link-icons').getPublicUrl(path);
    if (data?.publicUrl) {
      await updateLink(link.id, {
        icon: data.publicUrl,
        icon_source: 'custom',
        show_icon: true,
      });
    }
  }

  async function clearIcon(link: Link) {
    await updateLink(link.id, {
      icon: '',
      icon_source: 'none',
      show_icon: false,
    });
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
            <LinkRow
              key={link.id}
              link={link}
              fetching={!!fetchingIcon[link.id]}
              onUpdate={(patch) => updateLink(link.id, patch)}
              onRemove={() => removeLink(link.id)}
              onFetchIcon={() => fetchAutoIcon(link)}
              onUploadIcon={(file) => uploadCustomIcon(link, file)}
              onClearIcon={() => clearIcon(link)}
              onDragStart={() => setDraggingId(link.id)}
              onDrop={() => onDrop(link.id)}
            />
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

function LinkRow({
  link,
  fetching,
  onUpdate,
  onRemove,
  onFetchIcon,
  onUploadIcon,
  onClearIcon,
  onDragStart,
  onDrop,
}: {
  link: Link;
  fetching: boolean;
  onUpdate: (patch: Partial<Link>) => void;
  onRemove: () => void;
  onFetchIcon: () => void;
  onUploadIcon: (file: File) => void;
  onClearIcon: () => void;
  onDragStart: () => void;
  onDrop: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const lastAutoUrl = useRef<string | null>(link.icon_source === 'auto' ? link.url : null);

  function handleUrlBlur() {
    if (
      link.show_icon &&
      link.icon_source === 'auto' &&
      link.url &&
      /^https?:\/\//i.test(link.url) &&
      lastAutoUrl.current !== link.url
    ) {
      lastAutoUrl.current = link.url;
      onFetchIcon();
    }
  }

  const hasIcon = !!(link.show_icon && link.icon);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="brutal-card p-3 md:p-4 flex flex-col gap-3"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <GripVertical className="w-5 h-5 cursor-grab text-black/60 mt-2 shrink-0" />
          <div className="shrink-0 mt-1">
            {hasIcon ? (
              <img src={link.icon as string} alt="" className="w-10 h-10 object-cover border-2 border-black rounded-md bg-white" onError={(e) => (e.currentTarget.style.display = 'none')} />
            ) : (
              <div className="w-10 h-10 border-2 border-dashed border-black/30 rounded-md flex items-center justify-center text-black/40">
                <ImageIcon className="w-4 h-4" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <input
              value={link.title}
              onChange={e => onUpdate({ title: e.target.value })}
              className="brutal-input px-3 py-2 font-bold w-full"
              placeholder="Título"
            />
            <input
              value={link.url}
              onChange={e => onUpdate({ url: e.target.value })}
              onBlur={handleUrlBlur}
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
              onChange={e => onUpdate({ is_active: e.target.checked })}
            />
            Ativo
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(v => !v)}
              className={`brutal-btn w-9 h-9 shrink-0 ${hasIcon ? 'bg-bioyellow' : 'bg-white'}`}
              aria-label="Icone"
              title="Icone do botao"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <a href={link.url} target="_blank" rel="noreferrer" className="brutal-btn bg-white w-9 h-9 shrink-0" aria-label="Abrir link">
              <ExternalLink className="w-4 h-4" />
            </a>
            <button onClick={onRemove} className="brutal-btn bg-white w-9 h-9 shrink-0" aria-label="Remover link">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t-2 border-black/10 pt-3 flex flex-col gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-xs font-bold">
              <input
                type="checkbox"
                checked={!!link.show_icon}
                onChange={e => onUpdate({ show_icon: e.target.checked })}
              />
              Exibir icone no botao
            </label>
            <span className="text-xs opacity-60">Origem:</span>
            <select
              value={link.icon_source || 'none'}
              onChange={e => onUpdate({ icon_source: e.target.value as any })}
              className="brutal-input px-2 py-1 text-xs font-bold"
            >
              <option value="none">Nenhum (padrao do tema)</option>
              <option value="auto">Automatico (detectar na URL)</option>
              <option value="custom">Customizado (upload)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {link.icon_source === 'auto' && (
              <button
                onClick={onFetchIcon}
                disabled={fetching || !link.url}
                className="brutal-btn bg-white px-3 py-2 gap-2 text-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${fetching ? 'animate-spin' : ''}`} />
                {fetching ? 'Detectando...' : 'Detectar agora'}
              </button>
            )}
            {link.icon_source === 'custom' && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) onUploadIcon(f);
                    if (fileRef.current) fileRef.current.value = '';
                  }}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="brutal-btn bg-white px-3 py-2 gap-2 text-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Enviar imagem
                </button>
              </>
            )}
            {hasIcon && (
              <button
                onClick={onClearIcon}
                className="brutal-btn bg-white px-3 py-2 gap-2 text-xs"
              >
                <X className="w-3.5 h-3.5" />
                Remover
              </button>
            )}
          </div>

          <p className="text-[11px] opacity-60">
            Quando ativo, o icone substitui o elemento visual padrao do tema, preservando o formato original (circulo, quadrado, arredondado).
          </p>
        </div>
      )}
    </div>
  );
}
