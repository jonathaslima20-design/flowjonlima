'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Copy, Check, X } from 'lucide-react';

type Payout = {
  id: string;
  amount_cents: number;
  pix_key: string;
  pix_full_name: string;
  status: string;
  admin_note: string | null;
  created_at: string | null;
  updated_at: string | null;
  profiles: { username: string } | null;
};

type Filter = 'pending' | 'paid' | 'rejected' | 'all';

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'PENDENTE', cls: 'bg-bioyellow text-black border border-black' },
  approved: { label: 'APROVADO', cls: 'bg-blue-100 text-blue-800 border border-blue-300' },
  paid: { label: 'PAGO', cls: 'bg-green-100 text-green-800 border border-green-300' },
  rejected: { label: 'RECUSADO', cls: 'bg-red-100 text-red-700 border border-red-300' },
};

function brl(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('pending');
  const [copied, setCopied] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Payout | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [error, setError] = useState('');

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('payout_requests')
      .select('id, amount_cents, pix_key, pix_full_name, status, admin_note, created_at, updated_at, profiles!payout_requests_user_id_fkey(username)')
      .order('created_at', { ascending: false })
      .limit(500);
    setPayouts((data as unknown as Payout[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  const pendingTotal = useMemo(
    () => payouts.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount_cents, 0),
    [payouts],
  );

  const visible = payouts.filter(p => filter === 'all' || p.status === filter);

  async function resolve(payout: Payout, action: 'paid' | 'rejected', note = '') {
    setError('');
    setActing(payout.id);
    const { error: err } = await supabase.rpc('admin_resolve_payout', {
      p_payout_id: payout.id,
      p_action: action,
      p_note: note,
    });
    setActing(null);
    if (err) { setError(err.message); return; }
    setRejecting(null);
    setRejectNote('');
    fetchPayouts();
  }

  function markPaid(payout: Payout) {
    const ok = window.confirm(
      `Confirmar que o Pix de ${brl(payout.amount_cents)} para ${payout.pix_full_name} já foi enviado?`,
    );
    if (ok) resolve(payout, 'paid');
  }

  async function copyPix(payout: Payout) {
    try {
      await navigator.clipboard.writeText(payout.pix_key);
      setCopied(payout.id);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl mb-1">Saques</h1>
          <p className="text-gray-500 text-sm">Pedidos de saque de comissões do programa de indicação</p>
        </div>
        <button onClick={fetchPayouts} className="brutal-btn px-3 py-2 bg-white text-sm" aria-label="Atualizar">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="brutal-card p-4 mb-6 bg-bioyellow inline-block min-w-[240px]">
        <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">A pagar</div>
        <div className="font-display text-2xl mt-1">{brl(pendingTotal)}</div>
        <div className="text-[11px] text-gray-700 mt-0.5">
          {payouts.filter(p => p.status === 'pending').length} pedido(s) pendente(s)
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {([
          ['pending', 'Pendentes'],
          ['paid', 'Pagos'],
          ['rejected', 'Recusados'],
          ['all', 'Todos'],
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

      {error && <p className="text-sm font-bold text-biored mb-3">{error}</p>}

      <div className="brutal-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center font-bold text-gray-400 animate-pulse">Carregando...</div>
        ) : visible.length === 0 ? (
          <div className="p-12 text-center text-gray-400">Nenhum saque encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-black bg-gray-50">
                  <th className="text-left px-4 py-3 font-display text-xs uppercase tracking-wider">Pedido</th>
                  <th className="text-left px-4 py-3 font-display text-xs uppercase tracking-wider">Usuário</th>
                  <th className="text-right px-4 py-3 font-display text-xs uppercase tracking-wider">Valor</th>
                  <th className="text-left px-4 py-3 font-display text-xs uppercase tracking-wider">Pix</th>
                  <th className="text-center px-4 py-3 font-display text-xs uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 font-display text-xs uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(p => {
                  const status = STATUS[p.status] ?? STATUS.pending;
                  return (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors align-top">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="px-4 py-3 font-bold">{p.profiles ? `@${p.profiles.username}` : 'conta removida'}</td>
                      <td className="px-4 py-3 text-right font-bold whitespace-nowrap">{brl(p.amount_cents)}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-xs">{p.pix_full_name || '—'}</div>
                        <button
                          onClick={() => copyPix(p)}
                          className="inline-flex items-center gap-1 font-mono text-xs text-gray-500 hover:text-black"
                          title="Copiar chave Pix"
                        >
                          {p.pix_key}
                          {copied === p.id ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                        {p.admin_note && <div className="text-[11px] text-gray-500 mt-1">Obs.: {p.admin_note}</div>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 inline-block ${status.cls}`}>{status.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        {p.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => markPaid(p)}
                              disabled={acting === p.id}
                              className="brutal-btn bg-biolime px-3 py-1.5 text-xs disabled:opacity-50"
                            >
                              Marcar como pago
                            </button>
                            <button
                              onClick={() => { setRejecting(p); setRejectNote(''); setError(''); }}
                              disabled={acting === p.id}
                              className="brutal-btn bg-white px-3 py-1.5 text-xs disabled:opacity-50"
                            >
                              Recusar
                            </button>
                          </div>
                        ) : (
                          <div className="text-right text-xs text-gray-400">
                            {p.updated_at ? new Date(p.updated_at).toLocaleDateString('pt-BR') : ''}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-3">
        Envie o Pix pelo seu banco e depois marque o pedido como pago. Ao recusar, o valor volta para o saldo do usuário.
      </p>

      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setRejecting(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-md bg-white brutal-border brutal-shadow-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-xl">Recusar saque</h2>
              <button onClick={() => setRejecting(null)} aria-label="Fechar"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm mb-3">
              {brl(rejecting.amount_cents)} volta para o saldo de {rejecting.profiles ? `@${rejecting.profiles.username}` : 'o usuário'}.
              O motivo aparece para o usuário no histórico de saques.
            </p>
            <textarea
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              placeholder="Motivo (ex.: chave Pix inválida)"
              className="brutal-input w-full min-h-[80px] mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setRejecting(null)} className="brutal-btn bg-white px-4 py-2 text-sm">Cancelar</button>
              <button
                onClick={() => resolve(rejecting, 'rejected', rejectNote)}
                disabled={acting === rejecting.id || !rejectNote.trim()}
                className="brutal-btn bg-biored text-white px-4 py-2 text-sm disabled:opacity-50"
              >
                Recusar e devolver saldo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
