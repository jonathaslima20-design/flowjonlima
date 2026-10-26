'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { THEMES } from '@/themes/registry';
import { Eye, EyeOff, Lock, Clock as Unlock, RefreshCw, ChartBar as BarChart2, GripVertical, Save, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ShowcaseDemoEditor, ShowcasePreview } from '@/components/admin/ShowcaseDemoEditor';
import { emptyPreset, fetchAllShowcasePresets, upsertShowcasePreset, type ShowcasePreset } from '@/lib/theme-showcase';

interface ThemeRow {
  key: string;
  name: string;
  description: string;
  userCount: number;
  disabled: boolean;
  proOnly: boolean;
  catalogOrder: number;
}

// Temas do catálogo (tela Aparência do usuário): ativação, plano, ordem e demonstração de cada tema.
// O que aparece na landing fica em Admin → Landing page.
export default function AdminThemesPage() {
  const [themes, setThemes] = useState<ThemeRow[]>([]);
  const [presets, setPresets] = useState<Record<string, ShowcasePreset>>({});
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [savingDemo, setSavingDemo] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [adminId, setAdminId] = useState<string>('');
  const [viewChart, setViewChart] = useState(false);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const draggingKey = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setAdminId(data.user.id);
    });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [{ data: settingsRows }, { data: counts }, all] = await Promise.all([
      supabase.from('admin_settings').select('key, value').in('key', ['disabled_themes', 'pro_only_themes']),
      supabase.rpc('theme_usage_counts'),
      fetchAllShowcasePresets(),
    ]);

    const disabledThemes = (settingsRows?.find(r => r.key === 'disabled_themes')?.value as string[] | undefined) ?? [];
    const proOnlyThemes = (settingsRows?.find(r => r.key === 'pro_only_themes')?.value as string[] | undefined) ?? [];

    const themeCounts: Record<string, number> = {};
    (counts ?? []).forEach((r: any) => {
      themeCounts[r.theme] = Number(r.count);
    });

    const map: Record<string, ShowcasePreset> = {};
    for (const p of all) map[p.theme_key] = { ...emptyPreset(p.theme_key), ...p };
    for (const key of Object.keys(THEMES)) if (!map[key]) map[key] = { ...emptyPreset(key), catalog_order: 999 };

    const rows: ThemeRow[] = Object.values(THEMES).map(({ meta }) => ({
      key: meta.key,
      name: meta.name,
      description: meta.description,
      userCount: themeCounts[meta.key] ?? 0,
      disabled: disabledThemes.includes(meta.key),
      proOnly: proOnlyThemes.includes(meta.key),
      catalogOrder: all.find(p => p.theme_key === meta.key)?.catalog_order ?? 999,
    }));

    const sorted = rows.sort((a, b) => a.catalogOrder - b.catalogOrder);
    setThemes(sorted);
    setPresets(map);
    setSelectedKey(k => k || sorted[0]?.key || '');
    setDirty(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function flashToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  }

  async function updateSetting(key: 'disabled_themes' | 'pro_only_themes', newList: string[]) {
    await supabase
      .from('admin_settings')
      .upsert({ key, value: newList, updated_at: new Date().toISOString() });
  }

  async function logAction(action: string, themeKey: string) {
    await supabase.from('admin_audit_log').insert({
      admin_id: adminId,
      action,
      target_type: 'theme',
      target_id: themeKey,
    });
  }

  async function toggleDisabled(theme: ThemeRow) {
    setSaving(theme.key + '_disabled');
    const currentDisabled = themes.filter(t => t.disabled).map(t => t.key);
    const newList = theme.disabled
      ? currentDisabled.filter(k => k !== theme.key)
      : [...currentDisabled, theme.key];
    await updateSetting('disabled_themes', newList);
    await logAction(theme.disabled ? 'enable_theme' : 'disable_theme', theme.key);
    setThemes(prev => prev.map(t => t.key === theme.key ? { ...t, disabled: !t.disabled } : t));
    setSaving(null);
  }

  async function toggleProOnly(theme: ThemeRow) {
    setSaving(theme.key + '_pro');
    const currentProOnly = themes.filter(t => t.proOnly).map(t => t.key);
    const newList = theme.proOnly
      ? currentProOnly.filter(k => k !== theme.key)
      : [...currentProOnly, theme.key];
    await updateSetting('pro_only_themes', newList);
    await logAction(theme.proOnly ? 'remove_pro_only_theme' : 'set_pro_only_theme', theme.key);
    setThemes(prev => prev.map(t => t.key === theme.key ? { ...t, proOnly: !t.proOnly } : t));
    setSaving(null);
  }

  async function persistOrder(ordered: ThemeRow[]) {
    await Promise.all(
      ordered.map((t, i) =>
        supabase
          .from('theme_showcase_presets')
          .upsert({ theme_key: t.key, catalog_order: i }, { onConflict: 'theme_key' })
      )
    );
  }

  function onDragStart(key: string) {
    draggingKey.current = key;
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function onDrop(targetKey: string) {
    const fromKey = draggingKey.current;
    draggingKey.current = null;
    if (!fromKey || fromKey === targetKey) return;

    setThemes(prev => {
      const from = prev.findIndex(t => t.key === fromKey);
      const to = prev.findIndex(t => t.key === targetKey);
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      const reindexed = next.map((t, i) => ({ ...t, catalogOrder: i }));
      persistOrder(reindexed);
      return reindexed;
    });
  }

  const selected = presets[selectedKey];

  function patchSelected(fn: (prev: ShowcasePreset) => Partial<ShowcasePreset>) {
    setPresets(prev => {
      const base = prev[selectedKey] || emptyPreset(selectedKey);
      return { ...prev, [selectedKey]: { ...base, ...fn(base) } };
    });
    setDirty(true);
  }

  async function saveDemo() {
    if (!selected) return;
    setSavingDemo(true);
    const order = themes.find(t => t.key === selectedKey)?.catalogOrder ?? selected.catalog_order;
    const { error } = await upsertShowcasePreset({ ...selected, catalog_order: order });
    setSavingDemo(false);
    if (error) { flashToast('Erro ao salvar: ' + error.message); return; }
    setDirty(false);
    flashToast('Demonstração do catálogo salva');
  }

  function selectTheme(key: string) {
    if (dirty && !confirm('Há alterações não salvas na demonstração atual. Trocar de tema mesmo assim?')) return;
    setSelectedKey(key);
    setDirty(false);
  }

  const totalUsers = themes.reduce((s, t) => s + t.userCount, 0);
  const q = query.trim().toLowerCase();
  const visible = q ? themes.filter(t => t.name.toLowerCase().includes(q) || t.key.includes(q)) : themes;

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl mb-1">Temas</h1>
          <p className="text-gray-500 text-sm max-w-2xl">
            Catálogo que os usuários veem em Aparência: ative ou desative, defina os temas Pro, arraste para reordenar e edite a demonstração de cada tema. O que aparece na página inicial fica em Landing page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewChart(v => !v)} className={`brutal-btn px-3 py-2 text-sm gap-2 ${viewChart ? 'bg-bioyellow' : 'bg-white'}`}>
            <BarChart2 className="w-4 h-4" />
            {viewChart ? 'Ocultar uso' : 'Ver uso'}
          </button>
          <button onClick={fetchData} className="brutal-btn px-3 py-2 bg-white text-sm" aria-label="Recarregar">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {toast && <div className="mb-4 inline-block brutal-card px-4 py-2 bg-biolime font-bold">{toast}</div>}

      {viewChart && !loading && (
        <div className="brutal-card p-5 mb-5">
          <h2 className="font-display text-lg mb-4">Distribuição de uso</h2>
          <ResponsiveContainer width="100%" height={Math.max(280, themes.length * 18)}>
            <BarChart data={themes} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
              <Tooltip formatter={(v) => [`${v} usuários`, 'Usuários']} />
              <Bar dataKey="userCount" fill="#FACC15" stroke="#000" strokeWidth={1.5} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {loading ? (
        <div className="brutal-card p-12 text-center font-bold text-gray-400 animate-pulse">Carregando...</div>
      ) : (
        <div className="grid lg:grid-cols-[360px_1fr_320px] gap-4 items-start">
          <aside className="brutal-card p-3 bg-white">
            <div className="flex items-center gap-2 brutal-border px-2 mb-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder={`Buscar entre ${themes.length} temas`} className="flex-1 py-2 text-sm outline-none" />
            </div>
            <p className="text-[11px] text-gray-500 mb-2 flex items-center gap-1"><GripVertical className="w-3 h-3" /> Arraste para mudar a ordem do catálogo</p>
            <div className="flex flex-col gap-1.5 max-h-[75vh] overflow-y-auto pr-1">
              {visible.map(theme => {
                const pct = totalUsers > 0 ? (theme.userCount / totalUsers) * 100 : 0;
                const active = theme.key === selectedKey;
                return (
                  <div
                    key={theme.key}
                    draggable={!q}
                    onDragStart={() => onDragStart(theme.key)}
                    onDragOver={onDragOver}
                    onDrop={() => onDrop(theme.key)}
                    className={`brutal-border p-2 flex items-center gap-2 ${active ? 'bg-bioyellow' : 'bg-white hover:bg-black/5'} ${theme.disabled ? 'opacity-60' : ''}`}
                  >
                    <GripVertical className={`w-4 h-4 shrink-0 text-gray-400 ${q ? 'opacity-30' : 'cursor-grab'}`} />
                    <span className="w-6 h-6 shrink-0 brutal-border" style={{ background: THEMES[theme.key]?.meta.defaults.bg_color ?? '#fff' }} />
                    <button onClick={() => selectTheme(theme.key)} className="flex-1 min-w-0 text-left">
                      <span className="block text-sm font-bold truncate">{theme.name}</span>
                      <span className="flex items-center gap-1.5 mt-0.5">
                        <span className="flex-1 h-1 bg-gray-100 overflow-hidden"><span className="block h-full bg-black" style={{ width: `${pct}%` }} /></span>
                        <span className="text-[10px] text-gray-500 font-bold">{theme.userCount}</span>
                      </span>
                    </button>
                    <button
                      onClick={() => toggleProOnly(theme)}
                      disabled={saving === theme.key + '_pro'}
                      title={theme.proOnly ? 'Somente Pro (clique para liberar a todos)' : 'Todos os planos (clique para restringir ao Pro)'}
                      className={`w-8 h-8 brutal-border flex items-center justify-center shrink-0 ${theme.proOnly ? 'bg-bioyellow' : 'bg-white'}`}
                    >
                      {theme.proOnly ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => toggleDisabled(theme)}
                      disabled={saving === theme.key + '_disabled'}
                      title={theme.disabled ? 'Desativado (clique para ativar)' : 'Ativo (clique para desativar)'}
                      className={`w-8 h-8 brutal-border flex items-center justify-center shrink-0 ${theme.disabled ? 'bg-red-100' : 'bg-white'}`}
                    >
                      {theme.disabled ? <EyeOff className="w-3.5 h-3.5 text-red-600" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </aside>

          {selected && (
            <section className="brutal-card p-4 bg-white">
              <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                <div>
                  <h2 className="font-display text-xl">{THEMES[selectedKey]?.meta.name}</h2>
                  <p className="text-xs text-gray-500 max-w-md">{THEMES[selectedKey]?.meta.description}</p>
                </div>
                <button onClick={saveDemo} disabled={savingDemo} className="brutal-btn bg-bioyellow px-4 py-2 font-bold text-sm gap-2 disabled:opacity-60">
                  <Save className="w-4 h-4" /> {savingDemo ? 'Salvando...' : dirty ? 'Salvar demonstração *' : 'Salvar demonstração'}
                </button>
              </div>
              <label className="flex items-center gap-2 text-xs font-bold brutal-border bg-[#FAFAFA] px-3 py-2 mb-2">
                <input type="checkbox" checked={!!selected.show_in_catalog} onChange={e => patchSelected(() => ({ show_in_catalog: e.target.checked }))} />
                Usar esta demonstração no catálogo (desmarcado: perfil de exemplo padrão)
              </label>
              <ShowcaseDemoEditor kind="catalog" preset={selected} onPatch={patchSelected} onToast={flashToast} />
            </section>
          )}

          {selected && <ShowcasePreview kind="catalog" preset={selected} title="Como aparece em Aparência" />}
        </div>
      )}
    </div>
  );
}
