'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Unlink } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { supabase } from '@/lib/supabase';
import { PLANS, brl, type PaidPlanSlug } from '@/lib/plans';
import { formatWhatsapp, whatsappLink } from '@/lib/whatsapp';
import { CLIENT_SOURCES, COMMISSION_KINDS, COMMISSION_STATUS, PARTNER_KINDS, PARTNER_STATUS, partnerLink } from '@/lib/partner';

type Detail = {
  partner: {
    id: string; profile_id: string; status: string; kind: string; name: string; company: string; document: string; whatsapp: string;
    channels: string; audience: string; message: string; code: string | null; coupon_code: string | null; custom_rate: number | null;
    custom_discount_pct: number | null; pix_key: string; pix_full_name: string; admin_note: string; created_at: string; approved_at: string | null;
  };
  username: string; email: string | null;
  tier: { name: string; rate: number; active_clients: number; custom: boolean };
  discount_pct: number;
  balances: { hold: number; available: number; requested: number; paid: number };
  clicks: number;
  clients: { profile_id: string; username: string; plan: string; expires_at: string | null; trial: boolean; source: string; managed: boolean; attributed_at: string; locked_at: string | null; paid_cents: number }[];
  commissions: { id: string; kind: string; amount_cents: number; base_cents: number; rate: number | null; status: string; created_at: string; available_at: string; note: string; client: string | null }[];
  payouts: { id: string; amount_cents: number; status: string; created_at: string; resolved_at: string | null; admin_note: string }[];
  licenses: { available: number; assigned: number };
};

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—');

