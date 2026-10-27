'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePageId, useCurrentPage } from '@/lib/page-context';
import { toLocalInput, fromLocalInput } from '@/lib/datetime-local';
import { CountdownCard } from '@/components/dashboard/CountdownCard';
import { toast } from 'sonner';
import { GripVertical, Plus, Trash2, ExternalLink, Image as ImageIcon, RefreshCw, Upload, X, Clock, Lock, Library } from 'lucide-react';
import { BioPreview } from '@/components/dashboard/BioPreview';
import { usePlan } from '@/hooks/use-plan';
import { LimitBadge, UpgradeBanner } from '@/components/dashboard/LimitBadge';
import { useUpgradeModal } from '@/components/dashboard/UpgradeModal';
import { isUnlimited } from '@/lib/plans';
import { toSafeUrl } from '@/lib/url';
import { compressImage } from '@/lib/compress-image';
import { isLeadFormUrl } from '@/lib/leads';
import { getLibraryIcon } from '@/lib/link-icon-library';
import { IconLibraryPicker } from '@/components/dashboard/IconLibraryPicker';

type Link = {
  id: string;
  title: string;
  url: string;
  position: number;
  is_active: boolean;
  icon?: string | null;
  icon_source?: 'none' | 'auto' | 'custom' | 'library' | null;
  show_icon?: boolean | null;
  icon_fetched_at?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
};

function scheduleStatus(link: Link): { label: string; cls: string } | null {
  const now = Date.now();
  if (link.ends_at && new Date(link.ends_at).getTime() <= now) return { label: 'Expirado', cls: 'bg-red-100 text-red-700' };
  if (link.starts_at && new Date(link.starts_at).getTime() > now) {
    return { label: `Agendado: ${new Date(link.starts_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`, cls: 'bg-blue-100 text-blue-800' };
  }
  if (link.ends_at) {
    return { label: `Até ${new Date(link.ends_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`, cls: 'bg-bioyellow text-black' };
  }
  return null;
}

