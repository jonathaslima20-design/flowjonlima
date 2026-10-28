'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { THEMES } from '@/themes/registry';
import { fetchAllShowcasePresets, hasLandingDemo, type ShowcasePreset } from '@/lib/theme-showcase';

// Seção "Galeria de temas" da landing: automática (todos os temas ativos na ordem do catálogo)
// ou com seleção e ordem manuais, guardadas em admin_settings.landing_gallery
export function GalleryTab() {
  const [manual, setManual] = useState(false);
  const [selection, setSelection] = useState<string[]>([]);
  const [presets, setPresets] = useState<Record<string, ShowcasePreset>>({});
  const [disabled, setDisabled] = useState<string[]>([]);
  const [adding, setAdding] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    (async () => {
      const [{ data: settings }, all] = await Promise.all([
        supabase.from('admin_settings').select('key, value').in('key', ['landing_gallery', 'disabled_themes']),
        fetchAllShowcasePresets(),
      ]);
      const gallery = settings?.find(r => r.key === 'landing_gallery')?.value as string[] | undefined;
      const list = Array.isArray(gallery) ? gallery.filter(k => THEMES[k]) : [];
      setManual(list.length > 0);
      setSelection(list);
      setDisabled((settings?.find(r => r.key === 'disabled_themes')?.value as string[] | undefined) ?? []);
      setPresets(Object.fromEntries(all.map(p => [p.theme_key, p])));
      setLoading(false);
    })();
  }, []);

  function flashToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  }

  function startManual() {
    // Começa da ordem atual do catálogo, para o admin só ajustar
    const ordered = [
      ...Object.values(presets).sort((a, b) => a.catalog_order - b.catalog_order).map(p => p.theme_key),
      ...Object.keys(THEMES),
    ].filter((k, i, arr) => THEMES[k] && !disabled.includes(k) && arr.indexOf(k) === i);
    setSelection(ordered.slice(0, 8));
    setManual(true);
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= selection.length) return;
    const next = [...selection];
    [next[i], next[j]] = [next[j], next[i]];
    setSelection(next);
  }

  async function save() {
    setSaving(true);
    const value = manual ? selection : [];
    const { error } = await supabase.from('admin_settings').upsert({ key: 'landing_gallery', value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    setSaving(false);
    flashToast(error ? 'Erro ao salvar: ' + error.message : 'Galeria salva.');
  }

  if (loading) return <div className="font-bold">Carregando galeria...</div>;

  const available = Object.values(THEMES).filter(({ meta }) => !selection.includes(meta.key) && !disabled.includes(meta.key));

  return (
    <div className="max-w-3xl flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl">Galeria de temas</h2>
          <p className="text-sm text-black/70 max-w-xl">
            A seção “Uma página com a cara da sua marca”. Cada tema usa a demonstração da landing (aba Hero) quando existir; senão, a do catálogo.
          </p>
        </div>
        <button onClick={save} disabled={saving} className="brutal-btn bg-bioyellow px-4 py-2 font-bold text-sm gap-2 disabled:opacity-60">
          <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar galeria'}
        </button>
      </div>
      {toast && <div className="inline-block self-start brutal-card px-4 py-2 bg-biolime font-bold">{toast}</div>}

      <div className="brutal-card p-4 bg-white flex flex-col gap-2">
        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <input type="radio" checked={!manual} onChange={() => setManual(false)} className="mt-1" />
          <span><b>Automática</b><br /><span className="text-xs text-black/60">Todos os temas ativos, na ordem do catálogo (Admin → Temas). A seção mostra 8 e um botão “ver todos”.</span></span>
        </label>
        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <input type="radio" checked={manual} onChange={() => (manual ? null : startManual())} className="mt-1" />
          <span><b>Escolher manualmente</b><br /><span className="text-xs text-black/60">Só os temas abaixo, na ordem definida aqui.</span></span>
        </label>
      </div>

      {manual && (
        <div className="brutal-card p-4 bg-white">
          <h3 className="font-display text-lg mb-2">Temas na galeria ({selection.length})</h3>
          <div className="flex flex-col gap-1.5">
            {selection.map((k, i) => (
              <div key={k} className="brutal-border flex items-center gap-2 px-2 py-1.5">
                <span className="text-[10px] font-bold w-5 text-black/50">{i + 1}</span>
                <span className="w-5 h-5 brutal-border shrink-0" style={{ background: THEMES[k]?.meta.defaults.bg_color }} />
                <span className="flex-1 text-sm font-bold truncate">{THEMES[k]?.meta.name}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 ${hasLandingDemo(presets[k]) ? 'bg-biolime' : 'bg-neutral-100 text-black/60'}`}>
                  {hasLandingDemo(presets[k]) ? 'demo da landing' : 'demo do catálogo'}
                </span>
                <button onClick={() => move(i, -1)} disabled={i === 0} className="w-6 h-6 flex items-center justify-center disabled:opacity-30" aria-label="Subir"><ArrowUp className="w-3 h-3" /></button>
                <button onClick={() => move(i, 1)} disabled={i === selection.length - 1} className="w-6 h-6 flex items-center justify-center disabled:opacity-30" aria-label="Descer"><ArrowDown className="w-3 h-3" /></button>
                <button onClick={() => setSelection(selection.filter(x => x !== k))} className="w-6 h-6 flex items-center justify-center hover:text-red-600" aria-label="Remover"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
            {selection.length === 0 && <p className="text-xs text-black/60">Nenhum tema escolhido: ao salvar, a galeria volta a ser automática.</p>}
          </div>
          <div className="mt-3 flex gap-2">
            <select value={adding} onChange={e => setAdding(e.target.value)} className="brutal-input py-1.5 px-2 text-xs bg-white flex-1">
              <option value="">Adicionar tema…</option>
              {available.map(({ meta }) => <option key={meta.key} value={meta.key}>{meta.name}</option>)}
            </select>
            <button onClick={() => { if (adding) { setSelection([...selection, adding]); setAdding(''); } }} disabled={!adding} className="brutal-btn bg-white px-3 text-xs gap-1 disabled:opacity-50">
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
