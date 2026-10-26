'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { brl } from '@/lib/plans';

type Named = { name: string; count: number };
type Metrics = {
  days: number;
  total_accounts: number;
  signups: number;
  signups_by_source: Named[];
  activation: { eligible: number; activated: number };
  paying_accounts: number;
  paying_by_plan: Named[];
  new_customers: number;
  revenue_cents: number;
  payments: number;
  renewal: { eligible: number; renewed: number };
  expiring_soon: { username: string; email: string; plan: string; expires_at: string }[];
  views: number;
  clicks: number;
  active_pages: number;
  top_pages: { username: string; views: number; clicks: number }[];
};

const PERIODS = [7, 30, 90, 365];
const SOURCE_LABELS: Record<string, string> = { badge: 'Selo "feito com BioFlowzy"', direto: 'Direto / desconhecido' };

function pct(part: number, total: number) {
  return total ? `${Math.round((part / total) * 1000) / 10}%` : '—';
}

export default function AdminMetricsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Metrics | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setError('');
      const { data: d, error: e } = await supabase.rpc('admin_growth_metrics', { p_days: days });
      if (e) { setError(e.message); return; }
      setData(d as unknown as Metrics);
    })();
  }, [days]);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">Métricas de crescimento</h1>
          <p className="text-sm text-black/70 mt-1">Contas de teste do admin não entram na conta.</p>
        </div>
        <div className="inline-flex brutal-border bg-white p-1 gap-1">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setDays(p)} className={`px-3 py-1.5 text-xs font-bold ${days === p ? 'bg-black text-white' : 'bg-white'}`}>
              {p === 365 ? '1 ano' : `${p} dias`}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="brutal-card p-4 bg-red-50 text-sm font-bold">{error}</div>}
      {!data && !error && <div className="font-bold">Carregando...</div>}

      {data && (
        <div className="flex flex-col gap-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Kpi label="Cadastros no período" value={data.signups} hint={`${data.total_accounts} contas no total`} bg="bg-bioyellow" />
            <Kpi
              label="Ativação"
              value={pct(data.activation.activated, data.activation.eligible)}
              hint={`${data.activation.activated} de ${data.activation.eligible} com 3+ links nas primeiras 24 h`}
              bg="bg-biolime"
            />
            <Kpi
              label="Conversão Free → pago"
              value={pct(data.paying_accounts, data.total_accounts)}
              hint={`${data.paying_accounts} contas pagantes hoje · meta 3 a 5%`}
              bg="bg-white"
            />
            <Kpi label="Novos clientes no período" value={data.new_customers} hint={`${data.payments} pagamento(s) aprovado(s)`} bg="bg-white" />
            <Kpi label="Receita no período" value={brl(data.revenue_cents)} hint="pagamentos aprovados" bg="bg-bioyellow" />
            <Kpi
              label="Renovação"
              value={pct(data.renewal.renewed, data.renewal.eligible)}
              hint={`${data.renewal.renewed} de ${data.renewal.eligible} clientes com o 1º período vencido pagaram de novo`}
              bg="bg-biolime"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card title="Origem dos cadastros">
              <BarList items={data.signups_by_source.map(s => ({ ...s, name: SOURCE_LABELS[s.name] ?? s.name }))} empty="Nenhum cadastro no período." />
            </Card>
            <Card title="Contas pagantes por plano">
              <BarList items={data.paying_by_plan.map(s => ({ ...s, name: s.name === 'pro' ? 'Pro' : s.name === 'business' ? 'Business' : s.name }))} empty="Nenhuma conta pagante." />
            </Card>
          </div>

          <Card title={`Planos vencendo nos próximos 30 dias (${data.expiring_soon.length})`}>
            {data.expiring_soon.length === 0 ? (
              <p className="text-sm text-black/60">Nenhum plano vencendo.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs uppercase text-black/60"><th className="py-2 pr-3">Página</th><th className="pr-3">E-mail</th><th className="pr-3">Plano</th><th>Vence em</th></tr></thead>
                  <tbody>
                    {data.expiring_soon.map(e => (
                      <tr key={e.username} className="border-t border-black/10">
                        <td className="py-2 pr-3 font-bold"><a href={`/${e.username}`} target="_blank" rel="noreferrer" className="underline">/{e.username}</a></td>
                        <td className="pr-3"><a href={`mailto:${e.email}`} className="underline">{e.email}</a></td>
                        <td className="pr-3 capitalize">{e.plan}</td>
                        <td>{new Date(e.expires_at).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-[11px] text-black/50 mt-3">Sem renovação automática: vale lembrar esses clientes antes do vencimento.</p>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card title="Tráfego das páginas">
              <div className="grid grid-cols-2 gap-3">
                <Mini label="Visitas" value={data.views.toLocaleString('pt-BR')} />
                <Mini label="Cliques" value={data.clicks.toLocaleString('pt-BR')} />
                <Mini label="Páginas com visitas" value={data.active_pages.toLocaleString('pt-BR')} />
                <Mini label="Cliques por página ativa" value={data.active_pages ? (Math.round((data.clicks / data.active_pages) * 10) / 10).toLocaleString('pt-BR') : '—'} />
              </div>
            </Card>
            <Card title="Páginas mais visitadas">
              {data.top_pages.length === 0 ? (
                <p className="text-sm text-black/60">Nenhuma visita no período.</p>
              ) : (
                <ul className="flex flex-col gap-2 text-sm">
                  {data.top_pages.map(p => (
                    <li key={p.username} className="flex justify-between gap-3">
                      <a href={`/${p.username}`} target="_blank" rel="noreferrer" className="font-bold underline truncate">/{p.username}</a>
                      <span className="shrink-0 text-black/70">{p.views} visitas · {p.clicks} cliques</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, hint, bg }: { label: string; value: string | number; hint: string; bg: string }) {
  return (
    <div className={`brutal-card p-5 ${bg}`}>
      <div className="text-xs font-bold uppercase">{label}</div>
      <div className="font-display text-4xl mt-2">{value}</div>
      <div className="text-xs text-black/70 mt-1">{hint}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="brutal-card p-5 bg-white">
      <h2 className="font-display text-lg mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="brutal-border p-3">
      <div className="text-[10px] font-bold uppercase text-black/60">{label}</div>
      <div className="font-display text-2xl">{value}</div>
    </div>
  );
}

function BarList({ items, empty }: { items: Named[]; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-black/60">{empty}</p>;
  const max = Math.max(...items.map(i => i.count), 1);
  return (
    <div className="flex flex-col gap-2">
      {items.map(i => (
        <div key={i.name}>
          <div className="flex justify-between text-xs font-bold"><span>{i.name}</span><span>{i.count}</span></div>
          <div className="h-3 brutal-border bg-white mt-1"><div className="h-full bg-bioblue" style={{ width: `${(i.count / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}
