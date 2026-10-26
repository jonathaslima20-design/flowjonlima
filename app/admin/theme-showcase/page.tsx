'use client';

import { useEffect, useMemo, useState } from 'react';
import { THEMES } from '@/themes/registry';
import { ThemeMockup } from '@/components/themes/ThemeMockup';
import { MediaUploader } from '@/components/admin/MediaUploader';
import { DemoPageEditor, Field, type DemoPageValue } from '@/components/admin/DemoPageEditor';
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
import { ArrowUp, ArrowDown, Save, RotateCcw, Copy, CopyPlus } from 'lucide-react';

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
      if (sp) setSocialProof(sp);
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

  // Editor compartilhado: lê e grava os campos da aba atual (catálogo ou landing)
  const demoValue: DemoPageValue = {
    profile: profileOverride || {},
    links: linksOverride || [],
    socials: socialsOverride || [],
    banners: bannersOverride || [],
    videos: videosOverride || [],
    theme_core: themeCore || {},
    theme_settings: themeSettings || {},
  };
  const demoFields: Record<keyof DemoPageValue, keyof ShowcasePreset> = {
    profile: profileField, links: linksField, socials: socialsField, banners: bannersField,
    videos: videosField, theme_core: coreField, theme_settings: settingsField,
  } as Record<keyof DemoPageValue, keyof ShowcasePreset>;
  function changeDemo(fn: (prev: DemoPageValue) => Partial<DemoPageValue>) {
    patchSelectedFn((prev) => {
      const current: DemoPageValue = {
        profile: (prev as any)[profileField] || {},
        links: (prev as any)[linksField] || [],
        socials: (prev as any)[socialsField] || [],
        banners: (prev as any)[bannersField] || [],
        videos: (prev as any)[videosField] || [],
        theme_core: (prev as any)[coreField] || {},
        theme_settings: (prev as any)[settingsField] || {},
      };
      const patch = fn(current);
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(patch)) out[demoFields[k as keyof DemoPageValue] as string] = v;
      return out as Partial<ShowcasePreset>;
    });
  }
  function flashToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  }

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

          <DemoPageEditor
            themeKey={selectedKey}
            value={demoValue}
            onChange={changeDemo}
            pathBase={pathBase}
            onToast={flashToast}
            afterProfile={tab === 'landing' ? (
              <Field label="Tagline do slide (admin)" full>
                <input type="text" value={selected.landing_tagline ?? ''} placeholder="Ex: Ideal para criadores"
                  onChange={(e) => patchSelected({ landing_tagline: e.target.value })}
                  className="brutal-input py-2 px-3 text-sm w-full" />
              </Field>
            ) : null}
          />
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

