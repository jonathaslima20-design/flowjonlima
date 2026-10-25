'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { Lock } from 'lucide-react';
import { usePlan } from '@/hooks/use-plan';
import { useUpgradeModal } from '@/components/dashboard/UpgradeModal';

// O gráfico mostra no máximo 30 dias; o plano define quantos dias de histórico o usuário vê
const CHART_MAX_DAYS = 30;

export default function AnalyticsPage() {
  const [series, setSeries] = useState<any[]>([]);
  const [topLinks, setTopLinks] = useState<any[]>([]);
  const { plan, loading } = usePlan();
  const { open: openUpgrade } = useUpgradeModal();
  const days = Math.min(plan.limits.analytics_days, CHART_MAX_DAYS);

  useEffect(() => {
    if (loading) return;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const pid = u.user.id;

      const { data: rows } = await supabase.from('clicks').select('created_at').eq('profile_id', pid).gte('created_at', new Date(Date.now() - days * 86400000).toISOString());
      const buckets: Record<string, number> = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const key = d.toISOString().slice(5, 10);
        buckets[key] = 0;
      }
      (rows ?? []).forEach((r: any) => { const key = r.created_at.slice(5, 10); if (key in buckets) buckets[key] += 1; });
      setSeries(Object.entries(buckets).map(([day, clicks]) => ({ day, clicks })));

      const { data: links } = await supabase.from('links').select('title, clicks').eq('profile_id', pid).order('clicks', { ascending: false }).limit(5);
      setTopLinks(links ?? []);
    })();
  }, [days, loading]);

  return (
    <div>
      <h1 className="font-display text-4xl mb-6">Analytics</h1>

      {!loading && plan.limits.analytics_days < CHART_MAX_DAYS && (
        <div className="brutal-card p-4 mb-6 bg-bioyellow flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-sm font-bold">
              No plano {plan.name} você vê os últimos {plan.limits.analytics_days} dias. Faça upgrade para ver o histórico completo.
            </p>
          </div>
          <button onClick={openUpgrade} className="brutal-btn bg-black text-white px-4 py-2 text-xs shrink-0">Ver planos</button>
        </div>
      )}

      <div className="brutal-card p-6 mb-6">
        <h2 className="font-display text-xl mb-4">Cliques ({days} dias)</h2>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={series}>
              <CartesianGrid stroke="#000" strokeDasharray="0" vertical={false} />
              <XAxis dataKey="day" stroke="#000" />
              <YAxis stroke="#000" allowDecimals={false} />
              <Tooltip contentStyle={{ border: '2px solid #000', borderRadius: 0 }} />
              <Line dataKey="clicks" stroke="#2563EB" strokeWidth={3} dot={{ fill: '#000', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
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
              <Bar dataKey="clicks" fill="#BEF264" stroke="#000" strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
