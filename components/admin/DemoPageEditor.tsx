'use client';

import type { ReactNode } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { getTheme } from '@/themes/registry';
import { ThemeControls } from '@/components/dashboard/ThemeControls';
import { MediaUploader } from '@/components/admin/MediaUploader';
import { parseVideoUrl } from '@/lib/embed';
import { supabase } from '@/lib/supabase';
import { SOCIALS } from '@/lib/socials';

// Página de demonstração editada no admin (vitrine de temas e exemplos por nicho da landing)
export type DemoPageValue = {
  profile: Record<string, any>;
  links: any[];
  socials: any[];
  banners: any[];
  videos: any[];
  theme_core: Record<string, any>;
  theme_settings: Record<string, any>;
};

type Props = {
  themeKey: string;
  value: DemoPageValue;
  /** Recebe o valor atual e devolve só o que mudou */
  onChange: (fn: (prev: DemoPageValue) => Partial<DemoPageValue>) => void;
  /** Pasta dos uploads no bucket theme-showcase */
  pathBase: string;
  onToast: (message: string) => void;
  /** Campos extras logo abaixo do avatar */
  afterProfile?: ReactNode;
};


export function DemoPageEditor({ themeKey, value, onChange, pathBase, onToast, afterProfile }: Props) {
  const profileOverride = value.profile;
  const controls = getTheme(themeKey).meta.controls || [];

  function setProfile(field: string, v: any) {
    onChange((prev) => ({ profile: { ...(prev.profile || {}), [field]: v } }));
  }

  function mutateArr(key: 'links' | 'socials' | 'banners' | 'videos', mutator: (arr: any[]) => any[]) {
    onChange((prev) => ({ [key]: mutator(prev[key] || []) }));
  }

  function setItemField(key: 'links' | 'socials' | 'banners' | 'videos', idx: number, field: string, v: any) {
    mutateArr(key, (arr) => {
      const next = [...arr];
      next[idx] = { ...next[idx], [field]: v };
      return next;
    });
  }

  function removeItem(key: 'links' | 'socials' | 'banners' | 'videos', idx: number) {
    mutateArr(key, (arr) => { const next = [...arr]; next.splice(idx, 1); return next; });
  }

  const setLinksField = (idx: number, field: string, v: any) => setItemField('links', idx, field, v);
  const setSocialField = (idx: number, field: string, v: any) => setItemField('socials', idx, field, v);
  const setBannerField = (idx: number, field: string, v: any) => setItemField('banners', idx, field, v);
  const setVideoField = (idx: number, field: string, v: any) => setItemField('videos', idx, field, v);

  function addLink() {
    mutateArr('links', (arr) => [...arr, { id: `l_${Date.now()}`, title: 'Novo link', subtitle: '', url: '#', is_active: true, show_icon: true, icon_source: 'auto', icon: '' }]);
  }
  function addSocial() {
    mutateArr('socials', (arr) => [...arr, { id: `s_${Date.now()}`, platform: 'instagram', url: '#' }]);
  }
  function addBanner() {
    mutateArr('banners', (arr) => [...arr, { id: `b_${Date.now()}`, image_url: '', title: '', subtitle: '', url: '#' }]);
  }
  function addVideo() {
    mutateArr('videos', (arr) => [...arr, { id: `v_${Date.now()}`, platform: 'youtube', title: '', embed_url: '', thumbnail: '', file_url: '' }]);
  }

  async function detectLinkIcon(idx: number) {
    const link = (value.links || [])[idx];
    let url: string = link?.url || '';
    if (!/^https?:\/\//i.test(url)) {
      const typed = typeof window !== 'undefined'
        ? window.prompt('URL do site para detectar ícone (ex: https://calendly.com)', 'https://')
        : '';
      if (!typed || !/^https?:\/\//i.test(typed)) {
        onToast('URL inválida para detectar ícone');
        return;
      }
      url = typed;
    }
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
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json().catch(() => ({}));
      if (data?.icon) {
        mutateArr('links', (a) => {
          const next = [...a];
          next[idx] = { ...next[idx], icon: data.icon, icon_source: 'auto', show_icon: true };
          return next;
        });
        onToast('Ícone detectado');
      } else {
        onToast(data?.error ? `Falhou: ${data.error}` : 'Nenhum ícone encontrado');
      }
    } catch (err) {
      console.error('detectLinkIcon', err);
      onToast('Erro ao detectar ícone');
    }
  }

  function normalizeVideoUrl(idx: number) {
    mutateArr('videos', (arr) => {
      const next = [...arr];
      const v = { ...next[idx] };
      const raw = (v.embed_url ?? '').trim();
      if (!raw) { next[idx] = v; return next; }
      const parsed = parseVideoUrl(raw);
      if (parsed) {
        v.embed_url = parsed.embed_url;
        if (parsed.platform !== 'generic') v.platform = parsed.platform;
        if (!v.thumbnail && parsed.thumbnail) v.thumbnail = parsed.thumbnail;
      }
      next[idx] = v;
      return next;
    });
  }

  function updateCoreField(field: string, v: any) {
    onChange((prev) => ({ theme_core: { ...(prev.theme_core || {}), [field]: v } }));
  }
  function updateThemeSetting(key: string, v: any) {
    onChange((prev) => ({ theme_settings: { ...(prev.theme_settings || {}), [key]: v } }));
  }
  function resetAllTheme() {
    onChange(() => ({ theme_core: {}, theme_settings: {} }));
  }

  return (
    <>
      {/* PROFILE */}
      <h3 className="font-display text-base mb-2">Perfil demo</h3>
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <Field label="Nome exibido">
          <input type="text" value={profileOverride?.display_name ?? ''} placeholder="@maria.cria"
            onChange={(e) => setProfile('display_name', e.target.value)}
            className="brutal-input py-2 px-3 text-sm w-full" />
        </Field>
        <Field label="Username">
          <input type="text" value={profileOverride?.username ?? ''} placeholder="maria.cria"
            onChange={(e) => setProfile('username', e.target.value)}
            className="brutal-input py-2 px-3 text-sm w-full" />
        </Field>
        <Field label="Bio" full>
          <textarea value={profileOverride?.bio ?? ''} placeholder="Criadora de conteúdo • SP"
            onChange={(e) => setProfile('bio', e.target.value)} rows={4}
            className="brutal-input py-2 px-3 text-sm w-full font-normal resize-y" />
        </Field>
      </div>

      {/* AVATAR UPLOAD */}
      <Field label="Avatar" full>
        <div className="grid sm:grid-cols-[auto_1fr] gap-3 items-start">
          <MediaUploader
            kind="image"
            value={profileOverride?.avatar_url}
            pathPrefix={`${pathBase}/avatar`}
            onUploaded={(url) => setProfile('avatar_url', url)}
            onRemove={() => setProfile('avatar_url', '')}
          />
          <input
            type="text"
            value={profileOverride?.avatar_url ?? ''}
            placeholder="Ou cole uma URL externa (https://...)"
            onChange={(e) => setProfile('avatar_url', e.target.value)}
            className="brutal-input py-2 px-3 text-sm w-full"
          />
        </div>
      </Field>

      {afterProfile}

      {/* LINKS */}
      <SectionHeader title="Links demo" onAdd={addLink} />
      <div className="flex flex-col gap-2 mb-5">
        {(value.links || []).length === 0 && <p className="text-[11px] text-black/60">Sem links personalizados (usando padrão).</p>}
        {(value.links || []).map((l: any, idx: number) => (
          <div key={idx} className="brutal-border bg-[#FAFAFA] p-3 flex flex-col gap-2">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
              <input type="text" value={l.title ?? ''} placeholder="Título"
                onChange={(e) => setLinksField(idx, 'title', e.target.value)}
                className="brutal-input py-1.5 px-2 text-xs" />
              <input type="text" value={l.subtitle ?? ''} placeholder="Subtítulo"
                onChange={(e) => setLinksField(idx, 'subtitle', e.target.value)}
                className="brutal-input py-1.5 px-2 text-xs" />
              <IconBtn onClick={() => removeItem('links', idx)} />
            </div>
            <input type="text" value={l.url ?? ''} placeholder="URL (https://...)"
              onChange={(e) => setLinksField(idx, 'url', e.target.value)}
              className="brutal-input py-1.5 px-2 text-xs" />
            <div className="grid grid-cols-[auto_auto_1fr_auto] gap-2 items-center">
              <label className="flex items-center gap-1 text-[11px]">
                <input type="checkbox" checked={!!l.show_icon}
                  onChange={(e) => setLinksField(idx, 'show_icon', e.target.checked)} />
                Ícone
              </label>
              <select value={l.icon_source ?? 'auto'}
                onChange={(e) => setLinksField(idx, 'icon_source', e.target.value)}
                className="brutal-input py-1 px-2 text-[11px] bg-white">
                <option value="none">Nenhum</option>
                <option value="auto">Auto</option>
                <option value="custom">Custom</option>
              </select>
              <input type="text" value={l.icon ?? ''} placeholder="URL do ícone"
                onChange={(e) => setLinksField(idx, 'icon', e.target.value)}
                className="brutal-input py-1 px-2 text-[11px]" />
              <button type="button" onClick={() => detectLinkIcon(idx)}
                className="brutal-border bg-white px-2 py-1 text-[11px] font-semibold hover:bg-black hover:text-white transition-colors">
                Detectar
              </button>
            </div>
            {l.icon && (
              <div className="flex items-center gap-2 text-[11px] text-black/60">
                <img src={l.icon} alt="" className="w-6 h-6 object-cover brutal-border" />
                <span className="truncate">{l.icon}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* SOCIALS */}
      <SectionHeader title="Redes sociais demo" onAdd={addSocial} />
      <div className="flex flex-col gap-2 mb-5">
        {(value.socials || []).length === 0 && <p className="text-[11px] text-black/60">Sem redes personalizadas.</p>}
        {(value.socials || []).map((s: any, idx: number) => (
          <div key={idx} className="grid grid-cols-[160px_1fr_auto] gap-2 items-center">
            <select value={s.platform ?? 'instagram'} onChange={(e) => setSocialField(idx, 'platform', e.target.value)}
              className="brutal-input py-1.5 px-2 text-xs bg-white">
              {/* Mesma lista do painel (lib/socials.ts), incluindo Localização */}
              {SOCIALS.map(p => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
            <input type="text" value={s.url ?? ''} placeholder={s.platform === 'location' ? 'Endereço ou cidade (abre no Google Maps)' : 'https://...'}
              onChange={(e) => setSocialField(idx, 'url', e.target.value)}
              className="brutal-input py-1.5 px-2 text-xs" />
            <IconBtn onClick={() => removeItem('socials', idx)} />
          </div>
        ))}
      </div>

      {/* BANNERS */}
      <SectionHeader title="Banners demo" onAdd={addBanner} />
      <div className="flex flex-col gap-3 mb-5">
        {(value.banners || []).length === 0 && <p className="text-[11px] text-black/60">Sem banners personalizados.</p>}
        {(value.banners || []).map((b: any, idx: number) => (
          <div key={idx} className="brutal-border bg-[#FAFAFA] p-3 flex flex-col gap-2">
            <div className="grid sm:grid-cols-[auto_1fr] gap-2 items-start">
              <MediaUploader
                kind="image"
                value={b.image_url}
                pathPrefix={`${pathBase}/banner`}
                onUploaded={(url) => setBannerField(idx, 'image_url', url)}
                onRemove={() => setBannerField(idx, 'image_url', '')}
              />
              <input type="text" value={b.image_url ?? ''} placeholder="Ou URL externa da imagem"
                onChange={(e) => setBannerField(idx, 'image_url', e.target.value)}
                className="brutal-input py-1.5 px-2 text-xs" />
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              <input type="text" value={b.title ?? ''} placeholder="Título"
                onChange={(e) => setBannerField(idx, 'title', e.target.value)}
                className="brutal-input py-1.5 px-2 text-xs" />
              <input type="text" value={b.subtitle ?? ''} placeholder="Subtítulo"
                onChange={(e) => setBannerField(idx, 'subtitle', e.target.value)}
                className="brutal-input py-1.5 px-2 text-xs" />
            </div>
            <div className="flex items-center gap-2">
              <input type="text" value={b.url ?? ''} placeholder="Link (https://...)"
                onChange={(e) => setBannerField(idx, 'url', e.target.value)}
                className="brutal-input py-1.5 px-2 text-xs flex-1" />
              <IconBtn onClick={() => removeItem('banners', idx)} />
            </div>
          </div>
        ))}
      </div>

      {/* VIDEOS */}
      <SectionHeader title="Vídeos demo" onAdd={addVideo} />
      <div className="flex flex-col gap-3 mb-5">
        {(value.videos || []).length === 0 && <p className="text-[11px] text-black/60">Sem vídeos personalizados.</p>}
        {(value.videos || []).map((v: any, idx: number) => (
          <div key={idx} className="brutal-border bg-[#FAFAFA] p-3 flex flex-col gap-2">
            <div className="grid sm:grid-cols-[160px_1fr] gap-2">
              <select value={v.platform ?? 'youtube'} onChange={(e) => setVideoField(idx, 'platform', e.target.value)}
                className="brutal-input py-1.5 px-2 text-xs bg-white">
                <option value="youtube">YouTube</option>
                <option value="vimeo">Vimeo</option>
                <option value="upload">Arquivo</option>
              </select>
              <input type="text" value={v.title ?? ''} placeholder="Título"
                onChange={(e) => setVideoField(idx, 'title', e.target.value)}
                className="brutal-input py-1.5 px-2 text-xs" />
            </div>
            <input type="text" value={v.embed_url ?? ''} placeholder="URL do embed (YouTube/Vimeo)"
              onChange={(e) => setVideoField(idx, 'embed_url', e.target.value)}
              onBlur={() => normalizeVideoUrl(idx)}
              className="brutal-input py-1.5 px-2 text-xs" />
            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] font-bold mb-1">Arquivo de vídeo</div>
                <MediaUploader
                  kind="video"
                  value={v.file_url}
                  pathPrefix={`${pathBase}/video`}
                  onUploaded={(url) => setVideoField(idx, 'file_url', url)}
                  onRemove={() => setVideoField(idx, 'file_url', '')}
                />
              </div>
              <div>
                <div className="text-[10px] font-bold mb-1">Thumbnail</div>
                <MediaUploader
                  kind="image"
                  value={v.thumbnail}
                  pathPrefix={`${pathBase}/thumb`}
                  onUploaded={(url) => setVideoField(idx, 'thumbnail', url)}
                  onRemove={() => setVideoField(idx, 'thumbnail', '')}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <IconBtn onClick={() => removeItem('videos', idx)} />
            </div>
          </div>
        ))}
      </div>

      {/* THEME STYLE */}
      {controls.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-base">Estilo do tema</h3>
            <button onClick={resetAllTheme} className="text-[11px] font-bold uppercase underline underline-offset-4">
              Restaurar estilo
            </button>
          </div>
          <div className="brutal-border p-3 bg-[#FAFAFA]">
            <ThemeControls
              controls={controls}
              values={value.theme_settings || {}}
              coreValues={value.theme_core || {}}
              onChange={(k, v) => updateThemeSetting(k, v)}
              onCoreChange={updateCoreField}
              onReset={resetAllTheme}
            />
          </div>
        </>
      )}
    </>
  );
}

export function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <label className={`block text-xs font-bold ${full ? 'sm:col-span-2' : ''}`}>
      <div className="mb-1">{label}</div>
      {children}
    </label>
  );
}

function SectionHeader({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between mb-2 mt-2">
      <h3 className="font-display text-base">{title}</h3>
      <button onClick={onAdd} className="brutal-btn bg-white px-2 py-1 text-[11px] gap-1">
        <Plus className="w-3 h-3" /> Adicionar
      </button>
    </div>
  );
}

function IconBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-8 h-8 brutal-border bg-white hover:bg-red-100 flex items-center justify-center" aria-label="Remover">
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}
