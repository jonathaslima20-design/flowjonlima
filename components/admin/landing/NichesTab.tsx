'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Save, Trash2 } from 'lucide-react';
import { THEMES } from '@/themes/registry';
import { ThemeMockup } from '@/components/themes/ThemeMockup';
import { DemoPageEditor, Field, type DemoPageValue } from '@/components/admin/DemoPageEditor';
import { supabase } from '@/lib/supabase';
import { EMPTY_DEMO, fetchLandingNiches, nicheDemoFor, nicheDemoValue, type LandingNiche } from '@/lib/landing-niches';

const MAX_BENEFITS = 4;

export function NichesTab() {
  const [niches, setNiches] = useState<LandingNiche[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    (async () => {
      const list = await fetchLandingNiches(true);
      setNiches(list);
      setSelectedId(list[0]?.id ?? null);
      setLoading(false);
    })();
  }, []);

  const selected = niches.find(n => n.id === selectedId) ?? null;

  function flashToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  }

  function patchSelected(patch: Partial<LandingNiche>) {
    setNiches(list => list.map(n => (n.id === selectedId ? { ...n, ...patch } : n)));
    setDirty(true);
  }

  function changeDemo(fn: (prev: DemoPageValue) => Partial<DemoPageValue>) {
    setNiches(list => list.map(n => {
      if (n.id !== selectedId) return n;
      const prev = nicheDemoValue(n);
      return { ...n, demo: { ...prev, ...fn(prev) } };
    }));
    setDirty(true);
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase.from('landing_niches').update({
      key: selected.key,
      label: selected.label,
      headline: selected.headline,
      description: selected.description,
      benefits: selected.benefits.map(b => b.trim()).filter(Boolean),
      theme_key: selected.theme_key,
      demo: selected.demo,
      is_active: selected.is_active,
      updated_at: new Date().toISOString(),
    }).eq('id', selected.id);
    setSaving(false);
    if (error) { flashToast('Erro: ' + error.message); return; }
    setDirty(false);
    flashToast('Nicho salvo');
  }

  async function addNiche() {
    const n = niches.length + 1;
    const { data, error } = await supabase.from('landing_niches').insert({
      key: `nicho-${Date.now().toString(36)}`,
      label: `Novo nicho ${n}`,
      headline: '',
      description: '',
      benefits: [],
      theme_key: 'cupertino',
      demo: EMPTY_DEMO,
      position: niches.length ? Math.max(...niches.map(x => x.position)) + 1 : 0,
      is_active: false,
    }).select('*').single();
    if (error || !data) { flashToast('Erro: ' + (error?.message ?? 'não foi possível criar')); return; }
    setNiches(list => [...list, data as unknown as LandingNiche]);
    setSelectedId((data as any).id);
    flashToast('Nicho criado (oculto até você ativar)');
  }

  async function removeNiche(n: LandingNiche) {
    if (!confirm(`Excluir o nicho "${n.label}"?`)) return;
    const { error } = await supabase.from('landing_niches').delete().eq('id', n.id);
    if (error) { flashToast('Erro: ' + error.message); return; }
    const rest = niches.filter(x => x.id !== n.id);
    setNiches(rest);
    if (selectedId === n.id) setSelectedId(rest[0]?.id ?? null);
  }

  async function toggleActive(n: LandingNiche) {
    const { error } = await supabase.from('landing_niches').update({ is_active: !n.is_active }).eq('id', n.id);
    if (error) { flashToast('Erro: ' + error.message); return; }
    setNiches(list => list.map(x => (x.id === n.id ? { ...x, is_active: !n.is_active } : x)));
  }

  async function move(n: LandingNiche, dir: -1 | 1) {
    const idx = niches.findIndex(x => x.id === n.id);
    const other = niches[idx + dir];
    if (!other) return;
    const next = [...niches];
    next[idx] = { ...other, position: n.position };
    next[idx + dir] = { ...n, position: other.position };
    setNiches(next);
    await Promise.all([
      supabase.from('landing_niches').update({ position: other.position }).eq('id', n.id),
      supabase.from('landing_niches').update({ position: n.position }).eq('id', other.id),
    ]);
  }

  function setBenefit(idx: number, v: string) {
    if (!selected) return;
    const list = [...selected.benefits];
    list[idx] = v;
    patchSelected({ benefits: list });
  }

  if (loading) return <div className="p-6 font-bold">Carregando nichos...</div>;

  const demo = selected ? nicheDemoFor(selected) : null;
  const themeKey = selected && THEMES[selected.theme_key] ? selected.theme_key : 'cupertino';

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl">Para quem é</h2>
          <p className="text-sm text-black/70 mt-1 max-w-2xl">
            Abas da seção &quot;Para quem é&quot; da página inicial: texto, benefícios e o celular com a página de exemplo de cada nicho.
          </p>
        </div>
        <button onClick={save} disabled={saving || !selected} className="brutal-btn bg-bioyellow px-4 py-2 font-bold text-sm gap-2 disabled:opacity-60">
          <Save className="w-4 h-4" /> {saving ? 'Salvando...' : dirty ? 'Salvar nicho *' : 'Salvar nicho'}
        </button>
      </div>

      {toast && <div className="mb-4 inline-block brutal-card px-4 py-2 bg-biolime font-bold">{toast}</div>}

      <div className="grid lg:grid-cols-[260px_1fr_360px] gap-4">
        <aside className="brutal-card p-4 bg-white self-start">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg">Nichos</h2>
            <button onClick={addNiche} className="brutal-btn bg-white px-2 py-1 text-[11px] gap-1"><Plus className="w-3 h-3" /> Novo</button>
          </div>
          <div className="flex flex-col gap-2">
            {niches.map((n, i) => (
              <div key={n.id} className={`brutal-border p-2 flex items-center gap-1 ${n.id === selectedId ? 'bg-bioyellow' : 'bg-white'}`}>
                <button onClick={() => setSelectedId(n.id)} className="flex-1 text-left text-sm font-bold truncate">
                  {n.label}{!n.is_active && <span className="ml-1 text-[10px] font-normal text-black/50">(oculto)</span>}
                </button>
                <button onClick={() => move(n, -1)} disabled={i === 0} aria-label="Subir" className="p-1 disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                <button onClick={() => move(n, 1)} disabled={i === niches.length - 1} aria-label="Descer" className="p-1 disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                <button onClick={() => toggleActive(n)} aria-label={n.is_active ? 'Ocultar' : 'Mostrar'} className="p-1">
                  {n.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => removeNiche(n)} aria-label="Excluir" className="p-1 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            {niches.length === 0 && <p className="text-xs text-black/60">Nenhum nicho. A seção some da landing.</p>}
          </div>
        </aside>

        {selected && (
          <section className="brutal-card p-4 bg-white">
            <h3 className="font-display text-base mb-2">Texto da aba</h3>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <Field label="Nome da aba">
                <input value={selected.label} maxLength={40} onChange={e => patchSelected({ label: e.target.value })} className="brutal-input py-2 px-3 text-sm w-full" />
              </Field>
              <Field label="Tema do celular">
                <select value={selected.theme_key} onChange={e => patchSelected({ theme_key: e.target.value, demo: { ...nicheDemoValue(selected), theme_core: {}, theme_settings: {} } })} className="brutal-input py-2 px-3 text-sm w-full bg-white">
                  {Object.values(THEMES).map(t => <option key={t.meta.key} value={t.meta.key}>{t.meta.name}</option>)}
                </select>
              </Field>
              <Field label="Título" full>
                <input value={selected.headline} maxLength={120} onChange={e => patchSelected({ headline: e.target.value })} className="brutal-input py-2 px-3 text-sm w-full" />
              </Field>
              <Field label="Descrição" full>
                <textarea value={selected.description} maxLength={400} rows={3} onChange={e => patchSelected({ description: e.target.value })} className="brutal-input py-2 px-3 text-sm w-full font-normal resize-y" />
              </Field>
            </div>

            <h3 className="font-display text-base mb-2">Benefícios (até {MAX_BENEFITS})</h3>
            <div className="flex flex-col gap-2 mb-5">
              {selected.benefits.map((b, i) => (
                <div key={i} className="flex gap-2">
                  <input value={b} maxLength={90} onChange={e => setBenefit(i, e.target.value)} className="brutal-input py-1.5 px-2 text-xs flex-1" />
                  <button onClick={() => patchSelected({ benefits: selected.benefits.filter((_, j) => j !== i) })} aria-label="Remover benefício" className="w-8 h-8 brutal-border bg-white hover:bg-red-100 flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {selected.benefits.length < MAX_BENEFITS && (
                <button onClick={() => patchSelected({ benefits: [...selected.benefits, ''] })} className="brutal-btn bg-white px-2 py-1 text-[11px] gap-1 self-start">
                  <Plus className="w-3 h-3" /> Adicionar benefício
                </button>
              )}
            </div>

            <DemoPageEditor
              themeKey={themeKey}
              value={nicheDemoValue(selected)}
              onChange={changeDemo}
              pathBase={`niches/${selected.key}`}
              onToast={flashToast}
            />
          </section>
        )}

        {selected && demo && (
          <aside className="lg:sticky lg:top-4 self-start brutal-card p-4 bg-[#F7F7F5]">
            <h3 className="font-display text-base mb-3">Preview</h3>
            <div className="flex items-center justify-center">
              <ThemeMockup
                themeKey={themeKey}
                overrides={demo.profile as any}
                links={demo.links}
                socials={demo.socials}
                videos={demo.videos}
                banners={demo.banners}
                themeSettings={demo.themeSettings}
              />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
