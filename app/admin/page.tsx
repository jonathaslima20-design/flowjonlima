'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, TrendingUp, CreditCard, MousePointerClick, UserCheck, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

interface Stats {
  totalUsers: number;
  proUsers: number;
  totalClicks: number;
  newUsersLast30: number;
  revenueEstimate: number;
  themeUsage: { name: string; count: number }[];
  signupsByDay: { date: string; count: number }[];
  recentLeads: { id: string; email: string; username: string; created_at: string }[];
  recentUsers: { id: string; username: string; display_name: string; is_pro: boolean; created_at: string }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc('admin_dashboard_stats');
      if (error || !data) { setLoading(false); return; }
      setStats({
        totalUsers: data.totalUsers ?? 0,
        proUsers: data.proUsers ?? 0,
        totalClicks: data.totalClicks ?? 0,
        newUsersLast30: data.newUsersLast30 ?? 0,
        revenueEstimate: data.revenueEstimate ?? 0,
        themeUsage: data.themeUsage ?? [],
        signupsByDay: data.signupsByDay ?? [],
        recentLeads: data.recentLeads ?? [],
        recentUsers: data.recentUsers ?? [],
      });
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="font-bold text-lg animate-pulse">Carregando métricas...</div>
      </div>
    );
  }

  const s = stats!;

  const statCards = [
    { label: 'Usuários totais', value: s.totalUsers.toLocaleString('pt-BR'), icon: Users, color: 'bg-blue-50 border-blue-200', iconColor: 'text-blue-600' },
    { label: 'Usuários Pro', value: s.proUsers.toLocaleString('pt-BR'), icon: Zap, color: 'bg-yellow-50 border-yellow-200', iconColor: 'text-yellow-600' },
    { label: 'Novos (30 dias)', value: s.newUsersLast30.toLocaleString('pt-BR'), icon: TrendingUp, color: 'bg-green-50 border-green-200', iconColor: 'text-green-600' },
    { label: 'Cliques totais', value: s.totalClicks.toLocaleString('pt-BR'), icon: MousePointerClick, color: 'bg-orange-50 border-orange-200', iconColor: 'text-orange-600' },
    { label: 'Receita estimada', value: `R$ ${(s.revenueEstimate / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: CreditCard, color: 'bg-emerald-50 border-emerald-200', iconColor: 'text-emerald-600' },
    { label: 'Taxa Pro', value: s.totalUsers > 0 ? `${((s.proUsers / s.totalUsers) * 100).toFixed(1)}%` : '0%', icon: UserCheck, color: 'bg-rose-50 border-rose-200', iconColor: 'text-rose-600' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl mb-1">Visão Geral</h1>
        <p className="text-gray-500 text-sm">Métricas globais do sistema</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, iconColor }) => (
          <div key={label} className={`brutal-card p-4 ${color}`}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{label}</span>
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <div className="font-display text-2xl md:text-3xl">{value}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="brutal-card p-5">
          <h2 className="font-display text-lg mb-4">Novos cadastros (30 dias)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={s.signupsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#000" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="brutal-card p-5">
          <h2 className="font-display text-lg mb-4">Temas mais usados</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={s.themeUsage} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#FACC15" stroke="#000" strokeWidth={1.5} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent tables */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="brutal-card p-5">
          <h2 className="font-display text-lg mb-4">Leads recentes</h2>
          <div className="flex flex-col gap-2">
            {s.recentLeads.length === 0 && <p className="text-sm text-gray-400">Nenhum lead ainda.</p>}
            {s.recentLeads.map(l => (
              <div key={l.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 text-sm">
                <span className="font-bold truncate max-w-[180px]">{l.email}</span>
                <span className="text-gray-400 text-xs">{new Date(l.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="brutal-card p-5">
          <h2 className="font-display text-lg mb-4">Usuários recentes</h2>
          <div className="flex flex-col gap-2">
            {s.recentUsers.length === 0 && <p className="text-sm text-gray-400">Nenhum usuário ainda.</p>}
            {s.recentUsers.map((u: any) => (
              <div key={u.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 text-sm">
                <div>
                  <span className="font-bold">{u.display_name || u.username}</span>
                  <span className="text-gray-400 ml-2 text-xs">@{u.username}</span>
                </div>
                {u.is_pro && (
                  <span className="bg-bioyellow text-black text-[10px] font-bold px-2 py-0.5 brutal-border">PRO</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
