'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { supabase } from '@/lib/supabase';
import { brl } from '@/lib/plans';
import { DEFAULT_PROGRAM, PARTNER_KINDS, PARTNER_STATUS, fetchPartnerProgram, type PartnerProgram } from '@/lib/partner';

// Admin → Parceiros: candidaturas e ranking, fila de saques e regras do programa (admin_settings.partner_program)

type Row = {
  id: string; status: string; kind: string; name: string; company: string; code: string | null; coupon_code: string | null;
  created_at: string; username: string; email: string | null; whatsapp: string; audience: string;
  tier: { name: string; rate: number; active_clients: number }; signups: number; clicks: number; revenue_cents: number; commission_cents: number;
  balances: { hold: number; available: number; requested: number; paid: number };
};
type PayoutRow = {
  id: string; partner_id: string; partner_name: string; username: string; document: string; amount_cents: number; pix_key: string;
  pix_full_name: string; status: string; created_at: string; resolved_at: string | null; admin_note: string;
};

const TABS = [
  { key: 'parceiros', label: 'Parceiros' },
  { key: 'saques', label: 'Saques' },
  { key: 'config', label: 'Configurações' },
] as const;

export default function AdminPartnersPage() {
  return (
    <Suspense fallback={<div className="p-6 font-bold">Carregando...</div>}>
      <AdminPartners />
    </Suspense>
  );
}

function AdminPartners() {
  const params = useSearchParams();
  const router = useRouter();
  const tab = TABS.some(t => t.key === params.get('tab')) ? params.get('tab') : 'parceiros';

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <Toaster theme="light" position="top-center" richColors toastOptions={{ className: 'brutal-border font-bold' }} />
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">Parceiros</h1>
          <p className="text-sm text-black/70 mt-1">Agências, criadores e mídias que trazem clientes. Página pública em <a href="/parceiros" target="_blank" className="underline font-bold">/parceiros</a>.</p>
        </div>
        <div className="inline-flex brutal-border bg-white p-1 gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => router.replace(`/admin/parceiros?tab=${t.key}`)} className={`px-3 py-1.5 text-xs font-bold ${tab === t.key ? 'bg-black text-white' : ''}`}>{t.label}</button>
          ))}
        </div>
      </div>
      {tab === 'parceiros' && <PartnerList />}
      {tab === 'saques' && <Payouts />}
      {tab === 'config' && <Settings />}
    </div>
  );
}

