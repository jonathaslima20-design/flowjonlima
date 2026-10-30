'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import {
  CalendarClock, Check, Copy, Download, ExternalLink, Handshake, KeyRound, Link2, Loader2, Pencil, Plus, Trash2, Trophy, Wallet,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCurrentPage } from '@/lib/page-context';
import { PLANS, brl, type BillingPeriod, type PaidPlanSlug } from '@/lib/plans';
import { formatWhatsapp, maskWhatsapp, whatsappLink } from '@/lib/whatsapp';
import {
  CLIENT_SOURCES, COMMISSION_KINDS, COMMISSION_STATUS, DEFAULT_PROGRAM, PARTNER_STATUS, fetchPartnerProgram, inviteLink, partnerLink,
  type PartnerProgram,
} from '@/lib/partner';
import { IconWhatsapp } from '@/lib/social-icons';

// Painel do Parceiro: resumo, clientes (com alerta de vencimento), divulgação, licenças, saques e perfil.
// Tudo vem da RPC partner_dashboard (dados do parceiro logado).

type Tier = { name: string; rate: number; custom: boolean; next_name: string | null; next_min: number | null; next_rate: number | null; active_clients: number };
type Client = {
  profile_id: string; username: string; display_name: string | null; avatar_url: string | null; plan: string; expires_at: string | null;
  trial: boolean; source: string; managed: boolean; attributed_at: string; locked_at: string | null; paid_cents: number; commission_cents: number;
  whatsapp: string | null;
};
type Commission = { id: string; kind: string; amount_cents: number; base_cents: number; rate: number | null; status: string; available_at: string; created_at: string; note: string; client: string | null };
type Payout = { id: string; amount_cents: number; status: string; created_at: string; resolved_at: string | null; admin_note: string; pix_key: string };
type Invite = { id: string; token: string; client_name: string; managed: boolean; license_id: string | null; created_at: string; expires_at: string; accepted_at: string | null; accepted_username: string | null };
type License = { id: string; plan_slug: PaidPlanSlug; period: BillingPeriod; status: string; assigned_at: string | null; created_at: string; assigned_username: string | null };
type Partner = {
  id: string; status: string; kind: string; name: string; company: string; code: string | null; coupon_code: string | null; whatsapp: string;
  channels: string; pix_key: string; pix_full_name: string;
};
type Dashboard = {
  partner: Partner; username: string; tier: Tier; discount_pct: number;
  balances: { hold: number; available: number; requested: number; paid: number };
  clicks_30d: number; clicks_total: number; signups: number; signups_30d: number; revenue_cents: number;
  monthly: { month: string; cents: number }[];
  clients: Client[]; commissions: Commission[]; payouts: Payout[]; invites: Invite[]; licenses: License[];
};

const TABS = [
  { key: 'resumo', label: 'Resumo' },
  { key: 'clientes', label: 'Clientes' },
  { key: 'divulgacao', label: 'Divulgação' },
  { key: 'licencas', label: 'Licenças' },
  { key: 'saques', label: 'Comissões e saques' },
  { key: 'perfil', label: 'Perfil' },
] as const;
type TabKey = typeof TABS[number]['key'];

const DAY = 86400000;
const daysUntil = (iso: string | null) => (iso ? Math.ceil((new Date(iso).getTime() - Date.now()) / DAY) : null);
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—');

async function copy(text: string, msg = 'Copiado!') {
  try { await navigator.clipboard.writeText(text); toast.success(msg); } catch { toast.message(text); }
}

export default function PartnerPanelPage() {
  return (
    <Suspense fallback={<div className="font-bold">Carregando...</div>}>
      <PartnerPanel />
    </Suspense>
  );
}