export default function LinksPage() {
  const pageId = usePageId();
  const { accountId } = useCurrentPage();
  // Recarrega a prévia depois de salvar a contagem regressiva
  const [previewKey, setPreviewKey] = useState(0);
  const [profileId, setProfileId] = useState<string>('');
  const [links, setLinks] = useState<Link[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [fetchingIcon, setFetchingIcon] = useState<Record<string, boolean>>({});
  const { limitOf, has, reload: reloadPlan } = usePlan();
  const { open: openUpgrade } = useUpgradeModal();
  const limit = limitOf('links');
  const atLimit = !isUnlimited(limit) && links.length >= limit;

  async function load(pid: string) {
    const { data } = await supabase.from('links').select('*').eq('profile_id', pid).order('position');
    setLinks(data as Link[] ?? []);
  }

  useEffect(() => {
    (async () => {
      setProfileId(pageId);
      load(pageId);
    })();
  }, [pageId]);

  async function addLink() {
    if (atLimit) return;
    const { data, error } = await supabase.from('links').insert({
      profile_id: profileId,
      title: 'Novo link',
      url: 'https://',
      position: links.length,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    if (data) {
      setLinks([...links, data as Link]);
      reloadPlan();
    }
  }

  async function updateLink(id: string, patch: Partial<Link>) {
    setLinks(links.map(l => l.id === id ? { ...l, ...patch } : l));
    const dbPatch = { ...patch };
    if (patch.url !== undefined) {
      const safe = toSafeUrl(patch.url);
      if (!safe) return;
      dbPatch.url = safe;
    }
    const { error } = await supabase.from('links').update(dbPatch).eq('id', id);
    if (error) toast.error(error.message);
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
    if (!link.url || !/^https?:\/\//i.test(link.url)) {
      toast.error('URL inválida. O link precisa começar com https:// para detectar o ícone.');
      return;
    }
    setFetchingIcon(prev => ({ ...prev, [link.id]: true }));
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/fetch-link-icon`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      // A função exige usuário logado
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: link.url }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json().catch(() => ({}));
      if (data?.icon) {
        await updateLink(link.id, {
          icon: data.icon,
          icon_source: 'auto',
          show_icon: true,
          icon_fetched_at: new Date().toISOString(),
        });
      } else {
        toast.info('Nenhum ícone detectado para este site.');
      }
    } catch (err) {
      console.error('fetch-link-icon error', err);
      toast.error('Erro ao detectar ícone. Tente novamente em instantes.');
    } finally {
      setFetchingIcon(prev => ({ ...prev, [link.id]: false }));
    }
  }

  async function uploadCustomIcon(link: Link, original: File) {
    if (!profileId) return;
    // Ícone aparece pequeno no botão: 256px é suficiente (PNG no fallback preserva transparência)
    const file = await compressImage(original, { maxSize: 256, fallbackType: 'image/png' });
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande. Tamanho maximo: 2MB.');
      return;
    }
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const path = `${accountId}/${link.id}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('link-icons').upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    });
    if (upErr) {
      toast.error('Falha no upload: ' + upErr.message);
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
              <p className="font-bold">Nenhum link ainda. Clique em “Novo link” para começar.</p>
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
              canSchedule={has('scheduling')}
              onUpgrade={openUpgrade}
            />
          ))}
        </div>

        <CountdownCard pageId={pageId} onSaved={() => setPreviewKey(k => k + 1)} />
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-6">
          <h2 className="font-display text-lg mb-4">Preview</h2>
          <BioPreview key={previewKey} profileId={profileId} links={links} />
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
  canSchedule,
  onUpgrade,
}: {
  link: Link;
  canSchedule: boolean;
  onUpgrade: () => void;
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
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const status = scheduleStatus(link);
  const isLeadForm = isLeadFormUrl(link.url);
  const hasSchedule = !!(link.starts_at || link.ends_at);
  const fileRef = useRef<HTMLInputElement>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
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
  const libIcon = getLibraryIcon(link.icon);

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
            {hasIcon && libIcon ? (
              <div className="w-10 h-10 border-2 border-black rounded-md bg-white flex items-center justify-center"><libIcon.Icon className="w-5 h-5" /></div>
            ) : hasIcon ? (
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
            {isLeadForm ? (
              <p className="text-xs font-bold px-3 py-2 bg-biolime border-2 border-black">Abre o formulário de contato (configure em Leads)</p>
            ) : (
              <input
                value={link.url}
                onChange={e => onUpdate({ url: e.target.value })}
                onBlur={handleUrlBlur}
                className="brutal-input px-3 py-2 text-sm w-full"
                placeholder="https://"
              />
            )}
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
            <button
              onClick={() => setScheduleOpen(v => !v)}
              className={`brutal-btn w-9 h-9 shrink-0 ${hasSchedule ? 'bg-bioyellow' : 'bg-white'}`}
              aria-label="Agendar"
              title="Agendar exibição"
            >
              <Clock className="w-4 h-4" />
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

      {status && (
        <div className="pl-8 sm:pl-0">
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 border border-black/20 ${status.cls}`}>{status.label}</span>
        </div>
      )}

      {scheduleOpen && (
        <div className="border-t-2 border-black/10 pt-3 flex flex-col gap-3">
          {canSchedule ? (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="text-xs font-bold flex flex-col gap-1">
                  Aparecer a partir de
                  <input
                    type="datetime-local"
                    value={toLocalInput(link.starts_at)}
                    onChange={e => onUpdate({ starts_at: fromLocalInput(e.target.value) })}
                    className="brutal-input px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="text-xs font-bold flex flex-col gap-1">
                  Sumir em
                  <input
                    type="datetime-local"
                    value={toLocalInput(link.ends_at)}
                    onChange={e => onUpdate({ ends_at: fromLocalInput(e.target.value) })}
                    className="brutal-input px-2 py-1.5 text-sm"
                  />
                </label>
              </div>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-[11px] opacity-60">Deixe em branco para não limitar. A página pública atualiza em até 1 minuto.</p>
                {hasSchedule && (
                  <button onClick={() => onUpdate({ starts_at: null, ends_at: null })} className="brutal-btn bg-white px-3 py-1.5 text-xs gap-1">
                    <X className="w-3.5 h-3.5" /> Remover agendamento
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between gap-3 flex-wrap bg-bioyellow brutal-border p-3">
              <p className="text-xs font-bold flex items-center gap-2"><Lock className="w-4 h-4" /> Agende quando o link aparece e some (promoções, lançamentos). Disponível no Pro.</p>
              <button onClick={onUpgrade} className="brutal-btn bg-black text-white px-3 py-1.5 text-xs">Ver planos</button>
            </div>
          )}
        </div>
      )}

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
              <option value="library">Biblioteca de icones</option>
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
            {link.icon_source === 'library' && (
              <>
                <button
                  onClick={() => setLibraryOpen(true)}
                  className="brutal-btn bg-white px-3 py-2 gap-2 text-xs"
                >
                  <Library className="w-3.5 h-3.5" />
                  {libIcon ? `Trocar ícone (${libIcon.label})` : 'Escolher ícone'}
                </button>
                {libraryOpen && (
                  <IconLibraryPicker
                    value={link.icon}
                    onPick={(icon) => onUpdate({ icon, icon_source: 'library', show_icon: true })}
                    onClose={() => setLibraryOpen(false)}
                  />
                )}
              </>
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