function PartnerList() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');

  useEffect(() => {
    supabase.rpc('admin_partners').then(({ data, error }) => {
      if (error) toast.error(error.message);
      setRows((data as unknown as Row[]) ?? []);
    });
  }, []);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (rows ?? [])
      .filter(r => status === 'all' || r.status === status)
      .filter(r => !term || [r.name, r.company, r.username, r.email, r.code].some(v => (v ?? '').toLowerCase().includes(term)));
  }, [rows, status, q]);

  if (!rows) return <div className="font-bold">Carregando...</div>;
  const active = rows.filter(r => r.status === 'active');
  const pending = rows.filter(r => r.status === 'pending').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Parceiros ativos" value={active.length} hint={`${pending} candidatura(s) para analisar`} bg="bg-biolime" />
        <Kpi label="Clientes pagantes" value={active.reduce((s, r) => s + r.tier.active_clients, 0)} hint={`${rows.reduce((s, r) => s + r.signups, 0)} cadastros atribuídos`} bg="bg-white" />
        <Kpi label="Vendas via parceiros" value={brl(rows.reduce((s, r) => s + r.revenue_cents, 0))} hint="pagamentos aprovados" bg="bg-bioyellow" />
        <Kpi label="Comissões" value={brl(rows.reduce((s, r) => s + r.commission_cents, 0))} hint={`${brl(rows.reduce((s, r) => s + r.balances.paid, 0))} já pagas`} bg="bg-white" />
      </div>

      <div className="flex gap-2 flex-wrap">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nome, @, e-mail ou código" className="brutal-input px-3 py-2 text-sm flex-1 min-w-[220px]" />
        <select value={status} onChange={e => setStatus(e.target.value)} className="brutal-input px-3 py-2 text-sm bg-white">
          <option value="all">Todos os status</option>
          {Object.entries(PARTNER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="brutal-card bg-white overflow-x-auto">
        {list.length === 0 ? (
          <p className="p-6 text-sm text-black/60">Nenhum parceiro{rows.length ? ' neste filtro' : ' ainda'}.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-black/60 border-b-2 border-black">
              <tr><th className="p-3">Parceiro</th><th className="p-3">Status</th><th className="p-3">Nível</th><th className="p-3 text-right">Cliques</th><th className="p-3 text-right">Cadastros</th><th className="p-3 text-right">Pagantes</th><th className="p-3 text-right">Vendas</th><th className="p-3 text-right">A pagar</th></tr>
            </thead>
            <tbody>
              {list.map(r => {
                const s = PARTNER_STATUS[r.status];
                return (
                  <tr key={r.id} className="border-t border-black/10 hover:bg-bioyellow/20">
                    <td className="p-3">
                      <Link href={`/admin/parceiros/${r.id}`} className="font-bold underline">{r.company || r.name}</Link>
                      <div className="text-xs text-black/60">{PARTNER_KINDS[r.kind]} · @{r.username}{r.audience ? ` · ${r.audience}` : ''}</div>
                    </td>
                    <td className="p-3"><span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 brutal-border ${s?.className ?? ''}`}>{s?.label ?? r.status}</span></td>
                    <td className="p-3">{r.status === 'active' ? `${r.tier.name} · ${r.tier.rate}%` : '—'}</td>
                    <td className="p-3 text-right">{r.clicks}</td>
                    <td className="p-3 text-right">{r.signups}</td>
                    <td className="p-3 text-right font-bold">{r.tier.active_clients}</td>
                    <td className="p-3 text-right">{brl(r.revenue_cents)}</td>
                    <td className="p-3 text-right">{brl(r.balances.available + r.balances.hold + r.balances.requested)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Payouts() {
  const [rows, setRows] = useState<PayoutRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_partner_payouts');
    if (error) toast.error(error.message);
    setRows((data as unknown as PayoutRow[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function resolve(id: string, action: 'paid' | 'rejected') {
    const note = action === 'rejected' ? window.prompt('Motivo da recusa (o saldo volta para o parceiro):') : '';
    if (action === 'rejected' && note === null) return;
    setBusy(id);
    const { error } = await supabase.rpc('admin_resolve_partner_payout', { p_payout_id: id, p_action: action, p_note: note ?? '' });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success(action === 'paid' ? 'Saque marcado como pago.' : 'Saque recusado.');
    load();
  }

  if (!rows) return <div className="font-bold">Carregando...</div>;
  if (rows.length === 0) return <p className="brutal-card bg-white p-6 text-sm text-black/60">Nenhum saque de parceiro ainda.</p>;

  return (
    <div className="flex flex-col gap-3">
      {rows.map(p => (
        <div key={p.id} className={`brutal-card p-4 flex items-center justify-between gap-4 flex-wrap ${p.status === 'pending' ? 'bg-white' : 'bg-neutral-50'}`}>
          <div>
            <p className="font-display text-2xl">{brl(p.amount_cents)}</p>
            <p className="text-sm font-bold"><Link href={`/admin/parceiros/${p.partner_id}`} className="underline">{p.partner_name}</Link> · @{p.username}</p>
            <p className="text-xs text-black/70 mt-1">PIX: <span className="font-mono">{p.pix_key}</span> · {p.pix_full_name} · doc {p.document}</p>
            <p className="text-xs text-black/50">Pedido em {new Date(p.created_at).toLocaleString('pt-BR')}{p.admin_note ? ` · ${p.admin_note}` : ''}</p>
          </div>
          {p.status === 'pending' ? (
            <div className="flex gap-2">
              <button disabled={busy === p.id} onClick={() => resolve(p.id, 'paid')} className="brutal-btn bg-biolime px-4 py-2 text-sm">Marcar como pago</button>
              <button disabled={busy === p.id} onClick={() => resolve(p.id, 'rejected')} className="brutal-btn bg-white px-4 py-2 text-sm">Recusar</button>
            </div>
          ) : (
            <span className={`text-xs font-bold uppercase px-2 py-1 brutal-border ${p.status === 'paid' ? 'bg-biolime' : 'bg-red-100'}`}>
              {p.status === 'paid' ? `Pago em ${new Date(p.resolved_at!).toLocaleDateString('pt-BR')}` : 'Recusado'}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function Settings() {
  const [p, setP] = useState<PartnerProgram | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { fetchPartnerProgram().then(setP); }, []);
  if (!p) return <div className="font-bold">Carregando...</div>;

  const set = <K extends keyof PartnerProgram>(k: K, v: PartnerProgram[K]) => setP(prev => (prev ? { ...prev, [k]: v } : prev));
  const num = (k: keyof PartnerProgram) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, Math.max(0, Number(e.target.value) || 0) as never);

  async function save() {
    if (!p) return;
    const tiers = [...p.tiers].filter(t => t.name.trim()).sort((a, b) => a.min - b.min);
    if (!tiers.length || tiers[0].min !== 0) { toast.error('O primeiro nível precisa começar em 0 clientes.'); return; }
    setBusy(true);
    const value = { ...p, tiers, bonuses: p.bonuses.filter(b => b.clients > 0 && b.cents > 0) };
    const { error } = await supabase.from('admin_settings').upsert({ key: 'partner_program', value, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Regras salvas. A página /parceiros atualiza em até 5 minutos.');
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="brutal-card bg-white p-5">
        <label className="flex items-center gap-2 font-bold">
          <input type="checkbox" checked={p.enabled} onChange={e => set('enabled', e.target.checked)} /> Receber novas candidaturas
        </label>
      </section>

      <section className="brutal-card bg-white p-5">
        <h2 className="font-display text-xl">Níveis de comissão recorrente</h2>
        <p className="text-xs text-black/60 mb-3">Por clientes pagantes ativos (plano em dia, fora do teste). A porcentagem vale para cada pagamento aprovado.</p>
        <div className="flex flex-col gap-2">
          {p.tiers.map((t, i) => (
            <div key={i} className="flex gap-2 items-center flex-wrap">
              <input value={t.name} onChange={e => set('tiers', p.tiers.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className="brutal-input px-2 py-1.5 text-sm w-36" placeholder="Nome" />
              <label className="text-xs font-bold">a partir de <input type="number" min={0} value={t.min} onChange={e => set('tiers', p.tiers.map((x, j) => (j === i ? { ...x, min: Number(e.target.value) || 0 } : x)))} className="brutal-input px-2 py-1.5 text-sm w-20" /> clientes</label>
              <label className="text-xs font-bold"><input type="number" min={0} max={90} step={0.5} value={t.rate} onChange={e => set('tiers', p.tiers.map((x, j) => (j === i ? { ...x, rate: Number(e.target.value) || 0 } : x)))} className="brutal-input px-2 py-1.5 text-sm w-20" /> %</label>
              <button onClick={() => set('tiers', p.tiers.filter((_, j) => j !== i))} aria-label="Remover nível" className="brutal-btn bg-white px-2 py-1.5"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
        <button onClick={() => set('tiers', [...p.tiers, { name: '', min: 0, rate: 25 }])} className="mt-3 text-xs font-bold underline inline-flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar nível</button>
        <label className="block mt-4 text-sm font-bold">
          Duração da comissão (meses a partir do 1º pagamento, 0 = enquanto o cliente pagar)
          <input type="number" min={0} value={p.recurring_months} onChange={num('recurring_months')} className="block brutal-input px-2 py-1.5 text-sm w-28 mt-1" />
        </label>
      </section>

      <section className="brutal-card bg-white p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <h2 className="font-display text-xl sm:col-span-2 lg:col-span-3">Regras</h2>
        <NumField label="Desconto do cupom (% no 1º pagamento)" value={p.coupon_discount_pct} onChange={num('coupon_discount_pct')} />
        <NumField label="Carência para liberar (dias)" value={p.hold_days} onChange={num('hold_days')} />
        <NumField label="Validade do link (dias)" value={p.cookie_days} onChange={num('cookie_days')} />
        <NumField label="Saque mínimo (R$)" value={p.min_payout_cents / 100} onChange={e => set('min_payout_cents', Math.round((Number(e.target.value) || 0) * 100))} />
        <NumField label="Teste grátis pelo link (dias, 0 = sem teste)" value={p.trial_days} onChange={num('trial_days')} />
        <label className="block text-xs font-bold uppercase tracking-wider">
          Plano do teste
          <select value={p.trial_plan} onChange={e => set('trial_plan', e.target.value as 'pro' | 'business')} className="block w-full brutal-input px-2 py-2 text-sm mt-1 bg-white normal-case">
            <option value="pro">Pro</option><option value="business">Business</option>
          </select>
        </label>
      </section>

      <section className="brutal-card bg-white p-5">
        <h2 className="font-display text-xl">Bônus de meta</h2>
        <p className="text-xs text-black/60 mb-3">Pago uma vez quando o parceiro atinge o número de clientes pagantes ativos (com a mesma carência).</p>
        <div className="flex flex-col gap-2">
          {p.bonuses.map((b, i) => (
            <div key={i} className="flex gap-2 items-center flex-wrap text-xs font-bold">
              ao chegar a <input type="number" min={1} value={b.clients} onChange={e => set('bonuses', p.bonuses.map((x, j) => (j === i ? { ...x, clients: Number(e.target.value) || 0 } : x)))} className="brutal-input px-2 py-1.5 text-sm w-20" />
              clientes, pagar R$ <input type="number" min={0} value={b.cents / 100} onChange={e => set('bonuses', p.bonuses.map((x, j) => (j === i ? { ...x, cents: Math.round((Number(e.target.value) || 0) * 100) } : x)))} className="brutal-input px-2 py-1.5 text-sm w-24" />
              <button onClick={() => set('bonuses', p.bonuses.filter((_, j) => j !== i))} aria-label="Remover bônus" className="brutal-btn bg-white px-2 py-1.5"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
        <button onClick={() => set('bonuses', [...p.bonuses, { clients: 50, cents: 100000 }])} className="mt-3 text-xs font-bold underline inline-flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar bônus</button>
      </section>

      <section className="brutal-card bg-white p-5 grid sm:grid-cols-3 gap-4">
        <h2 className="font-display text-xl sm:col-span-3">Licenças no atacado</h2>
        <label className="flex items-center gap-2 font-bold text-sm sm:col-span-3">
          <input type="checkbox" checked={p.wholesale_enabled} onChange={e => set('wholesale_enabled', e.target.checked)} /> Parceiros podem comprar licenças
        </label>
        <NumField label="Desconto (%)" value={p.wholesale_discount_pct} onChange={num('wholesale_discount_pct')} />
        <NumField label="Quantidade mínima" value={p.wholesale_min_qty} onChange={num('wholesale_min_qty')} />
      </section>

      <div className="flex gap-2">
        <button onClick={save} disabled={busy} className="brutal-btn bg-black text-white px-6 py-3 gap-2">{busy && <Loader2 className="w-4 h-4 animate-spin" />} Salvar regras</button>
        <button onClick={() => setP({ ...DEFAULT_PROGRAM })} className="brutal-btn bg-white px-6 py-3">Restaurar padrão</button>
      </div>
      <p className="text-[11px] text-black/50">Mudanças valem para os próximos pagamentos; comissões já registradas não mudam.</p>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wider">
      {label}
      <input type="number" min={0} value={value} onChange={onChange} className="block w-full brutal-input px-2 py-2 text-sm mt-1" />
    </label>
  );
}

function Kpi({ label, value, hint, bg }: { label: string; value: string | number; hint: string; bg: string }) {
  return (
    <div className={`brutal-card p-5 ${bg}`}>
      <div className="text-xs font-bold uppercase">{label}</div>
      <div className="font-display text-3xl mt-2">{value}</div>
      <div className="text-xs text-black/70 mt-1">{hint}</div>
    </div>
  );
}
