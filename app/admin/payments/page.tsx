'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { planLabel } from '@/lib/plans';
import { RefreshCw, ExternalLink } from 'lucide-react';

type Payment = {
  id: string;
  plan_slug: string;
  amount_cents: number;
  status: string;
  mp_payment_id: string | null;
  mp_status_detail: string | null;
  paid_at: string | null;
  plan_granted_until: string | null;
  created_at: string;
  profiles: { username: string; display_name: string | null } | null;
};

type Filter = 'all' | 'approved' | 'pending' | 'problem';

const STATUS: Record<string, { label: string; cls: string }> = {
  approved: { label: 'APROVADO', cls: 'bg-green-100 text-green-800 border border-green-300' },
  pending: { label: 'PENDENTE', cls: 'bg-bioyellow text-black border border-black' },
  in_process: { label: 'EM ANÁLISE', cls: 'bg-blue-100 text-blue-800 border border-blue-300' },
  authorized: { label: 'AUTORIZADO', cls: 'bg-blue-100 text-blue-800 border border-blue-300' },
  in_mediation: { label: 'EM DISPUTA', cls: 'bg-orange-100 text-orange-800 border border-orange-300' },
  rejected: { label: 'RECUSADO', cls: 'bg-gray-100 text-gray-600 border border-gray-300' },
  cancelled: { label: 'CANCELADO', cls: 'bg-gray-100 text-gray-600 border border-gray-300' },
  refunded: { label: 'ESTORNADO', cls: 'bg-red-100 text-red-700 border border-red-300' },
  charged_back: { label: 'CHARGEBACK', cls: 'bg-red-100 text-red-700 border border-red-300' },
  error: { label: 'ERRO', cls: 'bg-red-100 text-red-700 border border-red-300' },
};

// Precisam de atenção do admin: estorno/chargeback (plano não é retirado sozinho) e erros
const PROBLEM_STATUSES = ['refunded', 'charged_back', 'in_mediation', 'error'];
const PENDING_STATUSES = ['pending', 'in_process', 'authorized'];

function brl(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function date(value: string | null) {
  return value ? new Date(value).toLocaleDateString('pt-BR') : '—';
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('payments')
      .select('id, plan_slug, amount_cents, status, mp_payment_id, mp_status_detail, paid_at, plan_granted_until, created_at, profiles!payments_profile_id_fkey(username, display_name)')
      .order('created_at', { ascending: false })
      .limit(500);
    setPayments((data as unknown as Payment[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const stats = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const approved = payments.filter(p => p.status === 'approved');
    return {
      revenueMonth: approved.filter(p => p.paid_at && new Date(p.paid_at) >= monthStart).reduce((s, p) => s + p.amount_cents, 0),
      revenueTotal: approved.reduce((s, p) => s + p.amount_cents, 0),
      approvedCount: approved.length,
      pendingCount: payments.filter(p => PENDING_STATUSES.includes(p.status)).length,
      problemCount: payments.filter(p => PROBLEM_STATUSES.includes(p.status)).length,
    };
  }, [payments]);

  const visible = payments.filter(p =>
    filter === 'all' ? true
      : filter === 'approved' ? p.status === 'approved'
      : filter === 'pending' ? PENDING_STATUSES.includes(p.status)
      : PROBLEM_STATUSES.includes(p.status)
  );

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl mb-1">Pagamentos</h1>
          <p className="text-gray-500 text-sm">Pagamentos do Mercado Pago (Checkout Pro)</p>
        </div>
        <button onClick={fetchPayments} className="brutal-btn px-3 py-2 bg-white text-sm" aria-label="Atualizar">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Receita do mês" value={brl(stats.revenueMonth)} bg="bg-biolime" />
        <Kpi label="Receita total" value={brl(stats.revenueTotal)} hint={`${stats.approvedCount} aprovados`} bg="bg-white" />
        <Kpi label="Pendentes" value={String(stats.pendingCount)} hint="PIX/boleto aguardando" bg="bg-bioyellow" />
        <Kpi label="Precisam de atenção" value={String(stats.problemCount)} hint="estornos, disputas e erros" bg={stats.problemCount > 0 ? 'bg-red-100' : 'bg-white'} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {([
          ['all', 'Todos'],
          ['approved', 'Aprovados'],
          ['pending', 'Pendentes'],
          ['problem', 'Precisam de atenção'],
        ] as [Filter, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`brutal-btn px-3 py-1.5 text-xs ${filter === key ? 'bg-black text-white' : 'bg-white'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="brutal-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center font-bold text-gray-400 animate-pulse">Carregando...</div>
        ) : visible.length === 0 ? (
          <div className="p-12 text-center text-gray-400">Nenhum pagamento encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-black bg-gray-50">
                  <th className="text-left px-4 py-3 font-display text-xs uppercase tracking-wider">Data</th>
                  <th className="text-left px-4 py-3 font-display text-xs uppercase tracking-wider">Usuário</th>
                  <th className="text-left px-4 py-3 font-display text-xs uppercase tracking-wider">Plano</th>
                  <th className="text-right px-4 py-3 font-display text-xs uppercase tracking-wider">Valor</th>
                  <th className="text-center px-4 py-3 font-display text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 font-display text-xs uppercase tracking-wider hidden md:table-cell">Plano até</th>
                  <th className="text-left px-4 py-3 font-display text-xs uppercase tracking-wider hidden lg:table-cell">ID Mercado Pago</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(p => {
                  const status = STATUS[p.status] ?? { label: p.status.toUpperCase(), cls: 'bg-gray-100 text-gray-600 border border-gray-300' };
                  return (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{date(p.paid_at ?? p.created_at)}</td>
                      <td className="px-4 py-3">
                        {p.profiles ? (
                          <a href={`/${p.profiles.username}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold hover:underline">
                            @{p.profiles.username}
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          </a>
                        ) : (
                          <span className="text-gray-400">conta removida</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs font-bold">{planLabel(p.plan_slug)}</td>
                      <td className="px-4 py-3 text-right font-bold whitespace-nowrap">{brl(p.amount_cents)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 inline-block ${status.cls}`} title={p.mp_status_detail ?? undefined}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{date(p.plan_granted_until)}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-400 hidden lg:table-cell">{p.mp_payment_id ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {stats.problemCount > 0 && (
        <p className="text-xs text-gray-500 mt-3">
          Estornos e chargebacks não retiram o plano automaticamente: confira o caso e, se necessário, ajuste o plano do usuário em Usuários.
        </p>
      )}
    </div>
  );
}

function Kpi({ label, value, hint, bg }: { label: string; value: string; hint?: string; bg: string }) {
  return (
    <div className={`brutal-card p-4 ${bg}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</div>
      <div className="font-display text-2xl mt-1">{value}</div>
      {hint && <div className="text-[11px] text-gray-600 mt-0.5">{hint}</div>}
    </div>
  );
}
