'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Ban, CircleCheck, Crown, ExternalLink, Shield, ShieldOff, Copy, Check, Globe, Eye, MousePointerClick,
  Inbox, Wallet, Users, Link2, Layers, Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { brl, isPlanSlug, planLabel } from '@/lib/plans';
import { IconWhatsapp } from '@/lib/social-icons';
import { formatWhatsapp, whatsappLink } from '@/lib/whatsapp';
import { lastSeenLabel } from '@/lib/last-seen';
import { PlanEditDialog } from '@/components/admin/users/PlanEditDialog';
import { UserAccountActions } from '@/components/admin/users/UserAccountActions';
import { UserNotes, UserTags } from '@/components/admin/users/UserNotes';
import { UserTimeline } from '@/components/admin/users/UserTimeline';

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  plan: string | null;
  plan_expires_at: string | null;
  plan_started_at: string | null;
  referral_code: string | null;
  role: string | null;
  suspended_at: string | null;
  created_at: string | null;
  theme: string | null;
  signup_source: string | null;
  signup_campaign: string | null;
  owner_id: string | null;
};

type PageRow = {
  id: string; username: string; display_name: string | null; avatar_url: string | null; theme: string | null;
  is_main: boolean; created_at: string; links: number; views_30d: number;
};

type Overview = {
  email: string | null;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  last_seen_at: string | null;
  providers: string[];
  whatsapp: string | null;
  commission_balance: number;
  has_pix: boolean;
  referred_by: string | null;
  custom_domain: { domain: string; verified: boolean } | null;
  counts: { links: number; socials: number; videos: number; banners: number; leads: number; members: number };
  views_30d: number;
  clicks_30d: number;
  views_total: number;
  paid_cents: number;
  payments_approved: number;
  referrals: number;
  referrals_paid: number;
  commission_total: number;
  pages: PageRow[];
};

type Payment = {
  id: string; plan_slug: string; period: string | null; amount_cents: number; status: string; provider: string | null;
  mp_payment_id: string | null; mp_status_detail: string | null; paid_at: string | null; plan_granted_until: string | null; created_at: string | null;
};

const TABS = [
  { key: 'overview', label: 'Visão geral' },
  { key: 'pages', label: 'Páginas' },
  { key: 'payments', label: 'Pagamentos' },
  { key: 'timeline', label: 'Linha do tempo' },
  { key: 'notes', label: 'Notas' },
] as const;
type TabKey = typeof TABS[number]['key'];

