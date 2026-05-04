'use client';

import { useEffect, useMemo, useState } from 'react';
import { THEMES, getTheme } from '@/themes/registry';
import { ThemeMockup } from '@/components/themes/ThemeMockup';
import { ThemeControls } from '@/components/dashboard/ThemeControls';
import { MediaUploader } from '@/components/admin/MediaUploader';
import {
  ShowcasePreset,
  emptyPreset,
  fetchAllShowcasePresets,
  upsertShowcasePreset,
  landingDemoFor,
  catalogDemoFor,
  LandingCarouselSettings,
  DEFAULT_CAROUSEL_SETTINGS,
  fetchLandingCarouselSettings,
  updateLandingCarouselSettings,
  SocialProofConfig,
  DEFAULT_SOCIAL_PROOF,
  fetchSocialProof,
  updateSocialProof,
} from '@/lib/theme-showcase';
import { ArrowUp, ArrowDown, Save, RotateCcw, Copy, Plus, Trash2, CopyPlus } from 'lucide-react';
import { parseVideoUrl } from '@/lib/embed';

type Tab = 'catalog' | 'landing';

export default function AdminThemeShowcasePage() {
  const [presets, setPresets] = useState<Record<string, ShowcasePreset>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string>('brutalist');
  const [tab, setTab] = useState<Tab>('catalog');
  const [toast, setToast] = useState<string>('');
  const [carouselCfg, setCarouselCfg] = useState<LandingCarouselSettings>(DEFAULT_CAROUSEL_SETTINGS);
  const [savingCfg, setSavingCfg] = useState(false);
  const [socialProof, setSocialProof] = useState<SocialProofConfig>(DEFAULT_SOCIAL_PROOF);
  const [savingSP, setSavingSP] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [all, cfg, sp] = await Promise.all([
        fetchAllShowcasePresets(),
        fetchLandingCarouselSettings(),
        fetchSocialProof(),
      ]);
      const map: Record<string, ShowcasePreset> = {};
      for (const p of all) map[p.theme_key] = { ...emptyPreset(p.theme_key), ...p };
      for (const key of Object.keys(THEMES)) {
        if (!map[key]) map[key] = emptyPreset(key);
      }
      setPresets(map);
      setCarouselCfg(cfg);
      setSocialProof(sp);
      setLoading(false);
    })();
  }, []);

  function patchCfg(patch: Partial<LandingCarouselSettings>) {
    setCarouselCfg(prev => ({ ...prev, ...patch }));
  }

  async function saveCfg() {
    setSavingCfg(true);
    const { error } = await updateLandingCarouselSettings(carouselCfg);
    setSavingCfg(false);
    setToast(error ? 'Erro ao salvar: ' + error.message : 'Controles da landing salvos!');
    setTimeout(() => setToast(''), 2000);
  }

  function resetCfg() {
    setCarouselCfg(DEFAULT_CAROUSEL_SETTINGS);
  }

  async function saveSocialProof() {
    setSavingSP(true);
    const { error } = await updateSocialProof(socialProof);
    setSavingSP(false);
    setToast(error ? 'Erro ao salvar: ' + error.message : 'Social proof salvo!');
    setTimeout(() => setToast(''), 2000);
  }

  function patchSocialProofAvatar(idx: number, url: string) {
    setSocialProof(prev => {
      const avatars = [...prev.avatars];
      avatars[idx] = url;
      return { ...prev, avatars };
    });
  }

  function removeSocialProofAvatar(idx: number) {
    setSocialProof(prev => {
      const avatars = [...prev.avatars];
      avatars[idx] = '';
      return { ...prev, avatars };
    });
  }

  const selected = presets[selectedKey] || emptyPreset(selectedKey);

  const landingList = useMemo(() => {
    return Object.values(presets)
      .filter(p => p.show_in_landing_carousel)
      .sort((a, b) => a.landing_order - b.landing_order);
  }, [presets]);

  function patchSelected(patch: Partial<ShowcasePreset>) {
    setPresets(prev => ({
      ...prev,
      [selectedKey]: { ...(prev[selectedKey] || emptyPreset(selectedKey)), ...patch },
    }));
  }

  function patchSelectedFn(fn: (prev: ShowcasePreset) => Partial<ShowcasePreset>) {
    setPresets(prev => {
      const base = prev[selectedKey] || emptyPreset(selectedKey);
      return { ...prev, [selectedKey]: { ...base, ...fn(base) } };
    });
  }

  async function save() {
    setSaving(true);
    const preset = presets[selectedKey];
    if (!preset) { setSaving(false); return; }
    const { error } = await upsertShowcasePreset(preset);
    setSaving(false);
    setToast(error ? 'Erro ao salvar: ' + error.message : 'Salvo!');
    setTimeout(() => setToast(''), 2000);
  }

  async function toggleFlag(themeKey: string, field: 'show_in_catalog' | 'show_in_landing_carousel', value: boolean) {
    const current = presets[themeKey] || emptyPreset(themeKey);
    const next: ShowcasePreset = { ...current, [field]: value };
    if (field === 'show_in_landing_carousel' && value && (current.landing_order == null || current.landing_order === 0)) {
      next.landing_order = Object.values(presets).filter(p => p.show_in_landing_carousel).length + 1;
    }
    setPresets(prev => ({ ...prev, [themeKey]: next }));
    await upsertShowcasePreset(next);
  }

  async function duplicateToLanding(themeKey: string) {
    const current = presets[themeKey] || emptyPreset(themeKey);
    const landingOrder = current.show_in_landing_carousel
      ? current.landing_order
      : Object.values(presets).filter(p => p.show_in_landing_carousel).length + 1;
    const next: ShowcasePreset = {
      ...current,
      landing_profile: { ...current.catalog_profile },
      landing_links: [...current.catalog_links],
      landing_socials: [...current.catalog_socials],
      landing_videos: [...current.catalog_videos],
      landing_banners: [...current.catalog_banners],
      landing_theme_core: { ...current.catalog_theme_core },
      landing_theme_settings: { ...current.catalog_theme_settings },
      show_in_landing_carousel: true,
      landing_order: landingOrder,
    };
    setPresets(prev => ({ ...prev, [themeKey]: next }));
    const { error } = await upsertShowcasePreset(next);
    setToast(error ? 'Erro: ' + error.message : `${THEMES[themeKey]?.meta.name || themeKey} duplicado para a landing`);
    setTimeout(() => setToast(''), 2000);
  }

  async function moveLanding(themeKey: string, dir: -1 | 1) {
    const ordered = [...landingList];
    const idx = ordered.findIndex(p => p.theme_key === themeKey);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= ordered.length) return;
    const reordered = [...ordered];
    [reordered[idx], reordered[swap]] = [reordered[swap], reordered[idx]];
    const updated = reordered.map((p, i) => ({ ...p, landing_order: i + 1 }));
    const newMap = { ...presets };
    for (const p of updated) newMap[p.theme_key] = p;
    setPresets(newMap);
    await Promise.all(updated.map(p => upsertShowcasePreset(newMap[p.theme_key])));
  }

  function copyAcross(direction: 'catalog_to_landing' | 'landing_to_catalog') {
    if (direction === 'catalog_to_landing') {
      patchSelected({
        landing_profile: { ...selected.catalog_profile },
        landing_links: [...selected.catalog_links],
        landing_socials: [...selected.catalog_socials],
        landing_videos: [...selected.catalog_videos],
        landing_banners: [...selected.catalog_banners],
        landing_theme_core: { ...selected.catalog_theme_core },
        landing_theme_settings: { ...selected.catalog_theme_settings },
      });
    } else {
      patchSelected({
        catalog_profile: { ...selected.landing_profile },
        catalog_links: [...selected.landing_links],
        catalog_socials: [...selected.landing_socials],
        catalog_videos: [...selected.landing_videos],
        catalog_banners: [...selected.landing_banners],
        catalog_theme_core: { ...selected.landing_theme_core },
        catalog_theme_settings: { ...selected.landing_theme_settings },
      });
    }
  }

  function resetTab() {
    if (tab === 'catalog') {
      patchSelected({
        catalog_profile: {},
        catalog_links: [],
        catalog_socials: [],
        catalog_videos: [],
        catalog_banners: [],
        catalog_theme_core: {},
        catalog_theme_settings: {},
      });
    } else {
      patchSelected({
        landing_profile: {},
        landing_links: [],
        landing_socials: [],
        landing_videos: [],
        landing_banners: [],
        landing_theme_core: {},
        landing_theme_settings: {},
        landing_tagline: '',
      });
    }
  }

  const profileOverride = tab === 'catalog' ? selected.catalog_profile : selected.landing_profile;
  const linksOverride = tab === 'catalog' ? selected.catalog_links : selected.landing_links;
  const socialsOverride = tab === 'catalog' ? selected.catalog_socials : selected.landing_socials;
  const bannersOverride = tab === 'catalog' ? selected.catalog_banners : selected.landing_banners;
  const videosOverride = tab === 'catalog' ? selected.catalog_videos : selected.landing_videos;
  const themeCore = tab === 'catalog' ? selected.catalog_theme_core : selected.landing_theme_core;
  const themeSettings = tab === 'catalog' ? selected.catalog_theme_settings : selected.landing_theme_settings;

  const demo = tab === 'catalog' ? catalogDemoFor(selected) : landingDemoFor(selected);
  const pathBase = `${selectedKey}/${tab}`;

  const profileField = tab === 'catalog' ? 'catalog_profile' : 'landing_profile';
  const linksField = tab === 'catalog' ? 'catalog_links' : 'landing_links';
  const socialsField = tab === 'catalog' ? 'catalog_socials' : 'landing_socials';
  const bannersField = tab === 'catalog' ? 'catalog_banners' : 'landing_banners';
  const videosField = tab === 'catalog' ? 'catalog_videos' : 'landing_videos';
  const coreField = tab === 'catalog' ? 'catalog_theme_core' : 'landing_theme_core';
  const settingsField = tab === 'catalog' ? 'catalog_theme_settings' : 'landing_theme_settings';

  function setProfile(field: string, value: any) {
    patchSelectedFn((prev) => ({ [profileField]: { ...((prev as any)[profileField] || {}), [field]: value } } as any));
  }

  function mutateArr(fieldKey: keyof ShowcasePreset, mutator: (arr: any[]) => any[]) {
    patchSelectedFn((prev) => ({ [fieldKey]: mutator(((prev as any)[fieldKey] || []) as any[]) } as any));
  }

  function setLinksField(idx: number, field: string, value: any) {
    mutateArr(linksField as any, (arr) => {
      const next = [...arr];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }
  function addLink() {
    mutateArr(linksField as any, (arr) => [...arr, { id: `l_${Date.now()}`, title: 'Novo link', subtitle: '', url: '#', is_active: true }]);
  }
  function removeLink(idx: number) {
    mutateArr(linksField as any, (arr) => { const next = [...arr]; next.splice(idx, 1); return next; });
  }

  function setSocialField(idx: number, field: string, value: any) {
    mutateArr(socialsField as any, (arr) => {
      const next = [...arr];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }
  function addSocial() {
    mutateArr(socialsField as any, (arr) => [...arr, { id: `s_${Date.now()}`, platform: 'instagram', url: '#' }]);
  }
  function removeSocial(idx: number) {
    mutateArr(socialsField as any, (arr) => { const next = [...arr]; next.splice(idx, 1); return next; });
  }

  function setBannerField(idx: number, field: string, value: any) {
    mutateArr(bannersField as any, (arr) => {
      const next = [...arr];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }
  function addBanner() {
    mutateArr(bannersField as any, (arr) => [...arr, { id: `b_${Date.now()}`, image_url: '', title: '', subtitle: '', url: '#' }]);
  }
  function removeBanner(idx: number) {
    mutateArr(bannersField as any, (arr) => { const next = [...arr]; next.splice(idx, 1); return next; });
  }

  function setVideoField(idx: number, field: string, value: any) {
    mutateArr(videosField as any, (arr) => {
      const next = [...arr];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }
  function normalizeVideoUrl(idx: number) {
    mutateArr(videosField as any, (arr) => {
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
  function addVideo() {
    mutateArr(videosField as any, (arr) => [...arr, { id: `v_${Date.now()}`, platform: 'youtube', title: '', embed_url: '', thumbnail: '', file_url: '' }]);
  }
  function removeVideo(idx: number) {
    mutateArr(videosField as any, (arr) => { const next = [...arr]; next.splice(idx, 1); return next; });
  }

  function updateCoreField(field: string, value: any) {
    patchSelectedFn((prev) => ({ [coreField]: { ...((prev as any)[coreField] || {}), [field]: value } } as any));
  }
  function updateThemeSetting(_themeKey: string, key: string, value: any) {
    patchSelectedFn((prev) => ({ [settingsField]: { ...((prev as any)[settingsField] || {}), [key]: value } } as any));
  }
  function resetAllTheme() {
    patchSelected(tab === 'catalog'
      ? { catalog_theme_core: {}, catalog_theme_settings: {} }
      : { landing_theme_core: {}, landing_theme_settings: {} }
    );
  }

  const activeTheme = getTheme(selectedKey);
  const controls = activeTheme.meta.controls || [];

  if (loading) {
    return <div className="p-6 font-bold">Carregando vitrine...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">Vitrine de Temas</h1>
          <p className="text-sm text-black/70 mt-1 max-w-2xl">
            Personalize os dados de demonstração mostrados em cada tema — dois conjuntos independentes: um para o catálogo (dashboard) e outro para o carrossel da landing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="brutal-btn bg-bioyellow px-4 py-2 font-bold text-sm gap-2 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar tema atual'}
          </button>
        </div>
      </div>

      {toast && (
        <div className="mb-4 inline-block brutal-card px-4 py-2 bg-biolime font-bold">{toast}</div>
      )}

      <div className="brutal-card p-4 bg-white mb-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h2 className="font-display text-xl">Controles do carrossel da landing</h2>
            <p className="text-xs text-black/70">Velocidade, efeitos e interação dos cards exibidos na página inicial.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={resetCfg} className="text-[11px] font-bold uppercase underline underline-offset-4 inline-flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Restaurar padrão
            </button>
            <button
              onClick={saveCfg}
              disabled={savingCfg}
              className="brutal-btn bg-bioyellow px-3 py-1.5 font-bold text-xs gap-2 disabled:opacity-60"
            >
              <Save className="w-3 h-3" />
              {savingCfg ? 'Salvando...' : 'Salvar controles'}
            </button>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <CfgSlider label="Tempo entre slides" unit="ms" min={1500} max={12000} step={250}
            value={carouselCfg.auto_advance_ms}
            onChange={(v) => patchCfg({ auto_advance_ms: v })} />
          <CfgSlider label="Duração da transição" unit="ms" min={150} max={2000} step={50}
            value={carouselCfg.transition_ms}
            onChange={(v) => patchCfg({ transition_ms: v })} />
          <CfgSlider label="Escala ativa" unit="" min={0.8} max={1.2} step={0.01}
            value={carouselCfg.scale_active}
            onChange={(v) => patchCfg({ scale_active: v })} />
          <CfgSlider label="Escala dos laterais" unit="" min={0.4} max={1.0} step={0.01}
            value={carouselCfg.scale_inactive}
            onChange={(v) => patchCfg({ scale_inactive: v })} />
          <CfgSlider label="Deslocamento horizontal" unit="%" min={0} max={60} step={1}
            value={carouselCfg.translate_percent}
            onChange={(v) => patchCfg({ translate_percent: v })} />
          <CfgSlider label="Opacidade dos laterais" unit="" min={0} max={1} step={0.05}
            value={carouselCfg.inactive_opacity}
            onChange={(v) => patchCfg({ inactive_opacity: v })} />
          <label className="text-xs font-bold flex items-center gap-2 brutal-border bg-[#FAFAFA] px-3 py-2">
            <input type="checkbox" checked={carouselCfg.drag_enabled}
              onChange={(e) => patchCfg({ drag_enabled: e.target.checked })} />
            Permitir arrastar (mouse/touch)
          </label>
          <label className="text-xs font-bold flex items-center gap-2 brutal-border bg-[#FAFAFA] px-3 py-2">
            <input type="checkbox" checked={carouselCfg.pause_on_hover}
              onChange={(e) => patchCfg({ pause_on_hover: e.target.checked })} />
            Pausar ao passar o mouse
          </label>
        </div>
      </div>

      {/* SOCIAL PROOF */}
      <div className="brutal-card p-4 bg-white mb-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h2 className="font-display text-xl">Social Proof da Landing</h2>
            <p className="text-xs text-black/70">Avatares e frase exibidos no Hero da página inicial.</p>
          </div>
          <button
            onClick={saveSocialProof}
            disabled={savingSP}
            className="brutal-btn bg-bioyellow px-3 py-1.5 font-bold text-xs gap-2 disabled:opacity-60"
          >
            <Save className="w-3 h-3" />
            {savingSP ? 'Salvando...' : 'Salvar'}
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-bold mb-1">Frase exibida</label>
          <input
            type="text"
            value={socialProof.text}
            onChange={(e) => setSocialProof(prev => ({ ...prev, text: e.target.value }))}
            className="brutal-input py-2 px-3 text-sm w-full max-w-lg"
          />
        </div>

        <div>
          <div className="text-xs font-bold mb-2">Avatares (até 4)</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="brutal-border bg-[#FAFAFA] p-3 flex flex-col gap-2">
                <div className="text-[10px] font-bold text-black/60">Avatar {idx + 1}</div>
                <MediaUploader
                  kind="image"
                  value={socialProof.avatars[idx] || ''}
                  pathPrefix="social-proof/avatars"
                  onUploaded={(url) => patchSocialProofAvatar(idx, url)}
                  onRemove={() => removeSocialProofAvatar(idx)}
                />
                <input
                  type="text"
                  value={socialProof.avatars[idx] || ''}
                  placeholder="Ou cole uma URL externa"
                  onChange={(e) => patchSocialProofAvatar(idx, e.target.value)}
                  className="brutal-input py-1.5 px-2 text-xs w-full"
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="text-xs font-bold text-black/60">Preview:</div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <div className="flex -space-x-2">
                {socialProof.avatars.filter(Boolean).map((url, i) => (
                  <img key={i} src={url} alt="" className="w-8 h-8 rounded-full brutal-border object-cover" />
                ))}
              </div>
              {socialProof.text}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr_320px] gap-4">
        {/* THEME LIST */}
        <aside className="brutal-card p-3 bg-white">
          <h2 className="font-display text-lg mb-3">Temas</h2>
          <div className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto pr-1">
            {Object.values(THEMES).map(({ meta }) => {
              const p = presets[meta.key] || emptyPreset(meta.key);
              const active = selectedKey === meta.key;
              return (
                <div key={meta.key} className={`brutal-border ${active ? 'bg-bioyellow' : 'bg-white hover:bg-black/5'} transition-colors`}>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setSelectedKey(meta.key)} className="flex-1 text-left px-3 py-2 text-sm font-bold">
                      {meta.name}
                    </button>
                    <button
                      onClick={() => duplicateToLanding(meta.key)}
                      title="Duplicar para a landing"
                      className="w-8 h-8 flex items-center justify-center hover:bg-black/10"
                      aria-label="Duplicar para a landing"
                    >
                      <CopyPlus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between px-3 pb-2 text-[10px] font-bold gap-2">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={p.show_in_catalog}
                        onChange={(e) => toggleFlag(meta.key, 'show_in_catalog', e.target.checked)} />
                      Catálogo
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={p.show_in_landing_carousel}
                        onChange={(e) => toggleFlag(meta.key, 'show_in_landing_carousel', e.target.checked)} />
                      Landing
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <h3 className="font-display text-base mt-5 mb-2">Ordem na Landing</h3>
          <div className="flex flex-col gap-1.5">
            {landingList.length === 0 && <p className="text-[11px] text-black/60">Nenhum tema selecionado para a landing.</p>}
            {landingList.map((p) => {
              const meta = THEMES[p.theme_key]?.meta;
              if (!meta) return null;
              return (
                <div key={p.theme_key} className="flex items-center gap-1 brutal-border bg-white px-2 py-1.5">
                  <span className="flex-1 text-xs font-bold truncate">{meta.name}</span>
                  <button onClick={() => moveLanding(p.theme_key, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-black/10" aria-label="Subir">
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button onClick={() => moveLanding(p.theme_key, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-black/10" aria-label="Descer">
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        {/* EDITOR */}
        <section className="brutal-card p-4 bg-white">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex gap-1">
              <TabBtn active={tab === 'catalog'} onClick={() => setTab('catalog')}>Catálogo</TabBtn>
              <TabBtn active={tab === 'landing'} onClick={() => setTab('landing')}>Landing</TabBtn>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyAcross(tab === 'catalog' ? 'catalog_to_landing' : 'landing_to_catalog')}
                className="text-[11px] font-bold uppercase underline underline-offset-4 inline-flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                {tab === 'catalog' ? 'Copiar p/ Landing' : 'Copiar p/ Catálogo'}
              </button>
              <button onClick={resetTab} className="text-[11px] font-bold uppercase underline underline-offset-4 inline-flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Restaurar padrão
              </button>
            </div>
          </div>

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

          {tab === 'landing' && (
            <Field label="Tagline do slide (admin)" full>
              <input type="text" value={selected.landing_tagline ?? ''} placeholder="Ex: Ideal para criadores"
                onChange={(e) => patchSelected({ landing_tagline: e.target.value })}
                className="brutal-input py-2 px-3 text-sm w-full" />
            </Field>
          )}

          {/* LINKS */}
          <SectionHeader title="Links demo" onAdd={addLink} />
          <div className="flex flex-col gap-2 mb-5">
            {(linksOverride || []).length === 0 && <p className="text-[11px] text-black/60">Sem links personalizados (usando padrão).</p>}
            {(linksOverride || []).map((l: any, idx: number) => (
              <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                <input type="text" value={l.title ?? ''} placeholder="Título"
                  onChange={(e) => setLinksField(idx, 'title', e.target.value)}
                  className="brutal-input py-1.5 px-2 text-xs" />
                <input type="text" value={l.subtitle ?? ''} placeholder="Subtítulo"
                  onChange={(e) => setLinksField(idx, 'subtitle', e.target.value)}
                  className="brutal-input py-1.5 px-2 text-xs" />
                <IconBtn onClick={() => removeLink(idx)} />
              </div>
            ))}
          </div>

          {/* SOCIALS */}
          <SectionHeader title="Redes sociais demo" onAdd={addSocial} />
          <div className="flex flex-col gap-2 mb-5">
            {(socialsOverride || []).length === 0 && <p className="text-[11px] text-black/60">Sem redes personalizadas.</p>}
            {(socialsOverride || []).map((s: any, idx: number) => (
              <div key={idx} className="grid grid-cols-[160px_1fr_auto] gap-2 items-center">
                <select value={s.platform ?? 'instagram'} onChange={(e) => setSocialField(idx, 'platform', e.target.value)}
                  className="brutal-input py-1.5 px-2 text-xs bg-white">
                  {['instagram','youtube','tiktok','x','facebook','linkedin','github','twitch','whatsapp','telegram','threads','pinterest','spotify','soundcloud','discord','email','website'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <input type="text" value={s.url ?? ''} placeholder="https://..."
                  onChange={(e) => setSocialField(idx, 'url', e.target.value)}
                  className="brutal-input py-1.5 px-2 text-xs" />
                <IconBtn onClick={() => removeSocial(idx)} />
              </div>
            ))}
          </div>

          {/* BANNERS */}
          <SectionHeader title="Banners demo" onAdd={addBanner} />
          <div className="flex flex-col gap-3 mb-5">
            {(bannersOverride || []).length === 0 && <p className="text-[11px] text-black/60">Sem banners personalizados.</p>}
            {(bannersOverride || []).map((b: any, idx: number) => (
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
                  <IconBtn onClick={() => removeBanner(idx)} />
                </div>
              </div>
            ))}
          </div>

          {/* VIDEOS */}
          <SectionHeader title="Vídeos demo" onAdd={addVideo} />
          <div className="flex flex-col gap-3 mb-5">
            {(videosOverride || []).length === 0 && <p className="text-[11px] text-black/60">Sem vídeos personalizados.</p>}
            {(videosOverride || []).map((v: any, idx: number) => (
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
                  <IconBtn onClick={() => removeVideo(idx)} />
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
                  values={themeSettings || {}}
                  coreValues={themeCore || {}}
                  onChange={(k, v) => updateThemeSetting(selectedKey, k, v)}
                  onCoreChange={updateCoreField}
                  onReset={resetAllTheme}
                />
              </div>
            </>
          )}
        </section>

        {/* PREVIEW */}
        <aside className="lg:sticky lg:top-4 self-start brutal-card p-4 bg-[#F7F7F5]">
          <h3 className="font-display text-base mb-3">
            Preview ({tab === 'catalog' ? 'Catálogo' : 'Landing'})
          </h3>
          <div className="flex items-center justify-center">
            <ThemeMockup
              themeKey={selectedKey}
              overrides={demo.profile as any}
              links={demo.links}
              socials={demo.socials}
              videos={demo.videos}
              banners={demo.banners}
              themeSettings={demo.themeSettings}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest brutal-border ${active ? 'bg-bioyellow' : 'bg-white hover:bg-black/5'}`}>
      {children}
    </button>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
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

function CfgSlider({
  label, value, onChange, min, max, step, unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}) {
  const display = step < 1 ? value.toFixed(2) : Math.round(value).toString();
  return (
    <label className="block brutal-border bg-[#FAFAFA] px-3 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
        <span className="text-[11px] font-bold text-black/70">{display}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </label>
  );
}

function IconBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-8 h-8 brutal-border bg-white hover:bg-red-100 flex items-center justify-center" aria-label="Remover">
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}
