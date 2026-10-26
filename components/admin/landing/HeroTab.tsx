'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { THEMES } from '@/themes/registry';
import { MediaUploader } from '@/components/admin/MediaUploader';
import { Field } from '@/components/admin/DemoPageEditor';
import { ShowcaseDemoEditor, ShowcasePreview } from '@/components/admin/ShowcaseDemoEditor';
import {
  ShowcasePreset,
  emptyPreset,
  fetchAllShowcasePresets,
  upsertShowcasePreset,
  LandingCarouselSettings,
  DEFAULT_CAROUSEL_SETTINGS,
  fetchLandingCarouselSettings,
  updateLandingCarouselSettings,
  SocialProofConfig,
  DEFAULT_SOCIAL_PROOF,
  fetchSocialProof,
  updateSocialProof,
} from '@/lib/theme-showcase';

// Hero da landing: temas do carrossel (ordem e demonstração de cada slide), animação do carrossel e social proof
export function HeroTab() {
  const [presets, setPresets] = useState<Record<string, ShowcasePreset>>({});
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState('');
  const [carouselCfg, setCarouselCfg] = useState<LandingCarouselSettings>(DEFAULT_CAROUSEL_SETTINGS);
  const [savingCfg, setSavingCfg] = useState(false);
  const [socialProof, setSocialProof] = useState<SocialProofConfig>(DEFAULT_SOCIAL_PROOF);
  const [savingSP, setSavingSP] = useState(false);
  const [adding, setAdding] = useState('');

  useEffect(() => {
    (async () => {
      const [all, cfg, sp] = await Promise.all([fetchAllShowcasePresets(), fetchLandingCarouselSettings(), fetchSocialProof()]);
      const map: Record<string, ShowcasePreset> = {};
      for (const p of all) map[p.theme_key] = { ...emptyPreset(p.theme_key), ...p };
      for (const key of Object.keys(THEMES)) if (!map[key]) map[key] = emptyPreset(key);
      setPresets(map);
      setCarouselCfg(cfg);
      if (sp) setSocialProof(sp);
      const first = Object.values(map).filter(p => p.show_in_landing_carousel && THEMES[p.theme_key]).sort((a, b) => a.landing_order - b.landing_order)[0];
      setSelectedKey(first?.theme_key ?? '');
      setLoading(false);
    })();
  }, []);

  function flashToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  }

  const slides = useMemo(
    () => Object.values(presets).filter(p => p.show_in_landing_carousel && THEMES[p.theme_key]).sort((a, b) => a.landing_order - b.landing_order),
    [presets],
  );
  const selected = selectedKey ? presets[selectedKey] : undefined;

  function patchSelected(fn: (prev: ShowcasePreset) => Partial<ShowcasePreset>) {
    setPresets(prev => {
      const base = prev[selectedKey] || emptyPreset(selectedKey);
      return { ...prev, [selectedKey]: { ...base, ...fn(base) } };
    });
    setDirty(true);
  }

  async function saveSlide() {
    if (!selected) return;
    setSaving(true);
    const { error } = await upsertShowcasePreset(selected);
    setSaving(false);
    if (error) { flashToast('Erro ao salvar: ' + error.message); return; }
    setDirty(false);
    flashToast('Slide salvo');
  }

  function selectSlide(key: string) {
    if (dirty && !confirm('Há alterações não salvas neste slide. Trocar mesmo assim?')) return;
    setSelectedKey(key);
    setDirty(false);
  }

  async function addSlide() {
    if (!adding) return;
    const current = presets[adding] || emptyPreset(adding);
    const next: ShowcasePreset = { ...current, show_in_landing_carousel: true, landing_order: slides.length + 1 };
    setPresets(prev => ({ ...prev, [adding]: next }));
    const { error } = await upsertShowcasePreset(next);
    if (error) { flashToast('Erro: ' + error.message); return; }
    setSelectedKey(adding);
    setDirty(false);
    setAdding('');
    flashToast(`${THEMES[adding]?.meta.name} entrou no carrossel`);
  }

  async function removeSlide(key: string) {
    const next = { ...presets[key], show_in_landing_carousel: false };
    setPresets(prev => ({ ...prev, [key]: next }));
    await upsertShowcasePreset(next);
    if (selectedKey === key) setSelectedKey(slides.find(s => s.theme_key !== key)?.theme_key ?? '');
  }

  async function moveSlide(key: string, dir: -1 | 1) {
    const idx = slides.findIndex(p => p.theme_key === key);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= slides.length) return;
    const reordered = [...slides];
    [reordered[idx], reordered[swap]] = [reordered[swap], reordered[idx]];
    const updated = reordered.map((p, i) => ({ ...p, landing_order: i + 1 }));
    const newMap = { ...presets };
    for (const p of updated) newMap[p.theme_key] = p;
    setPresets(newMap);
    await Promise.all(updated.map(p => upsertShowcasePreset(newMap[p.theme_key])));
  }

  async function saveCfg() {
    setSavingCfg(true);
    const { error } = await updateLandingCarouselSettings(carouselCfg);
    setSavingCfg(false);
    flashToast(error ? 'Erro ao salvar: ' + error.message : 'Animação do carrossel salva');
  }

  async function saveSocialProof() {
    setSavingSP(true);
    const { error } = await updateSocialProof(socialProof);
    setSavingSP(false);
    flashToast(error ? 'Erro ao salvar: ' + error.message : 'Social proof salvo');
  }

  function patchAvatar(idx: number, url: string) {
    setSocialProof(prev => {
      const avatars = [...prev.avatars];
      avatars[idx] = url;
      return { ...prev, avatars };
    });
  }

  if (loading) return <div className="font-bold">Carregando hero...</div>;

  const available = Object.values(THEMES).filter(({ meta }) => !presets[meta.key]?.show_in_landing_carousel);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-2xl">Hero</h2>
        <p className="text-sm text-black/70 max-w-2xl">Os celulares que giram no topo da página inicial, a animação do carrossel e a prova social abaixo do botão.</p>
      </div>
      {toast && <div className="inline-block self-start brutal-card px-4 py-2 bg-biolime font-bold">{toast}</div>}

      <div className="grid lg:grid-cols-[280px_1fr_320px] gap-4 items-start">
        <aside className="brutal-card p-3 bg-white">
          <h3 className="font-display text-lg mb-2">Slides do carrossel</h3>
          <div className="flex flex-col gap-1.5">
            {slides.length === 0 && <p className="text-[11px] text-black/60">Nenhum tema no carrossel.</p>}
            {slides.map((p, i) => (
              <div key={p.theme_key} className={`brutal-border flex items-center gap-1 px-2 py-1.5 ${p.theme_key === selectedKey ? 'bg-bioyellow' : 'bg-white'}`}>
                <span className="text-[10px] font-bold w-4 text-black/50">{i + 1}</span>
                <button onClick={() => selectSlide(p.theme_key)} className="flex-1 text-left text-sm font-bold truncate">{THEMES[p.theme_key]?.meta.name}</button>
                <button onClick={() => moveSlide(p.theme_key, -1)} disabled={i === 0} className="w-6 h-6 flex items-center justify-center disabled:opacity-30" aria-label="Subir"><ArrowUp className="w-3 h-3" /></button>
                <button onClick={() => moveSlide(p.theme_key, 1)} disabled={i === slides.length - 1} className="w-6 h-6 flex items-center justify-center disabled:opacity-30" aria-label="Descer"><ArrowDown className="w-3 h-3" /></button>
                <button onClick={() => removeSlide(p.theme_key)} className="w-6 h-6 flex items-center justify-center hover:text-red-600" aria-label="Tirar do carrossel"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <select value={adding} onChange={e => setAdding(e.target.value)} className="brutal-input py-1.5 px-2 text-xs bg-white flex-1 min-w-0">
              <option value="">Adicionar tema…</option>
              {available.map(({ meta }) => <option key={meta.key} value={meta.key}>{meta.name}</option>)}
            </select>
            <button onClick={addSlide} disabled={!adding} className="brutal-btn bg-white px-2 text-xs disabled:opacity-50" aria-label="Adicionar"><Plus className="w-4 h-4" /></button>
          </div>
        </aside>

        {selected ? (
          <section className="brutal-card p-4 bg-white">
            <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
              <h3 className="font-display text-xl">Slide: {THEMES[selectedKey]?.meta.name}</h3>
              <button onClick={saveSlide} disabled={saving} className="brutal-btn bg-bioyellow px-4 py-2 font-bold text-sm gap-2 disabled:opacity-60">
                <Save className="w-4 h-4" /> {saving ? 'Salvando...' : dirty ? 'Salvar slide *' : 'Salvar slide'}
              </button>
            </div>
            <ShowcaseDemoEditor kind="landing" preset={selected} onPatch={patchSelected} onToast={flashToast}
              afterProfile={(
                <Field label="Tagline do slide (uso interno)" full>
                  <input type="text" value={selected.landing_tagline ?? ''} placeholder="Ex: Ideal para criadores"
                    onChange={e => patchSelected(() => ({ landing_tagline: e.target.value }))}
                    className="brutal-input py-2 px-3 text-sm w-full" />
                </Field>
              )}
            />
          </section>
        ) : (
          <section className="brutal-card p-6 bg-white text-sm">Adicione um tema ao carrossel para editar o slide.</section>
        )}

        {selected && <ShowcasePreview kind="landing" preset={selected} title="Como aparece no hero" />}
      </div>

      <div className="brutal-card p-4 bg-white">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h3 className="font-display text-xl">Animação do carrossel</h3>
            <p className="text-xs text-black/70">Velocidade, efeitos e interação dos celulares do hero.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCarouselCfg(DEFAULT_CAROUSEL_SETTINGS)} className="text-[11px] font-bold uppercase underline underline-offset-4 inline-flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Restaurar padrão
            </button>
            <button onClick={saveCfg} disabled={savingCfg} className="brutal-btn bg-bioyellow px-3 py-1.5 font-bold text-xs gap-2 disabled:opacity-60">
              <Save className="w-3 h-3" /> {savingCfg ? 'Salvando...' : 'Salvar animação'}
            </button>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <CfgSlider label="Tempo entre slides" unit="ms" min={1500} max={12000} step={250} value={carouselCfg.auto_advance_ms} onChange={v => setCarouselCfg(c => ({ ...c, auto_advance_ms: v }))} />
          <CfgSlider label="Duração da transição" unit="ms" min={150} max={2000} step={50} value={carouselCfg.transition_ms} onChange={v => setCarouselCfg(c => ({ ...c, transition_ms: v }))} />
          <CfgSlider label="Escala ativa" unit="" min={0.8} max={1.2} step={0.01} value={carouselCfg.scale_active} onChange={v => setCarouselCfg(c => ({ ...c, scale_active: v }))} />
          <CfgSlider label="Escala dos laterais" unit="" min={0.4} max={1.0} step={0.01} value={carouselCfg.scale_inactive} onChange={v => setCarouselCfg(c => ({ ...c, scale_inactive: v }))} />
          <CfgSlider label="Deslocamento horizontal" unit="%" min={0} max={60} step={1} value={carouselCfg.translate_percent} onChange={v => setCarouselCfg(c => ({ ...c, translate_percent: v }))} />
          <CfgSlider label="Opacidade dos laterais" unit="" min={0} max={1} step={0.05} value={carouselCfg.inactive_opacity} onChange={v => setCarouselCfg(c => ({ ...c, inactive_opacity: v }))} />
          <label className="text-xs font-bold flex items-center gap-2 brutal-border bg-[#FAFAFA] px-3 py-2">
            <input type="checkbox" checked={carouselCfg.drag_enabled} onChange={e => setCarouselCfg(c => ({ ...c, drag_enabled: e.target.checked }))} />
            Permitir arrastar (mouse/touch)
          </label>
          <label className="text-xs font-bold flex items-center gap-2 brutal-border bg-[#FAFAFA] px-3 py-2">
            <input type="checkbox" checked={carouselCfg.pause_on_hover} onChange={e => setCarouselCfg(c => ({ ...c, pause_on_hover: e.target.checked }))} />
            Pausar ao passar o mouse
          </label>
        </div>
      </div>

      <div className="brutal-card p-4 bg-white">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h3 className="font-display text-xl">Prova social</h3>
            <p className="text-xs text-black/70">Avatares e frase exibidos abaixo do botão do hero.</p>
          </div>
          <button onClick={saveSocialProof} disabled={savingSP} className="brutal-btn bg-bioyellow px-3 py-1.5 font-bold text-xs gap-2 disabled:opacity-60">
            <Save className="w-3 h-3" /> {savingSP ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
        <label className="block text-xs font-bold mb-1">Frase exibida</label>
        <input type="text" value={socialProof.text} onChange={e => setSocialProof(prev => ({ ...prev, text: e.target.value }))} className="brutal-input py-2 px-3 text-sm w-full max-w-lg mb-4" />
        <div className="text-xs font-bold mb-2">Avatares (até 4)</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map(idx => (
            <div key={idx} className="brutal-border bg-[#FAFAFA] p-3 flex flex-col gap-2">
              <div className="text-[10px] font-bold text-black/60">Avatar {idx + 1}</div>
              <MediaUploader kind="image" value={socialProof.avatars[idx] || ''} pathPrefix="social-proof/avatars" onUploaded={url => patchAvatar(idx, url)} onRemove={() => patchAvatar(idx, '')} />
              <input type="text" value={socialProof.avatars[idx] || ''} placeholder="Ou cole uma URL externa" onChange={e => patchAvatar(idx, e.target.value)} className="brutal-input py-1.5 px-2 text-xs w-full" />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs font-bold">
          <span className="text-black/60">Prévia:</span>
          <div className="flex -space-x-2">{socialProof.avatars.filter(Boolean).map((url, i) => <img key={i} src={url} alt="" className="w-8 h-8 rounded-full brutal-border object-cover" />)}</div>
          {socialProof.text}
        </div>
      </div>
    </div>
  );
}

function CfgSlider({ label, value, onChange, min, max, step, unit }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; unit: string;
}) {
  const display = step < 1 ? value.toFixed(2) : Math.round(value).toString();
  return (
    <label className="block brutal-border bg-[#FAFAFA] px-3 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
        <span className="text-[11px] font-bold text-black/70">{display}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full" />
    </label>
  );
}
