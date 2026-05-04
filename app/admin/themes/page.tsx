'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { THEMES } from '@/themes/registry';
import { Eye, EyeOff, Lock, Clock as Unlock, RefreshCw, ChartBar as BarChart2, GripVertical } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ThemeRow {
  key: string;
  name: string;
  description: string;
  userCount: number;
  disabled: boolean;
  proOnly: boolean;
  catalogOrder: number;
}

export default function AdminThemesPage() {
  const [themes, setThemes] = useState<ThemeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [adminId, setAdminId] = useState<string>('');
  const [viewChart, setViewChart] = useState(false);
  const draggingKey = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setAdminId(data.user.id);
    });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [{ data: settingsRows }, { data: counts }, { data: presets }] = await Promise.all([
      supabase.from('admin_settings').select('key, value').in('key', ['disabled_themes', 'pro_only_themes']),
      supabase.rpc('theme_usage_counts'),
      supabase.from('theme_showcase_presets').select('theme_key, catalog_order').order('catalog_order', { ascending: true }),
    ]);

    const disabledThemes: string[] = settingsRows?.find(r => r.key === 'disabled_themes')?.value ?? [];
    const proOnlyThemes: string[] = settingsRows?.find(r => r.key === 'pro_only_themes')?.value ?? [];

    const themeCounts: Record<string, number> = {};
    (counts ?? []).forEach((r: any) => {
      themeCounts[r.theme] = Number(r.count);
    });

    const orderMap: Record<string, number> = {};
    (presets ?? []).forEach((r: any) => {
      orderMap[r.theme_key] = r.catalog_order;
    });

    const rows: ThemeRow[] = Object.values(THEMES).map(({ meta }) => ({
      key: meta.key,
      name: meta.name,
      description: meta.description,
      userCount: themeCounts[meta.key] ?? 0,
      disabled: disabledThemes.includes(meta.key),
      proOnly: proOnlyThemes.includes(meta.key),
      catalogOrder: orderMap[meta.key] ?? 999,
    }));

    setThemes(rows.sort((a, b) => a.catalogOrder - b.catalogOrder));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const totalUsers = themes.reduce((s, t) => s + t.userCount, 0);

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl mb-1">Gestão de Temas</h1>
          <p className="text-gray-500 text-sm">{themes.length} temas · arraste para reordenar o catálogo</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewChart(v => !v)}
            className={`brutal-btn px-3 py-2 text-sm gap-2 ${viewChart ? 'bg-bioyellow' : 'bg-white'}`}
          >
            <BarChart2 className="w-4 h-4" />
            {viewChart ? 'Ver lista' : 'Ver gráfico'}
          </button>
          <button onClick={fetchData} className="brutal-btn px-3 py-2 bg-white text-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 text-xs font-bold text-gray-500">
        <div className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-green-500" /> Ativo (visível a todos)</div>
        <div className="flex items-center gap-1.5"><EyeOff className="w-3.5 h-3.5 text-red-400" /> Desativado (ninguém pode selecionar)</div>
        <div className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-yellow-500" /> Somente Pro</div>
        <div className="flex items-center gap-1.5"><Unlock className="w-3.5 h-3.5 text-gray-400" /> Todos os planos</div>
        <div className="flex items-center gap-1.5"><GripVertical className="w-3.5 h-3.5 text-gray-400" /> Arraste para reordenar</div>
      </div>

      {/* Chart view */}
      {viewChart && !loading && (
        <div className="brutal-card p-5 mb-6">
          <h2 className="font-display text-lg mb-4">Distribuição de uso</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={themes} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={(v) => [`${v} usuários`, 'Usuários']} />
              <Bar dataKey="userCount" fill="#FACC15" stroke="#000" strokeWidth={1.5} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Theme list */}
      {loading ? (
        <div className="brutal-card p-12 text-center font-bold text-gray-400 animate-pulse">Carregando...</div>
      ) : (
        <div className="grid gap-3">
          {themes.map(theme => {
            const pct = totalUsers > 0 ? (theme.userCount / totalUsers) * 100 : 0;
            return (
              <div
                key={theme.key}
                draggable
                onDragStart={() => onDragStart(theme.key)}
                onDragOver={onDragOver}
                onDrop={() => onDrop(theme.key)}
                className={`brutal-card p-4 transition-all cursor-default ${theme.disabled ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Drag handle */}
                  <div className="cursor-grab mt-1 text-gray-400 hover:text-gray-600 shrink-0">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Color swatch from theme defaults */}
                  <div
                    className="w-10 h-10 shrink-0 brutal-border"
                    style={{ background: THEMES[theme.key]?.meta.defaults.bg_color ?? '#fff' }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-display text-lg leading-tight">{theme.name}</span>
                      {theme.disabled && (
                        <span className="text-[10px] bg-red-100 text-red-700 border border-red-300 px-1.5 py-0.5 font-bold">DESATIVADO</span>
                      )}
                      {theme.proOnly && (
                        <span className="text-[10px] bg-bioyellow text-black brutal-border px-1.5 py-0.5 font-bold">SOMENTE PRO</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-2 leading-relaxed">{theme.description}</p>

                    {/* Usage bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 border border-gray-200 overflow-hidden">
                        <div
                          className="h-full bg-black transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 font-bold w-16 text-right">
                        {theme.userCount} {theme.userCount === 1 ? 'usuário' : 'usuários'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleProOnly(theme)}
                      disabled={saving === theme.key + '_pro'}
                      title={theme.proOnly ? 'Tornar disponível a todos' : 'Restringir ao plano Pro'}
                      className={`brutal-btn px-3 py-2 text-xs gap-1.5 transition-all ${theme.proOnly ? 'bg-bioyellow' : 'bg-white'}`}
                    >
                      {theme.proOnly ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{theme.proOnly ? 'Pro' : 'Todos'}</span>
                    </button>
                    <button
                      onClick={() => toggleDisabled(theme)}
                      disabled={saving === theme.key + '_disabled'}
                      title={theme.disabled ? 'Ativar tema' : 'Desativar tema'}
                      className={`brutal-btn px-3 py-2 text-xs gap-1.5 transition-all ${theme.disabled ? 'bg-red-100 border-red-400' : 'bg-white'}`}
                    >
                      {theme.disabled ? <Eye className="w-3.5 h-3.5 text-red-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{theme.disabled ? 'Ativar' : 'Desativar'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