function PartnerPanel() {
  const params = useSearchParams();
  const router = useRouter();
  const tab = (TABS.some(t => t.key === params.get('tab')) ? params.get('tab') : 'resumo') as TabKey;
  const [data, setData] = useState<Dashboard | null | undefined>(undefined);
  const [program, setProgram] = useState<PartnerProgram>(DEFAULT_PROGRAM);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc('partner_dashboard');
    setData((data as unknown as Dashboard) ?? null);
  }, []);

  useEffect(() => { load(); fetchPartnerProgram().then(setProgram); }, [load]);

  if (data === undefined) return <div className="font-bold">Carregando...</div>;

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto">
        <section className="brutal-card bg-bioyellow p-8 text-center">
          <Handshake className="w-12 h-12 mx-auto" />
          <h1 className="font-display text-3xl mt-3">Seja parceiro BioFlowzy</h1>
          <p className="text-sm font-bold text-black/70 mt-2 max-w-lg mx-auto">
            Agências, criadores e consultores ganham comissão recorrente em cada pagamento dos clientes que trazem, com cupom de
            desconto para eles e painel completo.
          </p>
          <Link href="/parceiros" className="brutal-btn bg-black text-white px-6 py-3 mt-6 inline-flex">Conhecer o programa</Link>
        </section>
      </div>
    );
  }

  const { partner } = data;
  if (partner.status !== 'active') {
    const s = PARTNER_STATUS[partner.status];
    return (
      <div className="max-w-3xl mx-auto">
        <section className="brutal-card bg-white p-8 text-center">
          <span className={`text-xs font-bold uppercase px-2 py-1 brutal-border ${s?.className ?? ''}`}>{s?.label ?? partner.status}</span>
          <h1 className="font-display text-3xl mt-4">
            {partner.status === 'pending' ? 'Recebemos sua candidatura!' : partner.status === 'rejected' ? 'Candidatura não aprovada' : 'Parceria suspensa'}
          </h1>
          <p className="text-sm text-black/70 mt-2">
            {partner.status === 'pending'
              ? 'Vamos analisar e responder pelo WhatsApp em até 2 dias úteis. Assim que for aprovada, seu link, cupom e painel aparecem aqui.'
              : partner.status === 'rejected'
                ? 'Você pode enviar uma nova candidatura com mais detalhes sobre como pretende indicar o BioFlowzy.'
                : 'Fale com o suporte para entender o motivo e regularizar a parceria.'}
          </p>
          {partner.status === 'rejected' && <Link href="/parceiros#candidatura" className="brutal-btn bg-black text-white px-5 py-3 mt-5 inline-flex">Nova candidatura</Link>}
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wide bg-black text-white px-2 py-0.5">Parceiro {data.tier.name} · {data.tier.rate}%</span>
          <h1 className="font-display text-4xl mt-2">Painel do Parceiro</h1>
          <p className="text-sm mt-1">{partner.company || partner.name}</p>
        </div>
        <div className="flex gap-2">
          {partner.code && (
            <button onClick={() => copy(partnerLink(partner.code!), 'Link copiado!')} className="brutal-btn bg-bioyellow px-4 py-2 text-sm gap-2">
              <Link2 className="w-4 h-4" /> Copiar meu link
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => router.replace(`/dashboard/parceiro?tab=${t.key}`)}
            className={`shrink-0 px-3 py-2 brutal-border text-sm font-bold ${tab === t.key ? 'bg-black text-white' : 'bg-white hover:bg-bioyellow'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'resumo' && <Summary data={data} program={program} />}
        {tab === 'clientes' && <Clients data={data} reload={load} />}
        {tab === 'divulgacao' && <Promote data={data} program={program} />}
        {tab === 'licencas' && <Licenses data={data} program={program} reload={load} />}
        {tab === 'saques' && <Earnings data={data} program={program} reload={load} />}
        {tab === 'perfil' && <Profile data={data} reload={load} />}
      </div>
    </div>
  );
}

// ───────────── Resumo ─────────────

function Summary({ data, program }: { data: Dashboard; program: PartnerProgram }) {
  const { tier, balances } = data;
  const progress = tier.next_min ? Math.min(100, Math.round((tier.active_clients / tier.next_min) * 100)) : 100;
  const expiring = data.clients
    .filter(c => c.plan !== 'free' && c.expires_at && (daysUntil(c.expires_at) ?? 99) <= 15)
    .sort((a, b) => new Date(a.expires_at!).getTime() - new Date(b.expires_at!).getTime());
  const max = Math.max(...data.monthly.map(m => m.cents), 1);
  const nextBonus = program.bonuses.filter(b => b.clients > tier.active_clients).sort((a, b) => a.clients - b.clients)[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Clientes pagantes" value={tier.active_clients} hint={`${data.signups} cadastro(s) no total`} bg="bg-biolime" />
        <Kpi label="Cadastros (30 dias)" value={data.signups_30d} hint={`${data.clicks_30d} clique(s) no seu link`} bg="bg-white" />
        <Kpi label="Disponível para saque" value={brl(balances.available)} hint={`${brl(balances.hold)} a liberar`} bg="bg-bioyellow" />
        <Kpi label="Vendas geradas" value={brl(data.revenue_cents)} hint={`${brl(balances.paid)} já pago a você`} bg="bg-white" />
      </div>

      <section className="brutal-card bg-white p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-display text-xl inline-flex items-center gap-2"><Trophy className="w-5 h-5" /> Nível {tier.name} · {tier.rate}%{tier.custom ? ' (condição especial)' : ''}</h2>
          {tier.next_name && <span className="text-sm font-bold">Faltam {tier.next_min! - tier.active_clients} cliente(s) para {tier.next_name} ({tier.next_rate}%)</span>}
        </div>
        <div className="h-4 brutal-border bg-white mt-3"><div className="h-full bg-black" style={{ width: `${progress}%` }} /></div>
        {nextBonus && (
          <p className="text-xs font-bold text-black/70 mt-2">Próximo bônus: {brl(nextBonus.cents)} ao chegar a {nextBonus.clients} clientes pagantes.</p>
        )}
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="brutal-card bg-white p-5">
          <h2 className="font-display text-xl mb-4">Comissões por mês</h2>
          <div className="flex items-end gap-2 h-40">
            {data.monthly.map(m => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold">{m.cents ? brl(m.cents) : ''}</span>
                <div className="w-full brutal-border bg-bioblue" style={{ height: `${Math.max(2, (m.cents / max) * 110)}px` }} />
                <span className="text-[10px] font-bold uppercase">{new Date(`${m.month}-15`).toLocaleDateString('pt-BR', { month: 'short' })}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="brutal-card bg-white p-5">
          <h2 className="font-display text-xl mb-1 inline-flex items-center gap-2"><CalendarClock className="w-5 h-5" /> Vencendo em breve</h2>
          <p className="text-xs text-black/60 mb-3">Sem renovação automática: um lembrete seu garante a renovação (e a sua comissão).</p>
          {expiring.length === 0 ? (
            <p className="text-sm text-black/60">Nenhum cliente vencendo nos próximos 15 dias.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {expiring.slice(0, 8).map(c => <ExpiringRow key={c.profile_id} client={c} />)}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function renewalText(c: Client) {
  const d = daysUntil(c.expires_at);
  const when = d === null ? '' : d <= 0 ? 'venceu' : d === 1 ? 'vence amanhã' : `vence em ${d} dias`;
  return c.trial
    ? `Oi! O teste do plano Pro da sua página bioflowzy.com/${c.username} ${when}. Quer continuar com os recursos Pro? Te ajudo a assinar.`
    : `Oi! O plano da sua página bioflowzy.com/${c.username} ${when}. A renovação não é automática: renove pelo painel para não perder os recursos.`;
}

function ExpiringRow({ client: c }: { client: Client }) {
  const d = daysUntil(c.expires_at) ?? 0;
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <div className="min-w-0">
        <a href={`/${c.username}`} target="_blank" rel="noreferrer" className="font-bold underline truncate block">/{c.username}</a>
        <span className="text-xs text-black/60">{c.trial ? 'Teste' : PLANS[c.plan as PaidPlanSlug]?.name ?? c.plan} · {d <= 0 ? 'vencido' : `vence em ${d} dia(s)`}</span>
      </div>
      {c.whatsapp ? (
        <a href={whatsappLink(c.whatsapp, renewalText(c)) ?? undefined} target="_blank" rel="noopener noreferrer" className="brutal-btn bg-white px-3 py-1.5 text-xs gap-1.5 shrink-0">
          <IconWhatsapp className="w-4 h-4 text-green-600" /> Lembrar
        </a>
      ) : (
        <button onClick={() => copy(renewalText(c), 'Mensagem copiada!')} className="brutal-btn bg-white px-3 py-1.5 text-xs gap-1.5 shrink-0"><Copy className="w-3.5 h-3.5" /> Mensagem</button>
      )}
    </li>
  );
}

// ───────────── Clientes ─────────────

function Clients({ data, reload }: { data: Dashboard; reload: () => Promise<void> }) {
  const router = useRouter();
  const { reloadPages, setPageId } = useCurrentPage();
  const [filter, setFilter] = useState<'all' | 'paying' | 'trial' | 'free'>('all');
  const [showInvite, setShowInvite] = useState(false);

  const list = data.clients.filter(c =>
    filter === 'all' ? true : filter === 'trial' ? c.trial : filter === 'paying' ? c.plan !== 'free' && !c.trial : c.plan === 'free');

  async function editPage(id: string) {
    await reloadPages();
    setPageId(id);
    router.push('/dashboard/links');
  }

  async function removeInvite(id: string) {
    await supabase.from('partner_invites').delete().eq('id', id);
    reload();
  }

  const openInvites = data.invites.filter(i => !i.accepted_at && new Date(i.expires_at) > new Date());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex brutal-border bg-white p-1 gap-1">
          {([['all', 'Todos'], ['paying', 'Pagantes'], ['trial', 'Em teste'], ['free', 'Free']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1.5 text-xs font-bold ${filter === k ? 'bg-black text-white' : ''}`}>{l}</button>
          ))}
        </div>
        <button onClick={() => setShowInvite(true)} className="brutal-btn bg-black text-white px-4 py-2 text-sm gap-2"><Plus className="w-4 h-4" /> Novo cliente</button>
      </div>

      {showInvite && <InviteForm data={data} onClose={() => setShowInvite(false)} onCreated={reload} />}

      {openInvites.length > 0 && (
        <section className="brutal-card bg-white p-5">
          <h2 className="font-display text-lg mb-3">Convites abertos</h2>
          <ul className="flex flex-col gap-2">
            {openInvites.map(i => (
              <li key={i.id} className="flex items-center justify-between gap-3 text-sm flex-wrap">
                <span><b>{i.client_name || 'Sem nome'}</b> · {i.managed ? 'gerenciado' : 'indicação'}{i.license_id ? ' · com licença' : ''} · expira em {fmtDate(i.expires_at)}</span>
                <span className="flex gap-2">
                  <button onClick={() => copy(inviteLink(i.token), 'Link do convite copiado!')} className="brutal-btn bg-bioyellow px-3 py-1.5 text-xs gap-1.5"><Copy className="w-3.5 h-3.5" /> Copiar link</button>
                  <button onClick={() => removeInvite(i.id)} aria-label="Excluir convite" className="brutal-btn bg-white px-2 py-1.5"><Trash2 className="w-3.5 h-3.5" /></button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="brutal-card bg-white overflow-x-auto">
        {list.length === 0 ? (
          <p className="p-6 text-sm text-black/60">
            {data.clients.length === 0 ? 'Nenhum cliente ainda. Compartilhe seu link ou crie um convite em "Novo cliente".' : 'Nenhum cliente neste filtro.'}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-black/60 border-b-2 border-black">
              <tr><th className="p-3">Página</th><th className="p-3">Plano</th><th className="p-3">Vence</th><th className="p-3 hidden md:table-cell">Origem</th><th className="p-3 text-right">Pago</th><th className="p-3 text-right">Sua comissão</th><th className="p-3" /></tr>
            </thead>
            <tbody>
              {list.map(c => {
                const d = daysUntil(c.expires_at);
                return (
                  <tr key={c.profile_id} className="border-t border-black/10">
                    <td className="p-3">
                      <a href={`/${c.username}`} target="_blank" rel="noreferrer" className="font-bold underline">/{c.username}</a>
                      {c.managed && <span className="ml-2 text-[10px] font-bold uppercase bg-biolime px-1.5 py-0.5 brutal-border">gerenciado</span>}
                    </td>
                    <td className="p-3">{c.trial ? <span className="font-bold">Teste Pro</span> : c.plan === 'free' ? 'Free' : PLANS[c.plan as PaidPlanSlug]?.name ?? c.plan}</td>
                    <td className={`p-3 ${d !== null && d <= 7 && c.plan !== 'free' ? 'font-bold text-biored' : ''}`}>{c.plan === 'free' ? '—' : fmtDate(c.expires_at)}</td>
                    <td className="p-3 hidden md:table-cell">{CLIENT_SOURCES[c.source] ?? c.source}</td>
                    <td className="p-3 text-right">{brl(c.paid_cents)}</td>
                    <td className="p-3 text-right font-bold">{brl(c.commission_cents)}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1.5">
                        {c.managed && (
                          <button onClick={() => editPage(c.profile_id)} title="Editar página" className="brutal-btn bg-white px-2 py-1.5"><Pencil className="w-3.5 h-3.5" /></button>
                        )}
                        {c.whatsapp && (
                          <a href={whatsappLink(c.whatsapp) ?? undefined} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="brutal-btn bg-white px-2 py-1.5">
                            <IconWhatsapp className="w-3.5 h-3.5 text-green-600" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
      <p className="text-[11px] text-black/50">O WhatsApp aparece para clientes que chegaram por convite, cupom, licença ou vínculo manual.</p>
    </div>
  );
}

function InviteForm({ data, onClose, onCreated }: { data: Dashboard; onClose: () => void; onCreated: () => Promise<void> }) {
  const [name, setName] = useState('');
  const [managed, setManaged] = useState(true);
  const [licenseId, setLicenseId] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const reserved = new Set(data.invites.filter(i => !i.accepted_at && i.license_id).map(i => i.license_id));
  const free = data.licenses.filter(l => l.status === 'available' && !reserved.has(l.id));

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data: inv, error } = await supabase.rpc('partner_create_invite', {
      p_client_name: name, p_managed: managed, p_license_id: licenseId || undefined,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setCreated((inv as { token: string }).token);
    onCreated();
  }

  if (created) {
    const url = inviteLink(created);
    const text = `Oi${name ? ` ${name}` : ''}! Criei seu acesso ao BioFlowzy para montarmos sua página de link na bio. Crie sua conta por aqui: ${url}`;
    return (
      <section className="brutal-card bg-biolime p-5">
        <h2 className="font-display text-xl">Convite criado!</h2>
        <p className="text-sm text-black/70 mt-1 mb-3">Envie o link ao cliente. Ao criar a conta por ele, o cliente fica ligado a você{managed ? ' e a página dele aparece no seu seletor de páginas' : ''}.</p>
        <div className="flex gap-2 flex-wrap">
          <input readOnly value={url} onFocus={e => e.target.select()} className="flex-1 min-w-0 brutal-input px-3 py-2 text-xs font-mono bg-white" />
          <button onClick={() => copy(url, 'Link copiado!')} className="brutal-btn bg-bioyellow px-3 py-2 text-sm gap-1.5"><Copy className="w-4 h-4" /> Copiar</button>
          <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className="brutal-btn bg-white px-3 py-2 text-sm gap-1.5"><IconWhatsapp className="w-4 h-4 text-green-600" /> WhatsApp</a>
          <button onClick={onClose} className="brutal-btn bg-white px-3 py-2 text-sm">Fechar</button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={create} className="brutal-card bg-white p-5 grid sm:grid-cols-2 gap-3">
      <h2 className="font-display text-xl sm:col-span-2">Novo cliente</h2>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider">Nome do cliente</span>
        <input value={name} onChange={e => setName(e.target.value)} maxLength={120} className="w-full brutal-input px-3 py-2.5 text-sm mt-1" placeholder="Ex.: Padaria da Ana" />
      </label>
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider">Licença (opcional)</span>
        <select value={licenseId} onChange={e => setLicenseId(e.target.value)} className="w-full brutal-input px-3 py-2.5 text-sm mt-1 bg-white">
          <option value="">Sem licença (cliente paga ou fica no Free)</option>
          {free.map(l => <option key={l.id} value={l.id}>{PLANS[l.plan_slug].name} {l.period === 'annual' ? 'anual' : 'trimestral'}</option>)}
        </select>
      </label>
      <label className="sm:col-span-2 flex items-start gap-2 text-sm">
        <input type="checkbox" checked={managed} onChange={e => setManaged(e.target.checked)} className="mt-1" />
        <span><b>Cliente gerenciado:</b> eu monto e edito a página dele pelo meu painel (o cliente pode remover meu acesso quando quiser).</span>
      </label>
      <div className="sm:col-span-2 flex gap-2">
        <button disabled={busy} className="brutal-btn bg-black text-white px-5 py-2.5 text-sm gap-2">{busy && <Loader2 className="w-4 h-4 animate-spin" />} Gerar convite</button>
        <button type="button" onClick={onClose} className="brutal-btn bg-white px-5 py-2.5 text-sm">Cancelar</button>
      </div>
    </form>
  );
}

// ───────────── Divulgação ─────────────

function Promote({ data, program }: { data: Dashboard; program: PartnerProgram }) {
  const { partner, discount_pct } = data;
  const link = partner.code ? partnerLink(partner.code) : '';
  const [qr, setQr] = useState('');
  useEffect(() => {
    if (link) QRCode.toDataURL(link, { width: 600, margin: 2 }).then(setQr).catch(() => setQr(''));
  }, [link]);

  const texts = useMemo(() => [
    {
      title: 'Bio do Instagram / stories',
      text: `Sua bio com WhatsApp, links, catálogo e muito mais em um só link 👉 ${link}${partner.coupon_code ? ` · use o cupom ${partner.coupon_code} e ganhe ${discount_pct}% off` : ''}`,
    },
    {
      title: 'Mensagem para clientes',
      text: `Oi! Estou indicando o BioFlowzy para montar sua página de link na bio: WhatsApp, redes, cardápio/catálogo, captura de contatos e relatórios de cliques. ${program.trial_days > 0 ? `Pelo meu link você testa o Pro por ${program.trial_days} dias grátis` : 'Crie grátis pelo meu link'}: ${link}`,
    },
    {
      title: 'Post / legenda',
      text: `Chega de link solto na bio. Com o BioFlowzy você junta WhatsApp, loja, agenda e redes numa página bonita, com seu domínio e relatório de quem clicou. Crie a sua: ${link}${partner.coupon_code ? `\nCupom ${partner.coupon_code}: ${discount_pct}% de desconto no primeiro pagamento.` : ''}`,
    },
  ], [link, partner.coupon_code, discount_pct, program.trial_days]);

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      <div className="flex flex-col gap-6">
        <section className="brutal-card bg-bioyellow p-5">
          <h2 className="font-display text-xl">Seu link e seu cupom</h2>
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            <div className="brutal-border bg-white p-3">
              <p className="text-[10px] font-bold uppercase text-black/60">Link (vale {program.cookie_days} dias)</p>
              <p className="font-mono text-sm font-bold break-all">{link}</p>
              <button onClick={() => copy(link, 'Link copiado!')} className="mt-2 text-xs font-bold underline inline-flex items-center gap-1"><Copy className="w-3 h-3" /> Copiar</button>
            </div>
            <div className="brutal-border bg-white p-3">
              <p className="text-[10px] font-bold uppercase text-black/60">Cupom · {discount_pct}% no 1º pagamento</p>
              <p className="font-mono text-lg font-bold break-all">{partner.coupon_code}</p>
              <button onClick={() => copy(partner.coupon_code ?? '', 'Cupom copiado!')} className="mt-2 text-xs font-bold underline inline-flex items-center gap-1"><Copy className="w-3 h-3" /> Copiar</button>
            </div>
          </div>
          <p className="text-xs font-bold text-black/70 mt-3">
            Quem entra pelo link já recebe o desconto no checkout{program.trial_days > 0 ? ` e ${program.trial_days} dias de Pro grátis` : ''}. O cupom serve para vendas por WhatsApp ou presenciais.
          </p>
        </section>

        <section className="brutal-card bg-white p-5">
          <h2 className="font-display text-xl mb-3">Textos prontos</h2>
          <div className="flex flex-col gap-3">
            {texts.map(t => (
              <div key={t.title} className="brutal-border p-3">
                <div className="flex justify-between items-center gap-2">
                  <p className="text-xs font-bold uppercase">{t.title}</p>
                  <button onClick={() => copy(t.text, 'Texto copiado!')} className="text-xs font-bold underline inline-flex items-center gap-1"><Copy className="w-3 h-3" /> Copiar</button>
                </div>
                <p className="text-sm text-black/75 mt-1 whitespace-pre-line">{t.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="brutal-card bg-white p-5">
          <h2 className="font-display text-xl mb-2">Páginas de exemplo para mostrar</h2>
          <p className="text-sm text-black/70 mb-3">Use os exemplos por nicho para mostrar ao cliente como a página dele pode ficar.</p>
          <a href="/exemplos" target="_blank" rel="noopener noreferrer" className="brutal-btn bg-white px-4 py-2 text-sm gap-2 inline-flex"><ExternalLink className="w-4 h-4" /> Ver exemplos</a>
        </section>
      </div>

      <section className="brutal-card bg-white p-5 h-fit text-center">
        <h2 className="font-display text-xl">QR code do seu link</h2>
        <p className="text-xs text-black/60 mt-1 mb-3">Para cartões, panfletos e apresentações.</p>
        {qr ? <img src={qr} alt="QR code do link de parceiro" className="w-full brutal-border" /> : <div className="aspect-square bg-neutral-100 animate-pulse" />}
        {qr && (
          <a href={qr} download={`qrcode-parceiro-${partner.code}.png`} className="brutal-btn bg-black text-white px-4 py-2 text-sm gap-2 mt-3 inline-flex"><Download className="w-4 h-4" /> Baixar PNG</a>
        )}
      </section>
    </div>
  );
}

// ───────────── Licenças ─────────────

function Licenses({ data, program, reload }: { data: Dashboard; program: PartnerProgram; reload: () => Promise<void> }) {
  const router = useRouter();
  const [plan, setPlan] = useState<PaidPlanSlug>('pro');
  const [period, setPeriod] = useState<BillingPeriod>('annual');
  const [qty, setQty] = useState(Math.max(program.wholesale_min_qty, 10));
  const [assigning, setAssigning] = useState<Record<string, string>>({});
  const available = data.licenses.filter(l => l.status === 'available');
  const assigned = data.licenses.filter(l => l.status === 'assigned');
  const unit = Math.round(PLANS[plan].prices[period] * (100 - program.wholesale_discount_pct) / 100);

  async function assign(licenseId: string) {
    const profileId = assigning[licenseId];
    if (!profileId) return;
    const { error } = await supabase.rpc('partner_assign_license', { p_license_id: licenseId, p_profile_id: profileId });
    if (error) { toast.error(error.message); return; }
    toast.success('Licença aplicada! O plano do cliente já está ativo.');
    reload();
  }

  if (!program.wholesale_enabled && data.licenses.length === 0) {
    return <p className="brutal-card bg-white p-6 text-sm font-bold">A compra de licenças está indisponível no momento.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {program.wholesale_enabled && (
        <section className="brutal-card bg-biolime p-5">
          <h2 className="font-display text-xl inline-flex items-center gap-2"><KeyRound className="w-5 h-5" /> Comprar licenças com {program.wholesale_discount_pct}% off</h2>
          <p className="text-sm text-black/70 mt-1">Compre pacotes para seus clientes e cobre deles como quiser (no seu pacote de serviços, por exemplo). Licença não gera comissão: o ganho está no desconto.</p>
          <div className="mt-4 flex flex-wrap gap-2 items-end">
            <div className="inline-flex brutal-border bg-white p-1 gap-1">
              {(['pro', 'business'] as PaidPlanSlug[]).map(p => (
                <button key={p} onClick={() => setPlan(p)} className={`px-3 py-1.5 text-xs font-bold ${plan === p ? 'bg-black text-white' : ''}`}>{PLANS[p].name}</button>
              ))}
            </div>
            <div className="inline-flex brutal-border bg-white p-1 gap-1">
              {(['quarterly', 'annual'] as BillingPeriod[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 text-xs font-bold ${period === p ? 'bg-black text-white' : ''}`}>{p === 'annual' ? 'Anual' : 'Trimestral'}</button>
              ))}
            </div>
            <label className="text-xs font-bold uppercase">
              Quantidade
              <input type="number" min={program.wholesale_min_qty} max={500} value={qty} onChange={e => setQty(Math.max(1, Math.min(500, Number(e.target.value) || 0)))} className="block w-24 brutal-input px-2 py-1.5 text-sm mt-1" />
            </label>
            <div className="ml-auto text-right">
              <p className="text-xs font-bold line-through text-black/50">{brl(PLANS[plan].prices[period] * qty)}</p>
              <p className="font-display text-2xl">{brl(unit * qty)}</p>
              <p className="text-[11px] font-bold">{brl(unit)} por licença</p>
            </div>
          </div>
          {qty < program.wholesale_min_qty && <p className="text-xs font-bold text-biored mt-2">Mínimo de {program.wholesale_min_qty} licenças.</p>}
          <button
            disabled={qty < program.wholesale_min_qty}
            onClick={() => router.push(`/dashboard/checkout?kind=license&plan=${plan}&period=${period}&qty=${qty}`)}
            className="brutal-btn bg-black text-white px-5 py-2.5 text-sm mt-4 disabled:opacity-50"
          >
            Comprar {qty} licenças
          </button>
        </section>
      )}

      <section className="brutal-card bg-white p-5">
        <h2 className="font-display text-xl mb-1">Licenças disponíveis ({available.length})</h2>
        <p className="text-xs text-black/60 mb-3">Aplique a um cliente seu (o plano começa na hora) ou escolha a licença ao criar um convite.</p>
        {available.length === 0 ? (
          <p className="text-sm text-black/60">Nenhuma licença disponível.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {available.map(l => (
              <li key={l.id} className="flex items-center gap-2 flex-wrap text-sm">
                <span className="font-bold w-40">{PLANS[l.plan_slug].name} {l.period === 'annual' ? 'anual' : 'trimestral'}</span>
                <select value={assigning[l.id] ?? ''} onChange={e => setAssigning(a => ({ ...a, [l.id]: e.target.value }))} className="brutal-input px-2 py-1.5 text-sm bg-white">
                  <option value="">Escolha o cliente</option>
                  {data.clients.map(c => <option key={c.profile_id} value={c.profile_id}>/{c.username}</option>)}
                </select>
                <button onClick={() => assign(l.id)} disabled={!assigning[l.id]} className="brutal-btn bg-black text-white px-3 py-1.5 text-xs disabled:opacity-50">Aplicar</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {assigned.length > 0 && (
        <section className="brutal-card bg-white p-5">
          <h2 className="font-display text-xl mb-3">Licenças usadas ({assigned.length})</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {assigned.map(l => (
              <li key={l.id}>{PLANS[l.plan_slug].name} {l.period === 'annual' ? 'anual' : 'trimestral'} → <b>/{l.assigned_username}</b> em {fmtDate(l.assigned_at)}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// ───────────── Comissões e saques ─────────────

function Earnings({ data, program, reload }: { data: Dashboard; program: PartnerProgram; reload: () => Promise<void> }) {
  const router = useRouter();
  const { balances, partner } = data;
  const [busy, setBusy] = useState(false);
  const canWithdraw = balances.available >= program.min_payout_cents;
  const hasPix = !!partner.pix_key && !!partner.pix_full_name;

  async function withdraw() {
    setBusy(true);
    const { error } = await supabase.rpc('partner_request_payout');
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Saque solicitado! O PIX é feito em até 5 dias úteis.');
    reload();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="A liberar" value={brl(balances.hold)} hint={`carência de ${program.hold_days} dias`} bg="bg-white" />
        <Kpi label="Disponível" value={brl(balances.available)} hint={`saque a partir de ${brl(program.min_payout_cents)}`} bg="bg-biolime" />
        <Kpi label="Em saque" value={brl(balances.requested)} hint="aguardando o PIX" bg="bg-white" />
        <Kpi label="Já recebido" value={brl(balances.paid)} hint="total pago a você" bg="bg-bioyellow" />
      </div>

      <section className="brutal-card bg-white p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl inline-flex items-center gap-2"><Wallet className="w-5 h-5" /> Sacar por PIX</h2>
          <p className="text-sm text-black/70">{hasPix ? `Chave: ${partner.pix_key} (${partner.pix_full_name})` : 'Cadastre sua chave PIX na aba Perfil.'}</p>
        </div>
        {hasPix ? (
          <button onClick={withdraw} disabled={!canWithdraw || busy} className="brutal-btn bg-black text-white px-5 py-2.5 text-sm gap-2 disabled:opacity-50">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Sacar {brl(Math.max(0, balances.available))}
          </button>
        ) : (
          <button onClick={() => router.replace('/dashboard/parceiro?tab=perfil')} className="brutal-btn bg-bioyellow px-5 py-2.5 text-sm">Cadastrar PIX</button>
        )}
      </section>

      <section className="brutal-card bg-white overflow-x-auto">
        <h2 className="font-display text-xl p-5 pb-2">Extrato</h2>
        {data.commissions.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-black/60">As comissões aparecem aqui assim que um cliente seu pagar.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-black/60 border-b-2 border-black">
              <tr><th className="p-3">Data</th><th className="p-3">Tipo</th><th className="p-3">Cliente</th><th className="p-3 text-right">Valor</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody>
              {data.commissions.map(c => {
                const s = COMMISSION_STATUS[c.status];
                return (
                  <tr key={c.id} className="border-t border-black/10">
                    <td className="p-3">{fmtDate(c.created_at)}</td>
                    <td className="p-3">
                      {COMMISSION_KINDS[c.kind] ?? c.kind}
                      {c.kind === 'commission' && c.rate !== null && <span className="text-xs text-black/60"> · {c.rate}% de {brl(c.base_cents)}</span>}
                      {c.kind === 'adjustment' && c.note && <span className="text-xs text-black/60"> · {c.note}</span>}
                    </td>
                    <td className="p-3">{c.client ? `/${c.client}` : '—'}</td>
                    <td className={`p-3 text-right font-bold ${c.amount_cents < 0 ? 'text-biored' : ''}`}>{brl(c.amount_cents)}</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 brutal-border ${s?.className ?? ''}`}>{s?.label ?? c.status}</span>
                      {c.status === 'hold' && <span className="text-[11px] text-black/60 ml-1">libera {fmtDate(c.available_at)}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {data.payouts.length > 0 && (
        <section className="brutal-card bg-white p-5">
          <h2 className="font-display text-xl mb-3">Saques</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {data.payouts.map(p => (
              <li key={p.id} className="flex justify-between gap-3 flex-wrap">
                <span>{fmtDate(p.created_at)} · <b>{brl(p.amount_cents)}</b>{p.admin_note ? ` · ${p.admin_note}` : ''}</span>
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 brutal-border ${p.status === 'paid' ? 'bg-biolime' : p.status === 'rejected' ? 'bg-red-100' : 'bg-bioyellow'}`}>
                  {p.status === 'paid' ? `Pago ${fmtDate(p.resolved_at)}` : p.status === 'rejected' ? 'Recusado' : 'Pendente'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// ───────────── Perfil ─────────────

function Profile({ data, reload }: { data: Dashboard; reload: () => Promise<void> }) {
  const p = data.partner;
  const [form, setForm] = useState({
    pix_key: p.pix_key, pix_full_name: p.pix_full_name, whatsapp: formatWhatsapp(p.whatsapp), channels: p.channels,
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.rpc('partner_update_profile', { p: form });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    reload();
  }

  const input = (k: keyof typeof form, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input
      value={String(form[k])}
      onChange={e => setForm(f => ({ ...f, [k]: k === 'whatsapp' ? maskWhatsapp(e.target.value) : e.target.value }))}
      className="w-full brutal-input px-3 py-2.5 text-sm mt-1"
      {...props}
    />
  );

  return (
    <form onSubmit={save} className="grid lg:grid-cols-2 gap-6">
      <section className="brutal-card bg-white p-5 flex flex-col gap-3">
        <h2 className="font-display text-xl">Pagamento e contato</h2>
        <label className="block"><span className="text-xs font-bold uppercase tracking-wider">Nome completo do titular do PIX</span>{input('pix_full_name', { maxLength: 140 })}</label>
        <label className="block"><span className="text-xs font-bold uppercase tracking-wider">Chave PIX</span>{input('pix_key', { maxLength: 140, placeholder: 'CPF, CNPJ, e-mail, telefone ou chave aleatória' })}</label>
        <label className="block"><span className="text-xs font-bold uppercase tracking-wider">WhatsApp</span>{input('whatsapp', { inputMode: 'numeric' })}</label>
        <label className="block"><span className="text-xs font-bold uppercase tracking-wider">Onde você divulga</span>{input('channels', { maxLength: 500 })}</label>
      </section>

      <section className="brutal-card bg-bioyellow p-5 flex flex-col gap-2 text-sm h-fit">
        <h2 className="font-display text-xl">Sua parceria</h2>
        <p><b>Nome:</b> {p.name}{p.company ? ` · ${p.company}` : ''}</p>
        <p><b>Link:</b> {p.code ? partnerLink(p.code) : '—'}</p>
        <p><b>Cupom:</b> {p.coupon_code ?? '—'} ({data.discount_pct}% no 1º pagamento)</p>
        <p className="text-xs text-black/70 mt-1">Para mudar nome, documento ou condições, fale com o suporte.</p>
      </section>

      <div className="lg:col-span-2">
        <button disabled={busy} className="brutal-btn bg-black text-white px-6 py-3 gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null} {saved ? 'Salvo' : 'Salvar'}
        </button>
      </div>
    </form>
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