const PAYMENT_STATUS: Record<string, { label: string; cls: string }> = {
  approved: { label: 'Aprovado', cls: 'bg-biolime' },
  pending: { label: 'Pendente', cls: 'bg-bioyellow' },
  in_process: { label: 'Em análise', cls: 'bg-bioyellow' },
  rejected: { label: 'Recusado', cls: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelado', cls: 'bg-gray-100 text-gray-500' },
  refunded: { label: 'Estornado', cls: 'bg-gray-100 text-gray-500' },
  charged_back: { label: 'Contestado', cls: 'bg-red-100 text-red-700' },
};

const fmtDate = (v: string | null | undefined, time = false) =>
  v ? new Date(v).toLocaleString('pt-BR', time ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' }) : '—';

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('overview');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [adminNames, setAdminNames] = useState<Record<string, string>>({});
  const [planEdit, setPlanEdit] = useState(false);
  const [confirm, setConfirm] = useState<'suspend' | 'role' | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [timelineKey, setTimelineKey] = useState(0);
  const [copied, setCopied] = useState('');

  const load = useCallback(async () => {
    const [{ data: p }, { data: ov }, { data: pays }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url, plan, plan_expires_at, plan_started_at, referral_code, role, suspended_at, created_at, theme, signup_source, signup_campaign, owner_id')
        .eq('id', id)
        .maybeSingle(),
      supabase.rpc('admin_user_overview', { p_profile_id: id }),
      supabase
        .from('payments')
        .select('id, plan_slug, period, amount_cents, status, provider, mp_payment_id, mp_status_detail, paid_at, plan_granted_until, created_at')
        .eq('profile_id', id)
        .order('created_at', { ascending: false }),
    ]);
    if (!p) { setNotFound(true); return; }
    // Página extra (Business): abre a conta dona
    if (p.owner_id) { router.replace(`/admin/users/${p.owner_id}`); return; }
    setProfile(p);
    setOverview(ov as unknown as Overview);
    setPayments(pays ?? []);
    setTimelineKey(k => k + 1);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAdminId(data.user?.id ?? ''));
    supabase.from('profiles').select('id, username').eq('role', 'admin').is('owner_id', null)
      .then(({ data }) => setAdminNames(Object.fromEntries((data ?? []).map(a => [a.id, a.username]))));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function logAction(action: string, details: Record<string, string | null> = {}) {
    await supabase.from('admin_audit_log').insert({ admin_id: adminId, action, target_type: 'profile', target_id: id, details });
  }

  async function toggleSuspend() {
    if (!profile) return;
    setBusy(true);
    const value = profile.suspended_at ? null : new Date().toISOString();
    const { error } = await supabase.from('profiles').update({ suspended_at: value }).eq('id', id);
    if (!error) await logAction(value ? 'suspend_user' : 'unsuspend_user');
    setBusy(false);
    setConfirm(null);
    if (error) { setToast(error.message); return; }
    setToast(value ? 'Conta suspensa.' : 'Conta reativada.');
    load();
  }

  async function toggleRole() {
    if (!profile) return;
    setBusy(true);
    const role = profile.role === 'admin' ? 'user' : 'admin';
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (!error) await logAction(role === 'admin' ? 'promote_admin' : 'demote_admin');
    setBusy(false);
    setConfirm(null);
    if (error) { setToast(error.message); return; }
    setToast(role === 'admin' ? 'Promovido a admin.' : 'Removido de admin.');
    load();
  }

  function copy(value: string, key: string) {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  }

  if (notFound) {
    return (
      <div className="p-6 md:p-8">
        <Link href="/admin/users" className="text-sm font-bold inline-flex items-center gap-1 mb-4"><ArrowLeft className="w-4 h-4" /> Usuários</Link>
        <p className="text-gray-500">Usuário não encontrado (pode ter sido excluído).</p>
      </div>
    );
  }

  if (!profile || !overview) {
    return <div className="p-12 text-center font-bold text-gray-400 animate-pulse">Carregando...</div>;
  }

  const slug = isPlanSlug(profile.plan) ? profile.plan : 'free';
  const expired = slug !== 'free' && profile.plan_expires_at && new Date(profile.plan_expires_at) < new Date();
  const isAdmin = profile.role === 'admin';
  const ctr = overview.views_30d ? Math.round((overview.clicks_30d / overview.views_30d) * 1000) / 10 : 0;
  const greeting = `Olá, ${profile.display_name || profile.username}! Aqui é da equipe BioFlowzy.`;

  const kpis = [
    { label: 'Visitas (30 dias)', value: overview.views_30d.toLocaleString('pt-BR'), icon: Eye },
    { label: 'Cliques (30 dias)', value: `${overview.clicks_30d.toLocaleString('pt-BR')}${overview.views_30d ? ` · ${ctr}%` : ''}`, icon: MousePointerClick },
    { label: 'Leads', value: overview.counts.leads.toLocaleString('pt-BR'), icon: Inbox },
    { label: 'Total pago', value: brl(overview.paid_cents), icon: Wallet },
    { label: 'Indicações', value: `${overview.referrals}${overview.referrals_paid ? ` · ${overview.referrals_paid} pagas` : ''}`, icon: Users },
    { label: 'Saldo de comissão', value: brl(overview.commission_balance), icon: Wallet },
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <Link href="/admin/users" className="text-sm font-bold inline-flex items-center gap-1 mb-4 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Usuários
      </Link>

      {/* Cabeçalho */}
      <div className="brutal-card p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover brutal-border shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-100 brutal-border flex items-center justify-center font-display text-2xl shrink-0">
                {(profile.display_name || profile.username)[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl leading-tight truncate">{profile.display_name || profile.username}</h1>
                <span className={`text-[10px] font-bold px-2 py-0.5 brutal-border ${slug === 'business' ? 'bg-black text-white' : slug === 'pro' ? 'bg-bioyellow' : 'bg-white text-gray-500'}`}>
                  {planLabel(slug).toUpperCase()}{expired ? ' · VENCIDO' : ''}
                </span>
                {isAdmin && <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5">ADMIN</span>}
                {profile.suspended_at
                  ? <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 border border-red-300">SUSPENSO</span>
                  : <span className="text-[10px] font-bold text-green-700">ATIVO</span>}
              </div>
              <a href={`/${profile.username}`} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:underline inline-flex items-center gap-1">
                @{profile.username} <ExternalLink className="w-3 h-3" />
              </a>
              <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                {overview.email && (
                  <button onClick={() => copy(overview.email!, 'email')} className="inline-flex items-center gap-1 hover:text-black">
                    {overview.email} {copied === 'email' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
                {!overview.email_confirmed_at && <span className="text-biored font-bold">e-mail não confirmado</span>}
                <span title={fmtDate(overview.last_seen_at, true)}>Último acesso: <strong className="text-black">{lastSeenLabel(overview.last_seen_at)}</strong></span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {overview.whatsapp ? (
              <a
                href={whatsappLink(overview.whatsapp, greeting) ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="brutal-btn bg-biolime px-3 py-2 text-xs gap-2"
              >
                <IconWhatsapp className="w-4 h-4" /> {formatWhatsapp(overview.whatsapp)}
              </a>
            ) : (
              <span className="text-xs text-gray-400 self-center">Sem WhatsApp</span>
            )}
            <button onClick={() => setPlanEdit(true)} className="brutal-btn bg-bioyellow px-3 py-2 text-xs gap-2">
              <Crown className="w-4 h-4" /> Plano
            </button>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-6 overflow-x-auto border-b-2 border-black">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-bold whitespace-nowrap -mb-[2px] border-2 border-b-0 ${tab === t.key ? 'bg-black text-white border-black' : 'border-transparent hover:bg-gray-100'}`}
          >
            {t.label}
            {t.key === 'pages' && overview.pages.length > 1 && <span className="ml-1 opacity-60">{overview.pages.length}</span>}
            {t.key === 'payments' && payments && payments.length > 0 && <span className="ml-1 opacity-60">{payments.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {kpis.map(k => (
                <div key={k.label} className="brutal-card p-4">
                  <k.icon className="w-4 h-4 text-gray-400 mb-2" />
                  <div className="font-display text-xl leading-tight">{k.value}</div>
                  <div className="text-xs text-gray-500">{k.label}</div>
                </div>
              ))}
            </div>

            <div className="brutal-card p-5">
              <h2 className="font-display text-lg mb-3">Conta</h2>
              <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <Info label="Plano">
                  {planLabel(slug)}
                  {slug !== 'free' && ` · ${profile.plan_expires_at ? `${expired ? 'venceu' : 'até'} ${fmtDate(profile.plan_expires_at)}` : 'sem expiração'}`}
                </Info>
                <Info label="Cliente desde">{fmtDate(profile.plan_started_at)}</Info>
                <Info label="Cadastro">{fmtDate(profile.created_at, true)}</Info>
                <Info label="Último acesso">{fmtDate(overview.last_seen_at, true)}</Info>
                <Info label="Último login">{fmtDate(overview.last_sign_in_at, true)}</Info>
                <Info label="Origem do cadastro">
                  {profile.signup_source ? `${profile.signup_source}${profile.signup_campaign ? ` / ${profile.signup_campaign}` : ''}` : '—'}
                </Info>
                <Info label="Indicado por">
                  {overview.referred_by ? <a href={`/${overview.referred_by}`} target="_blank" rel="noopener noreferrer" className="underline">@{overview.referred_by}</a> : '—'}
                </Info>
                <Info label="Código de indicação"><span className="font-mono">{profile.referral_code ?? '—'}</span></Info>
                <Info label="Chave PIX para saques">{overview.has_pix ? 'Cadastrada' : 'Não cadastrada'}</Info>
                <Info label="Tema"><span className="capitalize">{profile.theme || 'cupertino'}</span></Info>
                <Info label="Domínio próprio">
                  {overview.custom_domain
                    ? <span className="inline-flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {overview.custom_domain.domain} {overview.custom_domain.verified ? '(ativo)' : '(pendente)'}</span>
                    : '—'}
                </Info>
                <Info label="Conteúdo">
                  {overview.counts.links} links · {overview.counts.socials} redes · {overview.counts.videos} vídeos · {overview.counts.banners} banners
                </Info>
                <Info label="Equipe">{overview.counts.members ? `${overview.counts.members} membro(s)` : '—'}</Info>
              </dl>
              {profile.bio && <p className="text-sm text-gray-600 mt-4 p-3 bg-gray-50 border border-gray-100">{profile.bio}</p>}
            </div>
          </div>

          <div className="space-y-6">
            <div className="brutal-card p-5">
              <h2 className="font-display text-lg mb-3">Acesso</h2>
              <UserAccountActions
                profileId={profile.id}
                username={profile.username}
                email={overview.email}
                emailConfirmed={!!overview.email_confirmed_at}
                isAdmin={isAdmin}
                isSelf={profile.id === adminId}
                hasApprovedPayments={overview.payments_approved > 0}
                onChanged={msg => { setToast(msg); load(); }}
                onDeleted={() => router.replace('/admin/users')}
              />
            </div>

            <div className="brutal-card p-5">
              <h2 className="font-display text-lg mb-3">Moderação</h2>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setConfirm('suspend')}
                  disabled={profile.id === adminId}
                  className={`brutal-btn px-3 py-2 text-xs gap-2 justify-start disabled:opacity-40 ${profile.suspended_at ? 'bg-biolime' : 'bg-white'}`}
                >
                  {profile.suspended_at ? <CircleCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                  {profile.suspended_at ? 'Reativar conta' : 'Suspender conta'}
                </button>
                <button
                  onClick={() => setConfirm('role')}
                  disabled={profile.id === adminId}
                  className="brutal-btn bg-white px-3 py-2 text-xs gap-2 justify-start disabled:opacity-40"
                >
                  {isAdmin ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                  {isAdmin ? 'Remover de admin' : 'Tornar admin'}
                </button>
              </div>
              {profile.suspended_at && (
                <p className="text-[11px] text-gray-500 mt-2">Suspensa em {fmtDate(profile.suspended_at, true)}. A página está fora do ar.</p>
              )}
            </div>

            <div className="brutal-card p-5">
              <h2 className="font-display text-lg mb-3">Etiquetas</h2>
              <UserTags profileId={profile.id} />
            </div>
          </div>
        </div>
      )}

      {tab === 'pages' && (
        <div className="brutal-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-black bg-gray-50">
                <th className="text-left px-4 py-3 font-display text-xs uppercase tracking-wider">Página</th>
                <th className="text-left px-4 py-3 font-display text-xs uppercase tracking-wider hidden sm:table-cell">Tema</th>
                <th className="text-right px-4 py-3 font-display text-xs uppercase tracking-wider">Links</th>
                <th className="text-right px-4 py-3 font-display text-xs uppercase tracking-wider">Visitas 30d</th>
                <th className="text-left px-4 py-3 font-display text-xs uppercase tracking-wider hidden md:table-cell">Criada</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {overview.pages.map(pg => (
                <tr key={pg.id} className="border-b border-gray-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {pg.is_main ? <Link2 className="w-4 h-4 text-gray-400" /> : <Layers className="w-4 h-4 text-gray-400" />}
                      <div>
                        <div className="font-bold">{pg.display_name || pg.username}</div>
                        <div className="text-xs text-gray-400">@{pg.username} · {pg.is_main ? 'principal' : 'extra'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell capitalize text-xs text-gray-500">{pg.theme || 'cupertino'}</td>
                  <td className="px-4 py-3 text-right">{pg.links}</td>
                  <td className="px-4 py-3 text-right">{pg.views_30d.toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{fmtDate(pg.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <a href={`/${pg.username}`} target="_blank" rel="noopener noreferrer" title="Abrir página" className="p-1.5 hover:bg-gray-100 rounded inline-flex">
                      <ExternalLink className="w-4 h-4 text-gray-500" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'payments' && (
        <div className="brutal-card overflow-hidden">
          {!payments ? (
            <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin inline" /></div>
          ) : payments.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-400">Nenhum pagamento.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-black bg-gray-50">
                    <th className="text-left px-4 py-3 font-display text-xs uppercase tracking-wider">Data</th>
                    <th className="text-left px-4 py-3 font-display text-xs uppercase tracking-wider">Plano</th>
                    <th className="text-right px-4 py-3 font-display text-xs uppercase tracking-wider">Valor</th>
                    <th className="text-center px-4 py-3 font-display text-xs uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 font-display text-xs uppercase tracking-wider hidden md:table-cell">Liberado até</th>
                    <th className="text-left px-4 py-3 font-display text-xs uppercase tracking-wider hidden lg:table-cell">ID Mercado Pago</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(pay => {
                    const st = PAYMENT_STATUS[pay.status] ?? { label: pay.status, cls: 'bg-gray-100' };
                    return (
                      <tr key={pay.id} className="border-b border-gray-100">
                        <td className="px-4 py-3 text-xs">{fmtDate(pay.created_at, true)}</td>
                        <td className="px-4 py-3">
                          {planLabel(pay.plan_slug)} <span className="text-xs text-gray-500">{pay.period === 'annual' ? 'anual' : pay.period === 'quarterly' ? 'trimestral' : ''}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold">{brl(pay.amount_cents)}</td>
                        <td className="px-4 py-3 text-center">
                          <span title={pay.mp_status_detail ?? undefined} className={`text-[10px] font-bold px-2 py-0.5 border border-black/20 ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{fmtDate(pay.plan_granted_until)}</td>
                        <td className="px-4 py-3 text-xs font-mono text-gray-500 hidden lg:table-cell">
                          {pay.mp_payment_id ? (
                            <button onClick={() => copy(pay.mp_payment_id!, pay.id)} className="inline-flex items-center gap-1 hover:text-black">
                              {pay.mp_payment_id} {copied === pay.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </button>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'timeline' && (
        <div className="brutal-card p-6">
          <UserTimeline profileId={profile.id} reloadKey={timelineKey} />
        </div>
      )}

      {tab === 'notes' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 brutal-card p-5">
            <h2 className="font-display text-lg mb-3">Notas internas</h2>
            <UserNotes profileId={profile.id} adminNames={adminNames} />
          </div>
          <div className="brutal-card p-5 self-start">
            <h2 className="font-display text-lg mb-3">Etiquetas</h2>
            <UserTags profileId={profile.id} />
          </div>
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="brutal-card bg-white p-6 max-w-sm w-full">
            <h3 className="font-display text-xl mb-2">Confirmar ação</h3>
            <p className="text-sm text-gray-600 mb-1">
              {confirm === 'suspend' && (profile.suspended_at
                ? `Reativar a conta de @${profile.username}? A página volta ao ar.`
                : `Suspender a conta de @${profile.username}? A página sai do ar e o painel fica bloqueado.`)}
              {confirm === 'role' && (isAdmin
                ? `Remover o papel de admin de @${profile.username}?`
                : `Promover @${profile.username} a admin? Essa pessoa terá acesso total ao painel admin.`)}
            </p>
            <p className="text-xs text-gray-400 mb-5">Esta ação será registrada no log de auditoria.</p>
            <div className="flex gap-3">
              <button
                onClick={confirm === 'suspend' ? toggleSuspend : toggleRole}
                disabled={busy}
                className="brutal-btn bg-black text-white px-4 py-2 text-sm flex-1 disabled:opacity-60"
              >
                {busy ? 'Salvando...' : 'Confirmar'}
              </button>
              <button onClick={() => setConfirm(null)} className="brutal-btn bg-white px-4 py-2 text-sm flex-1">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {planEdit && (
        <PlanEditDialog
          target={profile}
          onClose={() => setPlanEdit(false)}
          onSaved={() => { setPlanEdit(false); setToast('Plano atualizado.'); load(); }}
        />
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 z-[60] brutal-card bg-black text-white px-4 py-3 text-sm font-bold max-w-sm">{toast}</div>
      )}
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wide text-gray-400 font-bold">{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}
