'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';

export default function AnalyticsPage() {
  const [series, setSeries] = useState<any[]>([]);
  const [topLinks, setTopLinks] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const pid = u.user.id;

      const { data: rows } = await supabase.from('clicks').select('created_at').eq('profile_id', pid).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString());
      const buckets: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const key = d.toISOString().slice(5, 10);
        buckets[key] = 0;
      }
      (rows ?? []).forEach((r: any) => { const key = r.created_at.slice(5, 10); if (key in buckets) buckets[key] += 1; });
      setSeries(Object.entries(buckets).map(([day, clicks]) => ({ day, clicks })));

      const { data: links } = await supabase.from('links').select('title, clicks').eq('profile_id', pid).order('clicks', { ascending: false }).limit(5);
      setTopLinks(links ?? []);
    })();
  }, []);

  return (
    <div>
      <h1 className="font-display text-4xl mb-6">Analytics</h1>

      <div className="brutal-card p-6 mb-6">
        <h2 className="font-display text-xl mb-4">Cliques (30 dias)</h2>
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
