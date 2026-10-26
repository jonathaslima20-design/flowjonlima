'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePageId } from '@/lib/page-context';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { Download, Lock } from 'lucide-react';
import { usePlan } from '@/hooks/use-plan';
import { useUpgradeModal } from '@/components/dashboard/UpgradeModal';

type Breakdown = { name: string; count: number };
type Summary = {
  days: number;
  views: number;
  clicks: number;
  series: { day: string; views: number; clicks: number }[];
  sources: Breakdown[];
  devices: Breakdown[];
  countries: Breakdown[];
};

const PERIODS = [7, 30, 90, 365];

const DEVICE_LABELS: Record<string, string> = { mobile: 'Celular', tablet: 'Tablet', desktop: 'Computador' };
const SOURCE_LABELS: Record<string, string> = {
  direto: 'Direto / desconhecido', instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok',
  youtube: 'YouTube', x: 'X (Twitter)', linkedin: 'LinkedIn', threads: 'Threads', whatsapp: 'WhatsApp',
  telegram: 'Telegram', pinterest: 'Pinterest', google: 'Google', bing: 'Bing',
};

export default function AnalyticsPage() {
  const pageId = usePageId();
  const { plan, loading } = usePlan();
  const { open: openUpgrade } = useUpgradeModal();
  const [days, setDays] = useState(7);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [topLinks, setTopLinks] = useState<{ title: string | null; clicks: number | null }[]>([]);

  const maxDays = plan.limits.analytics_days;
  const advanced = plan.limits.analytics === 'advanced';
  // Exportação acompanha o histórico de 1 ano (Business)
  const canExport = maxDays >= 365;

  // Abre em 30 dias para quem tem histórico maior; o Free fica nos 7 dias do plano
  useEffect(() => {
    if (!loading) setDays(Math.min(30, maxDays));
  }, [loading, maxDays]);

  useEffect(() => {
    if (loading) return;
    (async () => {
      const { data } = await supabase.rpc('profile_analytics', { p_days: days, p_profile_id: pageId });
      setSummary(data as unknown as Summary);
      const { data: links } = await supabase.from('links').select('title, clicks').eq('profile_id', pageId).order('clicks', { ascending: false }).limit(5);
      setTopLinks(links ?? []);
    })();
  }, [days, loading, pageId]);

  const ctr = summary && summary.views > 0 ? Math.round((summary.clicks / summary.views) * 1000) / 10 : 0;
  const series = (summary?.series ?? []).map(p => ({ ...p, day: p.day.slice(8, 10) + '/' + p.day.slice(5, 7) }));

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="font-display text-4xl">Analytics</h1>
        <div className="flex items-center gap-2 flex-wrap">
        {canExport && summary && (
          <button onClick={() => exportCsv(summary)} className="brutal-btn bg-white px-3 py-2 text-xs gap-1">
            <Download className="w-3 h-3" /> Exportar CSV
          </button>
        )}
        <div className="inline-flex brutal-border bg-white p-1 gap-1">
          {PERIODS.map(p => {
            const locked = p > maxDays;
            return (
              <button
                key={p}
                onClick={() => (locked ? openUpgrade() : setDays(p))}
                className={`px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1 ${days === p ? 'bg-black text-white' : 'bg-white text-black'} ${locked ? 'opacity-50' : ''}`}
              >
                {locked && <Lock className="w-3 h-3" />} {p === 365 ? '1 ano' : `${p} dias`}
              </button>
            );
          })}
        </div>
        </div>
      </div>

      {!loading && maxDays < 30 && (
        <div className="brutal-card p-4 mb-6 bg-bioyellow flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-sm font-bold">
              No plano {plan.name} você vê os últimos {maxDays} dias. No Pro: 90 dias de histórico, origem das visitas, dispositivos e países.
            </p>
          </div>
          <button onClick={openUpgrade} className="brutal-btn bg-black text-white px-4 py-2 text-xs shrink-0">Ver planos</button>
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Kpi label="Visitas" value={summary?.views ?? 0} bg="bg-bioyellow" />
        <Kpi label="Cliques" value={summary?.clicks ?? 0} bg="bg-biolime" />
        <Kpi label="Taxa de cliques" value={`${ctr.toLocaleString('pt-BR')}%`} bg="bg-white" hint="cliques ÷ visitas" />
      </div>

      <div className="brutal-card p-6 mb-6">
        <h2 className="font-display text-xl mb-4">Visitas e cliques ({summary?.days ?? days} dias)</h2>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={series}>
              <CartesianGrid stroke="#000" strokeDasharray="0" vertical={false} />
              <XAxis dataKey="day" stroke="#000" />
              <YAxis stroke="#000" allowDecimals={false} />
              <Tooltip contentStyle={{ border: '2px solid #000', borderRadius: 0 }} />
              <Legend />
              <Line dataKey="views" name="Visitas" stroke="#2563EB" strokeWidth={3} dot={false} />
              <Line dataKey="clicks" name="Cliques" stroke="#000" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <BreakdownCard title="Origem das visitas" items={summary?.sources ?? []} labels={SOURCE_LABELS} locked={!advanced} onUpgrade={openUpgrade} />
        <BreakdownCard title="Dispositivos" items={summary?.devices ?? []} labels={DEVICE_LABELS} locked={!advanced} onUpgrade={openUpgrade} />
        <BreakdownCard
          title="Países"
          items={(summary?.countries ?? []).map(c => ({ ...c, name: c.name === '??' ? 'Desconhecido' : c.name }))}
          locked={!advanced}
          onUpgrade={openUpgrade}
        />
      </div>

      <div className="brutal-card p-6">
        <h2 className="font-display text-xl mb-4">Top links</h2>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={topLinks}>
              <CartesianGrid stroke="#000" strokeDasharray="0" vertical={false} />
              <XAxis dataKey="title" stroke="#000" />
              <YAxis stroke="#000" allowDecimals={false} />
              <Tooltip contentStyle={{ border: '2px solid #000', borderRadius: 0 }} />
              <Bar dataKey="clicks" name="Cliques" fill="#BEF264" stroke="#000" strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, bg, hint }: { label: string; value: number | string; bg: string; hint?: string }) {
  return (
    <div className={`brutal-card p-4 ${bg}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</div>
      <div className="font-display text-3xl mt-1">{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}</div>
      {hint && <div className="text-[11px] text-black/60">{hint}</div>}
    </div>
  );
}

function BreakdownCard({
  title, items, labels, locked, onUpgrade,
}: {
  title: string; items: Breakdown[]; labels?: Record<string, string>; locked: boolean; onUpgrade: () => void;
}) {
  const total = items.reduce((s, i) => s + i.count, 0);
  return (
    <div className="brutal-card p-5 relative overflow-hidden">
      <h2 className="font-display text-lg mb-3">{title}</h2>
      <div className={locked ? 'blur-sm select-none pointer-events-none' : ''}>
        {items.length === 0 ? (
          <p className="text-sm text-black/50">Ainda sem visitas no período.</p>
        ) : (
          <ul className="space-y-2">
            {items.map(i => (
              <li key={i.name}>
                <div className="flex justify-between text-xs font-bold mb-0.5">
                  <span>{labels?.[i.name] ?? i.name}</span>
                  <span>{i.count} · {total ? Math.round((i.count / total) * 100) : 0}%</span>
                </div>
                <div className="h-2 bg-black/10">
                  <div className="h-2 bg-bioblue" style={{ width: `${total ? (i.count / total) * 100 : 0}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {locked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/60">
          <Lock className="w-5 h-5" />
          <button onClick={onUpgrade} className="brutal-btn bg-black text-white px-3 py-1.5 text-xs">Disponível no Pro</button>
        </div>
      )}
    </div>
  );
}

function csvCell(value: string | number) {
  const v = String(value);
  return /[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

// Planilha com a série diária e as quebras por origem, dispositivo e país do período escolhido
function exportCsv(summary: Summary) {
  const rows: (string | number)[][] = [['Dia', 'Visitas', 'Cliques']];
  for (const p of summary.series ?? []) rows.push([p.day, p.views, p.clicks]);
  const sections: [string, Breakdown[], (n: string) => string][] = [
    ['Origem', summary.sources, n => SOURCE_LABELS[n] ?? n],
    ['Dispositivo', summary.devices, n => DEVICE_LABELS[n] ?? n],
    ['País', summary.countries, n => n],
  ];
  for (const [title, list, label] of sections) {
    rows.push([], [title, 'Visitas']);
    for (const b of list ?? []) rows.push([label(b.name), b.count]);
  }
  const csv = rows.map(r => r.map(csvCell).join(',')).join('\n');
  // BOM para o Excel reconhecer os acentos
  const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics-${summary.days}-dias.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
