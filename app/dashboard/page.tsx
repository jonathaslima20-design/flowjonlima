'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { MousePointerClick, Link2, AtSign, Video } from 'lucide-react';

type Profile = { id: string; username: string; display_name: string };

type Stats = {
  totalClicks: number;
  linkClicks: number;
  socialClicks: number;
  videoClicks: number;
  linkCount: number;
  socialCount: number;
  videoCount: number;
};

type TopLink = { title: string; clicks: number };

export default function DashboardHome() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalClicks: 0, linkClicks: 0, socialClicks: 0, videoClicks: 0,
    linkCount: 0, socialCount: 0, videoCount: 0,
  });
  const [series, setSeries] = useState<{ day: string; cliques: number }[]>([]);
  const [topLinks, setTopLinks] = useState<TopLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;

      const { data: p } = await supabase
        .from('profiles')
        .select('id,username,display_name')
        .eq('id', u.user.id)
        .maybeSingle();
      setProfile(p as Profile);
      if (!p) return;

      const pid = (p as Profile).id;

      const [
        { count: totalClicks },
        { count: linkClicks },
        { count: socialClicks },
        { count: videoClicks },
        { count: linkCount },
        { count: socialCount },
        { count: videoCount },
      ] = await Promise.all([
        supabase.from('clicks').select('*', { count: 'exact', head: true }).eq('profile_id', pid),
        supabase.from('clicks').select('*', { count: 'exact', head: true }).eq('profile_id', pid).eq('entity_type', 'link'),
        supabase.from('clicks').select('*', { count: 'exact', head: true }).eq('profile_id', pid).eq('entity_type', 'social'),
        supabase.from('clicks').select('*', { count: 'exact', head: true }).eq('profile_id', pid).eq('entity_type', 'video'),
        supabase.from('links').select('*', { count: 'exact', head: true }).eq('profile_id', pid).eq('is_active', true),
        supabase.from('social_links').select('*', { count: 'exact', head: true }).eq('profile_id', pid),
        supabase.from('videos').select('*', { count: 'exact', head: true }).eq('profile_id', pid),
      ]);

      setStats({
        totalClicks: totalClicks ?? 0,
        linkClicks: linkClicks ?? 0,
        socialClicks: socialClicks ?? 0,
        videoClicks: videoClicks ?? 0,
        linkCount: linkCount ?? 0,
        socialCount: socialCount ?? 0,
        videoCount: videoCount ?? 0,
      });

      // 7-day series from clicks table
      const since = new Date(Date.now() - 6 * 86400000);
      since.setHours(0, 0, 0, 0);
      const { data: rows } = await supabase
        .from('clicks')
        .select('created_at')
        .eq('profile_id', pid)
        .gte('created_at', since.toISOString());

      const buckets: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        buckets[key] = 0;
      }
      (rows ?? []).forEach((r: any) => {
        const key = new Date(r.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (key in buckets) buckets[key] += 1;
      });
      setSeries(Object.entries(buckets).map(([day, cliques]) => ({ day, cliques })));

      // Top links by clicks column in links table
      const { data: linksData } = await supabase
        .from('links')
        .select('title,clicks')
        .eq('profile_id', pid)
        .eq('is_active', true)
        .order('clicks', { ascending: false })
        .limit(5);
      setTopLinks((linksData ?? []) as TopLink[]);

      setLoading(false);
    })();
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-4xl">
            Ola, {profile?.display_name || 'criador'}
          </h1>
          <p className="text-sm mt-1">
            Seu link:{' '}
            <a
              className="underline font-bold"
              target="_blank"
              rel="noreferrer"
              href={`/${profile?.username}`}
            >
              bioflowzy.com/{profile?.username}
            </a>
          </p>
        </div>
        <a
          href={`/${profile?.username}`}
          target="_blank"
          rel="noreferrer"
          className="brutal-btn bg-bioyellow px-5 py-2 text-sm"
        >
          Ver minha bio
        </a>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
        <StatCard label="Cliques totais" value={loading ? '...' : stats.totalClicks} icon={MousePointerClick} bg="bg-bioyellow" />
        <StatCard label="Cliques em links" value={loading ? '...' : stats.linkClicks} icon={Link2} bg="bg-biolime" />
        <StatCard label="Links ativos" value={loading ? '...' : stats.linkCount} icon={Link2} bg="bg-bioblue" dark />
        <StatCard label="Cliques em redes" value={loading ? '...' : stats.socialClicks} icon={AtSign} bg="bg-white" />
      </div>

      <div className="mt-8 brutal-card p-6">
        <h2 className="font-display text-2xl mb-4">Cliques por dia (ultimos 7 dias)</h2>
        {loading ? (
          <div className="h-72 bg-neutral-100 animate-pulse" />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series}>
                <CartesianGrid stroke="#000" strokeDasharray="0" vertical={false} />
                <XAxis dataKey="day" stroke="#000" tick={{ fontWeight: 700, fontSize: 12 }} />
                <YAxis stroke="#000" tick={{ fontWeight: 700 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ border: '2px solid #000', borderRadius: 0, boxShadow: '4px 4px 0 #000' }}
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="cliques" fill="#2563EB" stroke="#000" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-5 mt-8">
        <div className="brutal-card p-6">
          <h2 className="font-display text-xl mb-4">Links mais clicados</h2>
          {loading ? (
            <div className="flex flex-col gap-2">
              {[0,1,2].map((i) => <div key={i} className="h-8 bg-neutral-100 animate-pulse" />)}
            </div>
          ) : topLinks.filter((l) => l.clicks > 0).length === 0 ? (
            <p className="text-sm text-black/60">Nenhum clique registrado ainda.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {topLinks.filter((l) => l.clicks > 0).map((l, i) => (
                <li key={i} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold truncate">{l.title}</span>
                  <span className="shrink-0 text-sm font-bold bg-bioyellow px-2 py-0.5 brutal-border">
                    {l.clicks} clique{l.clicks !== 1 ? 's' : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/dashboard/links" className="mt-4 inline-block text-xs font-bold underline">
            Gerenciar links
          </Link>
        </div>

        <div className="brutal-card p-6">
          <h2 className="font-display text-xl mb-4">Resumo do perfil</h2>
          <ul className="flex flex-col gap-3">
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm"><Link2 className="w-4 h-4" /> Links ativos</span>
              <span className="font-bold">{loading ? '...' : stats.linkCount}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm"><AtSign className="w-4 h-4" /> Redes sociais</span>
              <span className="font-bold">{loading ? '...' : stats.socialCount}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm"><Video className="w-4 h-4" /> Videos</span>
              <span className="font-bold">{loading ? '...' : stats.videoCount}</span>
            </li>
          </ul>
          <Link href="/dashboard/analytics" className="mt-4 inline-block text-xs font-bold underline">
            Ver analytics completo
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, bg, dark }: {
  label: string; value: string | number; icon: any; bg: string; dark?: boolean;
}) {
  return (
    <div className={`brutal-card p-5 ${bg} ${dark ? 'text-white' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase">{label}</span>
        <Icon className="w-5 h-5" />
      </div>
      <div className="font-display text-4xl mt-3">{value}</div>
    </div>
  );
}
