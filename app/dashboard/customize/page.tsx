'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePageId } from '@/lib/page-context';
import { BioPreview } from '@/components/dashboard/BioPreview';
import { THEMES, getTheme } from '@/themes/registry';
import { COLLECTION_2026 } from '@/themes/collection';
import { ThemeMockup } from '@/components/themes/ThemeMockup';
import { ThemeControls } from '@/components/dashboard/ThemeControls';
import { SectionOrderControl } from '@/components/dashboard/SectionOrderControl';
import { Check, Eye, Layers, Lock, Palette, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { fetchAllShowcasePresets, catalogDemoFor, ShowcasePreset } from '@/lib/theme-showcase';
import { usePlan } from '@/hooks/use-plan';
import { useUpgradeModal } from '@/components/dashboard/UpgradeModal';

// Aparência: abas (Tema / Cores e estilo / Ordem das seções) e prévia ao lado (celular: botão "Ver prévia").
// Clicar num tema só o testa na prévia; a troca acontece em "Aplicar".

type Tab = 'tema' | 'estilo' | 'ordem';
const TABS: { key: Tab; label: string; icon: typeof Palette }[] = [
  { key: 'tema', label: 'Tema', icon: Palette },
  { key: 'estilo', label: 'Cores e estilo', icon: SlidersHorizontal },
  { key: 'ordem', label: 'Ordem das seções', icon: Layers },
];
const TAB_KEY = 'bioflowzy.customizeTab';
const NEW_THEMES = new Set(COLLECTION_2026.map(t => t.meta.key));
type Filter = 'all' | 'free' | 'pro' | 'new';

export default function CustomizePage() {
  const pageId = usePageId();
  const [profileId, setProfileId] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [socials, setSocials] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);
  const [showcase, setShowcase] = useState<Record<string, ShowcasePreset>>({});
  const [catalogOrder, setCatalogOrder] = useState<string[]>([]);
  const [disabledThemes, setDisabledThemes] = useState<string[]>([]);
  const [proOnlyThemes, setProOnlyThemes] = useState<string[]>([]);
  const { has } = usePlan();
  const { open: openUpgrade } = useUpgradeModal();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('tema');
  // Tema em teste (aparece na prévia, ainda não aplicado)
  const [candidate, setCandidate] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const saveTimer = useRef<any>(null);
  const savedTimer = useRef<any>(null);

  useEffect(() => {
    try {
      const t = localStorage.getItem(TAB_KEY) as Tab | null;
      if (t && TABS.some(x => x.key === t)) setTab(t);
    } catch {}
  }, []);

  function changeTab(t: Tab) {
    setTab(t);
    try { localStorage.setItem(TAB_KEY, t); } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  useEffect(() => {
    (async () => {
      const [all, { data: settingRows }] = await Promise.all([
        fetchAllShowcasePresets(),
        supabase.from('admin_settings').select('key, value').in('key', ['disabled_themes', 'pro_only_themes']),
      ]);
      const map: Record<string, ShowcasePreset> = {};
      for (const p of all) map[p.theme_key] = p;
      setShowcase(map);
      setCatalogOrder(all.map(p => p.theme_key));
      const listFor = (key: string) => {
        const value = settingRows?.find(r => r.key === key)?.value;
        return Array.isArray(value) ? (value as string[]) : [];
      };
      setDisabledThemes(listFor('disabled_themes'));
      setProOnlyThemes(listFor('pro_only_themes'));
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setProfileId(pageId);
      const { data: p } = await supabase.from('profiles').select('*').eq('id', pageId).maybeSingle();
      setProfile(p);
      const [{ data: ls }, { data: ss }, { data: vs }, { data: bs }] = await Promise.all([
        supabase.from('links').select('*').eq('profile_id', pageId).eq('is_active', true).order('position'),
        supabase.from('social_links').select('*').eq('profile_id', pageId).eq('is_active', true).order('position'),
        supabase.from('videos').select('*').eq('profile_id', pageId).eq('is_active', true).order('position'),
        supabase.from('banners').select('*').eq('profile_id', pageId).eq('is_active', true).order('position'),
      ]);
      setLinks(ls ?? []);
      setSocials(ss ?? []);
      setVideos(vs ?? []);
      setBanners(bs ?? []);
    })();
  }, [pageId]);

  function flashSaved() {
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 1800);
  }

  async function update(patch: any) {
    const next = { ...profile, ...patch };
    setProfile(next);
    await supabase.from('profiles').update(patch).eq('id', profileId);
    flashSaved();
  }

  function updateThemeSetting(themeKey: string, key: string, value: any) {
    setProfile((prev: any) => {
      const current = (prev?.theme_settings && typeof prev.theme_settings === 'object') ? prev.theme_settings : {};
      const nextSettings = { ...current, [themeKey]: { ...(current[themeKey] || {}), [key]: value } };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        await supabase.from('profiles').update({ theme_settings: nextSettings }).eq('id', profileId);
        flashSaved();
      }, 300);
      return { ...prev, theme_settings: nextSettings };
    });
  }

  async function resetThemeSettings(themeKey: string) {
    const current = (profile?.theme_settings && typeof profile.theme_settings === 'object') ? profile.theme_settings : {};
    const nextSettings = { ...current };
    delete nextSettings[themeKey];
    const defaults = getTheme(themeKey).meta.defaults;
    const patch: any = {
      theme_settings: nextSettings,
      bg_color: defaults.bg_color,
      button_color: defaults.button_color,
      text_color: defaults.text_color,
      border_width: defaults.border_width ?? 2,
      shadow_offset: defaults.shadow_offset ?? 4,
    };
    await update(patch);
  }

  async function resetThemeGroup(themeKey: string, group: string) {
    const theme = getTheme(themeKey);
    const groupControls = (theme.meta.controls || []).filter(c => (c.group || 'Ajustes') === group);
    const current = (profile?.theme_settings && typeof profile.theme_settings === 'object') ? profile.theme_settings : {};
    const themeSet = { ...(current[themeKey] || {}) };
    const corePatch: any = {};
    for (const c of groupControls) {
      if (c.type === 'coreColor' || c.type === 'coreNumber') {
        corePatch[c.field] = (c as any).default;
        const coreKey = `_core_${c.field}`;
        delete themeSet[coreKey];
      } else {
        delete themeSet[c.key];
      }
    }
    const nextSettings = { ...current, [themeKey]: themeSet };
    await update({ ...corePatch, theme_settings: nextSettings });
  }

  function updateCoreField(field: string, value: any) {
    const coreKey = `_core_${field}`;
    setProfile((prev: any) => {
      const activeKey = prev?.theme || 'cupertino';
      const current = (prev?.theme_settings && typeof prev.theme_settings === 'object') ? prev.theme_settings : {};
      const nextSettings = { ...current, [activeKey]: { ...(current[activeKey] || {}), [coreKey]: value } };
      return { ...prev, [field]: value, theme_settings: nextSettings };
    });
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const current = (profile?.theme_settings && typeof profile.theme_settings === 'object') ? profile.theme_settings : {};
      const activeKey = profile?.theme || 'cupertino';
      const nextSettings = { ...current, [activeKey]: { ...(current[activeKey] || {}), [coreKey]: value } };
      await supabase.from('profiles').update({ [field]: value, theme_settings: nextSettings }).eq('id', profileId);
      flashSaved();
    }, 300);
  }

  // Campos que mudam ao trocar de tema: guarda as cores do tema atual e recupera as do novo (ou os padrões dele)
  function themeSwitchPatch(themeKey: string) {
    const currentKey = profile?.theme || 'cupertino';
    const currentSettings = (profile?.theme_settings && typeof profile.theme_settings === 'object') ? profile.theme_settings : {};

    const savedCore: Record<string, any> = {};
    if (profile?.bg_color != null) savedCore._core_bg_color = profile.bg_color;
    if (profile?.button_color != null) savedCore._core_button_color = profile.button_color;
    if (profile?.text_color != null) savedCore._core_text_color = profile.text_color;
    if (profile?.border_width != null) savedCore._core_border_width = profile.border_width;
    if (profile?.shadow_offset != null) savedCore._core_shadow_offset = profile.shadow_offset;

    const nextSettings = {
      ...currentSettings,
      [currentKey]: { ...(currentSettings[currentKey] || {}), ...savedCore },
    };

    const stored = nextSettings[themeKey] || {};
    const defaults = getTheme(themeKey).meta.defaults;

    return {
      theme: themeKey,
      bg_color: stored._core_bg_color ?? defaults.bg_color,
      button_color: stored._core_button_color ?? defaults.button_color,
      text_color: stored._core_text_color ?? defaults.text_color,
      border_width: stored._core_border_width ?? defaults.border_width ?? 2,
      shadow_offset: stored._core_shadow_offset ?? defaults.shadow_offset ?? 4,
      theme_settings: nextSettings,
    };
  }

  const activeKey = profile?.theme || 'cupertino';
  const isLocked = (key: string) => key !== activeKey && proOnlyThemes.includes(key) && !has('pro_themes');

  async function applyCandidate() {
    if (!candidate) return;
    // Temas Pro: o banco também bloqueia a troca para quem não tem o recurso
    if (isLocked(candidate)) { openUpgrade(); return; }
    await update(themeSwitchPatch(candidate));
    setCandidate(null);
    setPreviewOpen(false);
  }

  function pickTheme(key: string) {
    setCandidate(key === activeKey ? null : key);
  }

  const themeList = useMemo(() => [
    ...catalogOrder.filter(k => THEMES[k]).map(k => THEMES[k]),
    ...Object.values(THEMES).filter(({ meta }) => !catalogOrder.includes(meta.key)),
  ].filter(({ meta }) => !disabledThemes.includes(meta.key) || activeKey === meta.key), [catalogOrder, disabledThemes, activeKey]);

  const visibleThemes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return themeList.filter(({ meta }) => {
      const pro = proOnlyThemes.includes(meta.key);
      if (filter === 'free' && pro) return false;
      if (filter === 'pro' && !pro) return false;
      if (filter === 'new' && !NEW_THEMES.has(meta.key)) return false;
      if (q && !meta.name.toLowerCase().includes(q) && !meta.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [themeList, filter, query, proOnlyThemes]);

  if (!profile) return <div>Carregando...</div>;

  const activeTheme = getTheme(activeKey);
  const themeControls = activeTheme.meta.controls || [];
  const themeValues = (profile.theme_settings && typeof profile.theme_settings === 'object')
    ? (profile.theme_settings[activeKey] || {})
    : {};
  const previewProfile = candidate ? { ...profile, ...themeSwitchPatch(candidate) } : profile;
  const candidateName = candidate ? getTheme(candidate).meta.name : '';
  const candidateLocked = candidate ? isLocked(candidate) : false;

  const preview = (
    <BioPreview profileId={profileId} profile={previewProfile} links={links} socials={socials} videos={videos} banners={banners} />
  );

  const applyBar = candidate && (
    <div className="flex items-center gap-2">
      <button onClick={() => setCandidate(null)} className="brutal-btn bg-white px-4 py-2 text-sm">Cancelar</button>
      <button onClick={applyCandidate} className="brutal-btn bg-black text-white px-4 py-2 text-sm gap-1.5">
        {candidateLocked ? <><Lock className="w-4 h-4" /> Liberar no Pro</> : <><Check className="w-4 h-4" /> Aplicar {candidateName}</>}
      </button>
    </div>
  );

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-8 pb-24 lg:pb-0">
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="font-display text-4xl">Aparência</h1>
          <span className={`text-xs font-bold inline-flex items-center gap-1 transition-opacity ${saved ? 'opacity-100' : 'opacity-0'}`} aria-live="polite">
            <Check className="w-4 h-4" /> Salvo
          </span>
        </div>

        {/* Fundo igual ao do painel (biolime/20 sobre branco) para o conteúdo não aparecer por trás das abas */}
        <div className="sticky top-16 md:top-0 z-20 -mx-6 px-6 md:-ml-10 md:pl-10 md:mr-0 md:pr-0 py-2 bg-[#F2FCE0]">
          <div className="flex gap-1.5 overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => changeTab(t.key)}
                className={`shrink-0 inline-flex items-center gap-2 px-3 py-2 brutal-border text-sm font-bold ${tab === t.key ? 'bg-bioyellow brutal-shadow' : 'bg-white hover:bg-bioyellow/40'}`}
              >
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'tema' && (
          <div className="mt-4 flex flex-col gap-5">
            <section className="brutal-card bg-white p-4 flex items-center gap-4 flex-wrap">
              <div className="flex -space-x-2" aria-hidden>
                {[profile.bg_color, profile.button_color, profile.text_color].map((c, i) => (
                  <span key={i} className="w-9 h-9 rounded-full brutal-border" style={{ backgroundColor: c || '#fff' }} />
                ))}
              </div>
              <div className="flex-1 min-w-[160px]">
                <p className="text-[10px] font-bold uppercase tracking-wide text-black/60">Tema atual</p>
                <p className="font-display text-xl leading-tight">{activeTheme.meta.name}</p>
              </div>
              <button onClick={() => changeTab('estilo')} className="brutal-btn bg-black text-white px-4 py-2 text-sm gap-2">
                <SlidersHorizontal className="w-4 h-4" /> Personalizar
              </button>
            </section>

            <section className="brutal-card bg-white p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="inline-flex brutal-border bg-white p-1 gap-1">
                  {([['all', 'Todos'], ['free', 'Grátis'], ['pro', 'Pro'], ['new', 'Novos']] as [Filter, string][]).map(([k, l]) => (
                    <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1 text-xs font-bold ${filter === k ? 'bg-black text-white' : ''}`}>{l}</button>
                  ))}
                </div>
                <label className="relative flex-1 min-w-[160px] max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/50" />
                  <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar tema" className="w-full brutal-input pl-8 pr-3 py-1.5 text-sm" />
                </label>
              </div>
              <p className="text-xs text-black/60 mt-3 mb-4">Clique num tema para ver como fica com o seu conteúdo. Nada muda até você aplicar.</p>

              {visibleThemes.length === 0 ? (
                <p className="text-sm text-black/60 py-6 text-center">Nenhum tema encontrado.</p>
              ) : (
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                  {visibleThemes.map(({ meta }) => {
                    const active = activeKey === meta.key;
                    const testing = candidate === meta.key;
                    const pro = proOnlyThemes.includes(meta.key);
                    const locked = isLocked(meta.key);
                    const preset = showcase[meta.key];
                    const demo = preset?.show_in_catalog ? catalogDemoFor(preset) : null;
                    return (
                      <button
                        key={meta.key}
                        onClick={() => pickTheme(meta.key)}
                        className={`group brutal-border text-left overflow-hidden bg-white transition-all ${testing ? 'brutal-shadow -translate-y-0.5 ring-2 ring-bioblue' : active ? 'brutal-shadow' : 'hover:-translate-y-0.5 hover:brutal-shadow'}`}
                      >
                        <div className="relative bg-[#F7F7F5] border-b-2 border-black flex justify-center py-4">
                          <LazyMount>
                            {(w, h) => (
                            <ThemeMockup
                              themeKey={meta.key}
                              overrides={demo?.profile as any}
                              links={demo?.links}
                              socials={demo?.socials}
                              videos={demo?.videos}
                              banners={demo?.banners}
                              themeSettings={demo?.themeSettings}
                              width={w}
                              height={h}
                            />
                            )}
                          </LazyMount>
                          <span className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10">
                            {active && <Badge className="bg-black text-white"><Check className="w-3 h-3" /> Ativo</Badge>}
                          </span>
                          {testing && (
                            <span className="absolute bottom-2 inset-x-2 z-10 flex justify-center">
                              <Badge className="bg-bioblue text-white"><Eye className="w-3 h-3" /> Na prévia</Badge>
                            </span>
                          )}
                          <span className="absolute top-2 right-2 flex flex-col gap-1 items-end z-10">
                            {pro && <Badge className="bg-bioyellow text-black">{locked && <Lock className="w-3 h-3" />} Pro</Badge>}
                            {NEW_THEMES.has(meta.key) && !pro && <Badge className="bg-biolime text-black"><Sparkles className="w-3 h-3" /> Novo</Badge>}
                          </span>
                        </div>
                        <div className={`px-3 py-2 ${active ? 'bg-bioyellow' : 'bg-white'}`}>
                          <p className="font-display text-base leading-tight truncate">{meta.name}</p>
                          <p className="text-[11px] text-black/60 line-clamp-1">{meta.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {tab === 'estilo' && (
          <section className="brutal-card bg-white p-5 mt-4">
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <h2 className="font-display text-xl">Ajustes de {activeTheme.meta.name}</h2>
              <button onClick={() => changeTab('tema')} className="text-xs font-bold underline">Trocar tema</button>
            </div>
            {themeControls.length > 0 ? (
              <ThemeControls
                controls={themeControls}
                values={themeValues}
                coreValues={{
                  bg_color: profile.bg_color,
                  button_color: profile.button_color,
                  text_color: profile.text_color,
                  avatar_size: profile.avatar_size,
                  border_width: profile.border_width,
                  shadow_offset: profile.shadow_offset,
                }}
                onChange={(k, v) => updateThemeSetting(activeKey, k, v)}
                onCoreChange={updateCoreField}
                onReset={() => resetThemeSettings(activeKey)}
                onResetGroup={(g) => resetThemeGroup(activeKey, g)}
              />
            ) : (
              <p className="text-sm text-black/60">Este tema não tem ajustes extras.</p>
            )}
          </section>
        )}

        {tab === 'ordem' && (
          <section className="brutal-card bg-white p-5 mt-4">
            <h2 className="font-display text-xl">Ordem das seções</h2>
            <p className="text-xs font-bold text-black/60 mt-1 mb-4">Arraste para reorganizar a ordem dos elementos na sua página.</p>
            <SectionOrderControl
              order={profile.section_order || ['socials', 'links', 'banners', 'videos']}
              onChange={(next) => update({ section_order: next })}
            />
          </section>
        )}
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-6 flex flex-col items-center gap-3">
          <h2 className="font-display text-lg self-start">{candidate ? `Testando: ${candidateName}` : 'Prévia'}</h2>
          {preview}
          {candidate ? applyBar : <p className="text-xs text-black/60 text-center">As mudanças são salvas automaticamente.</p>}
        </div>
      </div>

      {/* Celular: barra fixa com prévia e, ao testar um tema, aplicar/cancelar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t-[3px] border-black px-4 py-3 flex items-center justify-between gap-2">
        <button onClick={() => setPreviewOpen(true)} className="brutal-btn bg-white px-3 py-2 text-sm gap-1.5">
          <Eye className="w-4 h-4" /> Ver prévia
        </button>
        {candidate ? (
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setCandidate(null)} aria-label="Cancelar" className="brutal-btn bg-white p-2"><X className="w-4 h-4" /></button>
            <button onClick={applyCandidate} className="brutal-btn bg-black text-white px-3 py-2 text-sm gap-1.5 truncate">
              {candidateLocked ? <><Lock className="w-4 h-4" /> Liberar no Pro</> : <><Check className="w-4 h-4" /> Aplicar {candidateName}</>}
            </button>
          </div>
        ) : (
          <span className={`text-xs font-bold inline-flex items-center gap-1 ${saved ? 'opacity-100' : 'opacity-0'}`}><Check className="w-4 h-4" /> Salvo</span>
        )}
      </div>

      {previewOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col">
          <div className="absolute inset-0 bg-black/60" onClick={() => setPreviewOpen(false)} />
          <div className="relative mt-auto bg-white brutal-border-t max-h-[92dvh] flex flex-col animate-slide-up">
            <div className="flex items-center justify-between px-5 py-3 border-b-[3px] border-black shrink-0">
              <span className="font-display text-lg">{candidate ? `Testando: ${candidateName}` : 'Prévia'}</span>
              <button onClick={() => setPreviewOpen(false)} className="brutal-btn p-2 bg-white" aria-label="Fechar prévia">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 flex items-start justify-center py-6 px-4">{preview}</div>
            {candidate && <div className="border-t-[3px] border-black px-4 py-3 flex justify-end shrink-0">{applyBar}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 brutal-border inline-flex items-center gap-1 ${className}`}>{children}</span>;
}

// Só monta a miniatura quando o card chega perto da tela (são vários temas renderizados de verdade).
// O celular ocupa a largura do card inteiro, na proporção do frame (220 x 504), sem cortar.
const PHONE_RATIO = 504 / 220;
function LazyMount({ children }: { children: (width: number, height: number) => React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }, { rootMargin: '300px' });
    io.observe(el);
    return () => { ro.disconnect(); io.disconnect(); };
  }, []);
  const w = Math.min(200, Math.max(0, width - 28));
  const h = Math.round(w * PHONE_RATIO);
  return (
    <div ref={ref} className="w-full flex justify-center">
      {visible && w > 0 ? children(w, h) : <div className="bg-white/60 rounded-[20px] animate-pulse" style={{ width: w || 120, height: (h || 270) + 16 }} />}
    </div>
  );
}