export default function AdminPartnerDetail() {
  const { id } = useParams<{ id: string }>();
  const [d, setD] = useState<Detail | null | undefined>(undefined);
  const [edit, setEdit] = useState({ code: '', coupon_code: '', custom_rate: '', custom_discount_pct: '', admin_note: '' });
  const [attach, setAttach] = useState({ username: '', managed: false });
  const [adjust, setAdjust] = useState({ value: '', note: '' });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_partner_detail', { p_partner_id: id });
    if (error) toast.error(error.message);
    const det = (data as unknown as Detail) ?? null;
    setD(det);
    if (det) {
      setEdit({
        code: det.partner.code ?? '', coupon_code: det.partner.coupon_code ?? '',
        custom_rate: det.partner.custom_rate?.toString() ?? '', custom_discount_pct: det.partner.custom_discount_pct?.toString() ?? '',
        admin_note: det.partner.admin_note,
      });
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function run(fn: () => PromiseLike<{ error: { message: string } | null }>, ok: string) {
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) { toast.error(error.message); return false; }
    toast.success(ok);
    load();
    return true;
  }

  if (d === undefined) return <div className="p-6 font-bold">Carregando...</div>;
  if (!d) return <div className="p-6 font-bold">Parceiro não encontrado.</div>;
  const p = d.partner;
  const s = PARTNER_STATUS[p.status];

  const setStatus = (status: string, label: string) => {
    const note = status === 'active' ? '' : window.prompt(`Motivo (${label.toLowerCase()}), opcional:`) ?? null;
    if (note === null) return;
    run(() => supabase.rpc('admin_set_partner_status', { p_partner_id: p.id, p_status: status, p_note: note }), `Parceiro: ${label.toLowerCase()}.`);
  };

  function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    run(() => supabase.from('partners').update({
      code: edit.code.trim().toLowerCase() || null,
      coupon_code: edit.coupon_code.trim().toUpperCase() || null,
      custom_rate: edit.custom_rate === '' ? null : Number(edit.custom_rate),
      custom_discount_pct: edit.custom_discount_pct === '' ? null : Number(edit.custom_discount_pct),
      admin_note: edit.admin_note,
      updated_at: new Date().toISOString(),
    }).eq('id', p.id), 'Dados salvos.');
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto flex flex-col gap-6">
      <Toaster theme="light" position="top-center" richColors toastOptions={{ className: 'brutal-border font-bold' }} />
      <Link href="/admin/parceiros" className="inline-flex items-center gap-1.5 text-sm font-bold hover:underline"><ArrowLeft className="w-4 h-4" /> Parceiros</Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 brutal-border ${s?.className ?? ''}`}>{s?.label ?? p.status}</span>
          <h1 className="font-display text-3xl md:text-4xl mt-2">{p.company || p.name}</h1>
          <p className="text-sm text-black/70">
            {PARTNER_KINDS[p.kind]} · {p.name} · <Link href={`/admin/users/${p.profile_id}`} className="underline font-bold">@{d.username}</Link> · {d.email}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {p.status !== 'active' && <button disabled={busy} onClick={() => setStatus('active', 'Aprovado')} className="brutal-btn bg-biolime px-4 py-2 text-sm">{p.status === 'pending' ? 'Aprovar' : 'Reativar'}</button>}
          {p.status === 'pending' && <button disabled={busy} onClick={() => setStatus('rejected', 'Recusado')} className="brutal-btn bg-white px-4 py-2 text-sm">Recusar</button>}
          {p.status === 'active' && <button disabled={busy} onClick={() => setStatus('suspended', 'Suspenso')} className="brutal-btn bg-white px-4 py-2 text-sm">Suspender</button>}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Nível" value={`${d.tier.name} · ${d.tier.rate}%`} hint={`${d.tier.active_clients} cliente(s) pagante(s)${d.tier.custom ? ' · taxa especial' : ''}`} bg="bg-biolime" />
        <Kpi label="Funil" value={`${d.clicks} → ${d.clients.length}`} hint="cliques → cadastros" bg="bg-white" />
        <Kpi label="A pagar" value={brl(d.balances.available + d.balances.hold)} hint={`${brl(d.balances.available)} disponível · ${brl(d.balances.requested)} em saque`} bg="bg-bioyellow" />
        <Kpi label="Licenças" value={d.licenses.available} hint={`disponíveis · ${d.licenses.assigned} usada(s)`} bg="bg-white" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="brutal-card bg-white p-5 text-sm flex flex-col gap-1.5">
          <h2 className="font-display text-xl mb-2">Candidatura</h2>
          <p><b>Documento:</b> {p.document}</p>
          <p><b>WhatsApp:</b> {p.whatsapp ? <a href={whatsappLink(p.whatsapp) ?? undefined} target="_blank" rel="noopener noreferrer" className="underline">{formatWhatsapp(p.whatsapp)}</a> : '—'}</p>
          <p><b>Canais:</b> {p.channels || '—'}</p>
          <p><b>Audiência:</b> {p.audience || '—'}</p>
          <p><b>Mensagem:</b> {p.message || '—'}</p>
          <p><b>PIX:</b> {p.pix_key ? `${p.pix_key} (${p.pix_full_name})` : 'não cadastrado'}</p>
          <p><b>Cadastro:</b> {fmt(p.created_at)} · <b>Aprovado:</b> {fmt(p.approved_at)}</p>
          {p.code && <p><b>Link:</b> <span className="font-mono">{partnerLink(p.code)}</span></p>}
        </section>

        <form onSubmit={saveEdit} className="brutal-card bg-white p-5 grid grid-cols-2 gap-3">
          <h2 className="font-display text-xl col-span-2">Condições</h2>
          <Field label="Código do link"><input value={edit.code} onChange={e => setEdit({ ...edit, code: e.target.value })} className="w-full brutal-input px-2 py-2 text-sm" /></Field>
          <Field label="Cupom"><input value={edit.coupon_code} onChange={e => setEdit({ ...edit, coupon_code: e.target.value.toUpperCase() })} className="w-full brutal-input px-2 py-2 text-sm" /></Field>
          <Field label="Comissão especial (%)"><input type="number" step={0.5} value={edit.custom_rate} onChange={e => setEdit({ ...edit, custom_rate: e.target.value })} placeholder="pelo nível" className="w-full brutal-input px-2 py-2 text-sm" /></Field>
          <Field label="Desconto do cupom (%)"><input type="number" value={edit.custom_discount_pct} onChange={e => setEdit({ ...edit, custom_discount_pct: e.target.value })} placeholder={`padrão (${d.discount_pct}%)`} className="w-full brutal-input px-2 py-2 text-sm" /></Field>
          <div className="col-span-2"><Field label="Nota interna"><textarea value={edit.admin_note} onChange={e => setEdit({ ...edit, admin_note: e.target.value })} rows={2} className="w-full brutal-input px-2 py-2 text-sm" /></Field></div>
          <button disabled={busy} className="col-span-2 brutal-btn bg-black text-white py-2.5 text-sm gap-2">{busy && <Loader2 className="w-4 h-4 animate-spin" />} Salvar condições</button>
        </form>
      </div>

      <section className="brutal-card bg-white overflow-x-auto">
        <div className="p-5 pb-3 flex items-end justify-between gap-3 flex-wrap">
          <h2 className="font-display text-xl">Clientes ({d.clients.length})</h2>
          <form
            onSubmit={e => {
              e.preventDefault();
              run(() => supabase.rpc('admin_partner_attach', { p_partner_id: p.id, p_username: attach.username.replace(/^@/, ''), p_managed: attach.managed }), 'Cliente vinculado.')
                .then(ok => ok && setAttach({ username: '', managed: false }));
            }}
            className="flex gap-2 items-center flex-wrap text-xs font-bold"
          >
            <input value={attach.username} onChange={e => setAttach({ ...attach, username: e.target.value })} placeholder="@usuario" className="brutal-input px-2 py-1.5 text-sm w-40" />
            <label className="inline-flex items-center gap-1"><input type="checkbox" checked={attach.managed} onChange={e => setAttach({ ...attach, managed: e.target.checked })} /> gerenciado</label>
            <button disabled={busy || !attach.username.trim()} className="brutal-btn bg-bioyellow px-3 py-1.5 text-xs">Vincular manualmente</button>
          </form>
        </div>
        {d.clients.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-black/60 border-y-2 border-black">
              <tr><th className="p-3">Conta</th><th className="p-3">Plano</th><th className="p-3">Vence</th><th className="p-3">Origem</th><th className="p-3">Vínculo</th><th className="p-3 text-right">Pago</th><th className="p-3" /></tr>
            </thead>
            <tbody>
              {d.clients.map(c => (
                <tr key={c.profile_id} className="border-t border-black/10">
                  <td className="p-3"><Link href={`/admin/users/${c.profile_id}`} className="font-bold underline">@{c.username}</Link>{c.managed && <span className="ml-1 text-[10px] font-bold uppercase bg-biolime px-1 brutal-border">gerenciado</span>}</td>
                  <td className="p-3">{c.trial ? 'Teste' : c.plan === 'free' ? 'Free' : PLANS[c.plan as PaidPlanSlug]?.name ?? c.plan}</td>
                  <td className="p-3">{c.plan === 'free' ? '—' : fmt(c.expires_at)}</td>
                  <td className="p-3">{CLIENT_SOURCES[c.source] ?? c.source} · {fmt(c.attributed_at)}</td>
                  <td className="p-3">{c.locked_at ? `travado ${fmt(c.locked_at)}` : 'aberto'}</td>
                  <td className="p-3 text-right">{brl(c.paid_cents)}</td>
                  <td className="p-3 text-right">
                    <button
                      title="Remover vínculo"
                      onClick={() => window.confirm(`Remover @${c.username} deste parceiro? Comissões já registradas continuam.`) &&
                        run(() => supabase.rpc('admin_partner_detach', { p_profile_id: c.profile_id }), 'Vínculo removido.')}
                      className="brutal-btn bg-white px-2 py-1.5"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="brutal-card bg-white overflow-x-auto">
        <div className="p-5 pb-3 flex items-end justify-between gap-3 flex-wrap">
          <h2 className="font-display text-xl">Extrato</h2>
          <form
            onSubmit={e => {
              e.preventDefault();
              const cents = Math.round(Number(adjust.value.replace(',', '.')) * 100);
              run(() => supabase.rpc('admin_partner_adjust', { p_partner_id: p.id, p_cents: cents, p_note: adjust.note }), 'Ajuste lançado.')
                .then(ok => ok && setAdjust({ value: '', note: '' }));
            }}
            className="flex gap-2 items-center flex-wrap"
          >
            <input value={adjust.value} onChange={e => setAdjust({ ...adjust, value: e.target.value })} placeholder="R$ (negativo desconta)" className="brutal-input px-2 py-1.5 text-sm w-44" />
            <input value={adjust.note} onChange={e => setAdjust({ ...adjust, note: e.target.value })} placeholder="Motivo" className="brutal-input px-2 py-1.5 text-sm w-48" />
            <button disabled={busy || !adjust.value || !adjust.note.trim()} className="brutal-btn bg-bioyellow px-3 py-1.5 text-xs">Lançar ajuste</button>
          </form>
        </div>
        {d.commissions.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-black/60 border-y-2 border-black">
              <tr><th className="p-3">Data</th><th className="p-3">Tipo</th><th className="p-3">Cliente</th><th className="p-3 text-right">Valor</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody>
              {d.commissions.map(c => {
                const st = COMMISSION_STATUS[c.status];
                return (
                  <tr key={c.id} className="border-t border-black/10">
                    <td className="p-3">{fmt(c.created_at)}</td>
                    <td className="p-3">{COMMISSION_KINDS[c.kind] ?? c.kind}{c.rate !== null && c.kind === 'commission' ? ` · ${c.rate}% de ${brl(c.base_cents)}` : ''}{c.note ? ` · ${c.note}` : ''}</td>
                    <td className="p-3">{c.client ? `@${c.client}` : '—'}</td>
                    <td className={`p-3 text-right font-bold ${c.amount_cents < 0 ? 'text-biored' : ''}`}>{brl(c.amount_cents)}</td>
                    <td className="p-3"><span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 brutal-border ${st?.className ?? ''}`}>{st?.label ?? c.status}</span>{c.status === 'hold' && <span className="text-[11px] text-black/60 ml-1">libera {fmt(c.available_at)}</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {d.payouts.length > 0 && (
        <section className="brutal-card bg-white p-5">
          <h2 className="font-display text-xl mb-3">Saques</h2>
          <ul className="flex flex-col gap-1.5 text-sm">
            {d.payouts.map(po => (
              <li key={po.id}>{fmt(po.created_at)} · <b>{brl(po.amount_cents)}</b> · {po.status === 'paid' ? `pago em ${fmt(po.resolved_at)}` : po.status === 'rejected' ? 'recusado' : 'pendente'}{po.admin_note ? ` · ${po.admin_note}` : ''}</li>
            ))}
          </ul>
          <Link href="/admin/parceiros?tab=saques" className="text-xs font-bold underline mt-3 inline-block">Ir para a fila de saques</Link>
        </section>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Kpi({ label, value, hint, bg }: { label: string; value: string | number; hint: string; bg: string }) {
  return (
    <div className={`brutal-card p-5 ${bg}`}>
      <div className="text-xs font-bold uppercase">{label}</div>
      <div className="font-display text-2xl mt-2">{value}</div>
      <div className="text-xs text-black/70 mt-1">{hint}</div>
    </div>
  );
}
