'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Shield, ShieldOff, Ban, CircleCheck as CheckCircle2, ExternalLink, ChevronLeft, ChevronRight, RefreshCw, Filter, X, Eye, Crown } from 'lucide-react';
import { PLANS, PlanSlug, isPlanSlug, planLabel } from '@/lib/plans';

interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  is_pro: boolean;
  plan: string | null;
  plan_expires_at: string | null;
  plan_started_at: string | null;
  referral_code: string | null;
  role: string;
  suspended_at: string | null;
  created_at: string;
  theme: string;
}

interface UserDetail extends Profile {
  links_count: number;
  socials_count: number;
  videos_count: number;
  banners_count: number;
}

const PAGE_SIZE = 25;

type FilterRole = 'all' | 'admin' | 'user';
type FilterPlan = 'all' | 'free' | 'pro_monthly' | 'pro_annual';
type FilterStatus = 'all' | 'active' | 'suspended';

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<FilterRole>('all');
  const [filterPlan, setFilterPlan] = useState<FilterPlan>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; profile: Profile } | null>(null);
  const [adminId, setAdminId] = useState<string>('');
  const [planEdit, setPlanEdit] = useState<Profile | null>(null);
  const [planEditSlug, setPlanEditSlug] = useState<PlanSlug>('free');
  const [planEditExpires, setPlanEditExpires] = useState<string>('');
  const [planSaving, setPlanSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setAdminId(data.user.id);
    });
  }, []);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('profiles')
      .select('id, username, display_name, bio, avatar_url, is_pro, plan, plan_expires_at, plan_started_at, referral_code, role, suspended_at, created_at, theme', { count: 'exact' });

    if (search) q = q.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`);
    if (filterRole !== 'all') q = q.eq('role', filterRole);
    if (filterPlan !== 'all') q = q.eq('plan', filterPlan);
    if (filterStatus === 'active') q = q.is('suspended_at', null);
    if (filterStatus === 'suspended') q = q.not('suspended_at', 'is', null);

    const { data, count } = await q
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    setProfiles(data ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [search, filterRole, filterPlan, filterStatus, page]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  async function logAction(action: string, targetId: string, details: object = {}) {
    await supabase.from('admin_audit_log').insert({
      admin_id: adminId,
      action,
      target_type: 'profile',
      target_id: targetId,
      details,
    });
  }

  function openPlanEdit(p: Profile) {
    const slug: PlanSlug = isPlanSlug(p.plan) ? p.plan : 'free';
    setPlanEdit(p);
    setPlanEditSlug(slug);
    setPlanEditExpires(p.plan_expires_at ? p.plan_expires_at.slice(0, 10) : '');
  }

  function setExpiryOffset(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setPlanEditExpires(d.toISOString().slice(0, 10));
  }

  async function savePlan() {
    if (!planEdit) return;
    setPlanSaving(true);
    const prev = { plan: planEdit.plan, plan_expires_at: planEdit.plan_expires_at };
    const expires = planEditSlug === 'free' ? null : (planEditExpires ? new Date(planEditExpires + 'T23:59:59').toISOString() : null);
    const patch: any = { plan: planEditSlug, plan_expires_at: expires };
    if (planEditSlug !== 'free' && !planEdit.plan_started_at) patch.plan_started_at = new Date().toISOString();
    await supabase.from('profiles').update(patch).eq('id', planEdit.id);
    await logAction('plan_change', planEdit.id, { before: prev, after: { plan: planEditSlug, plan_expires_at: expires } });
    setProfiles(list => list.map(p => p.id === planEdit.id ? { ...p, plan: planEditSlug, plan_expires_at: expires, is_pro: planEditSlug !== 'free' } : p));
    setPlanSaving(false);
    setPlanEdit(null);
  }

  async function toggleRole(profile: Profile) {
    setActionLoading(profile.id + '_role');
    const newRole = profile.role === 'admin' ? 'user' : 'admin';
    await supabase.from('profiles').update({ role: newRole }).eq('id', profile.id);
    await logAction(newRole === 'admin' ? 'promote_admin' : 'demote_admin', profile.id);
    setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, role: newRole } : p));
    setActionLoading(null);
    setConfirmAction(null);
  }

  async function toggleSuspend(profile: Profile) {
    setActionLoading(profile.id + '_suspend');
    const newVal = profile.suspended_at ? null : new Date().toISOString();
    await supabase.from('profiles').update({ suspended_at: newVal }).eq('id', profile.id);
    await logAction(newVal ? 'suspend_user' : 'unsuspend_user', profile.id);
    setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, suspended_at: newVal } : p));
    setActionLoading(null);
    setConfirmAction(null);
  }

  async function openDetail(profile: Profile) {
    setDetailLoading(true);
    setDetail({ ...profile, links_count: 0, socials_count: 0, videos_count: 0, banners_count: 0 });
    const { data } = await supabase.rpc('user_detail_counts', { p_profile_id: profile.id });
    const row = Array.isArray(data) ? data[0] : data;
    setDetail({
      ...profile,
      links_count: Number(row?.links_count ?? 0),
      socials_count: Number(row?.socials_count ?? 0),
      videos_count: Number(row?.videos_count ?? 0),
      banners_count: Number(row?.banners_count ?? 0),
    });
    setDetailLoading(false);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl mb-1">Gestão de Usuários</h1>
        <p className="text-gray-500 text-sm">{total.toLocaleString('pt-BR')} usuários cadastrados</p>
      </div>

      {/* Search + Filters */}
      <div className="brutal-card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou @username..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="brutal-input pl-9 py-2 text-sm w-full"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterRole}
            onChange={e => { setFilterRole(e.target.value as FilterRole); setPage(0); }}
            className="brutal-input py-1.5 text-sm"
          >
            <option value="all">Todos os papéis</option>
            <option value="admin">Admin</option>
            <option value="user">Usuário</option>
          </select>
          <select
            value={filterPlan}
            onChange={e => { setFilterPlan(e.target.value as FilterPlan); setPage(0); }}
            className="brutal-input py-1.5 text-sm"
          >
            <option value="all">Todos os planos</option>
            <option value="free">Free</option>
            <option value="pro_monthly">Pro Mensal</option>
            <option value="pro_annual">Pro Anual</option>
          </select>
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value as FilterStatus); setPage(0); }}
            className="brutal-input py-1.5 text-sm"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="suspended">Suspensos</option>
          </select>
          <button onClick={fetchProfiles} className="brutal-btn px-3 py-1.5 bg-white text-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="brutal-card overflow-hidden mb-4">
        {loading ? (
          <div className="p-12 text-center font-bold text-gray-400 animate-pulse">Carregando...</div>
        ) : profiles.length === 0 ? (
          <div className="p-12 text-center text-gray-400">Nenhum usuário encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-black bg-gray-50">
                  <th className="text-left px-4 py-3 font-display text-xs uppercase tracking-wider">Usuário</th>
                  <th className="text-left px-4 py-3 font-display text-xs uppercase tracking-wider hidden md:table-cell">Tema</th>
                  <th className="text-center px-4 py-3 font-display text-xs uppercase tracking-wider">Plano</th>
                  <th className="text-center px-4 py-3 font-display text-xs uppercase tracking-wider">Papel</th>
                  <th className="text-center px-4 py-3 font-display text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 font-display text-xs uppercase tracking-wider hidden lg:table-cell">Cadastro</th>
                  <th className="text-right px-4 py-3 font-display text-xs uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(p => (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-400 text-xs">
                            {(p.display_name || p.username)[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold leading-tight">{p.display_name || p.username}</div>
                          <div className="text-xs text-gray-400">@{p.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-gray-500 capitalize">{p.theme || 'brutalist'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(() => {
                        const slug = isPlanSlug(p.plan) ? p.plan : 'free';
                        const label = planLabel(slug).toUpperCase();
                        const cls = slug === 'pro_annual'
                          ? 'bg-black text-white'
                          : slug === 'pro_monthly'
                          ? 'bg-bioyellow text-black'
                          : 'text-gray-400';
                        return (
                          <span className={`text-[10px] font-bold px-2 py-0.5 inline-block ${slug !== 'free' ? 'brutal-border ' + cls : cls}`}>{label}</span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.role === 'admin' ? (
                        <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 inline-block">ADMIN</span>
                      ) : (
                        <span className="text-xs text-gray-400 font-bold">USER</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.suspended_at ? (
                        <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 border border-red-300 inline-block">SUSPENSO</span>
                      ) : (
                        <span className="text-xs text-green-600 font-bold">ATIVO</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                      {new Date(p.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          title="Ver detalhes"
                          onClick={() => openDetail(p)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        <a
                          href={`/${p.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ver perfil público"
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-500" />
                        </a>
                        <button
                          title="Gerenciar plano"
                          onClick={() => openPlanEdit(p)}
                          className="p-1.5 hover:bg-yellow-50 rounded transition-colors"
                        >
                          <Crown className={`w-4 h-4 ${p.is_pro ? 'text-yellow-500' : 'text-gray-400'}`} />
                        </button>
                        <button
                          title={p.role === 'admin' ? 'Remover admin' : 'Tornar admin'}
                          onClick={() => setConfirmAction({ type: 'role', profile: p })}
                          disabled={actionLoading === p.id + '_role'}
                          className="p-1.5 hover:bg-blue-50 rounded transition-colors"
                        >
                          {p.role === 'admin' ? <ShieldOff className="w-4 h-4 text-blue-500" /> : <Shield className="w-4 h-4 text-gray-400" />}
                        </button>
                        <button
                          title={p.suspended_at ? 'Reativar conta' : 'Suspender conta'}
                          onClick={() => setConfirmAction({ type: 'suspend', profile: p })}
                          disabled={actionLoading === p.id + '_suspend'}
                          className="p-1.5 hover:bg-red-50 rounded transition-colors"
                        >
                          {p.suspended_at ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Ban className="w-4 h-4 text-gray-400" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Página {page + 1} de {totalPages} ({total} usuários)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="brutal-btn px-3 py-1.5 bg-white text-sm disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="brutal-btn px-3 py-1.5 bg-white text-sm disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="brutal-card bg-white p-6 max-w-sm w-full">
            <h3 className="font-display text-xl mb-2">Confirmar ação</h3>
            <p className="text-sm text-gray-600 mb-1">
              {confirmAction.type === 'role' && (
                confirmAction.profile.role === 'admin'
                  ? `Remover papel de Admin de @${confirmAction.profile.username}?`
                  : `Promover @${confirmAction.profile.username} para Admin?`
              )}
              {confirmAction.type === 'suspend' && (
                confirmAction.profile.suspended_at
                  ? `Reativar a conta de @${confirmAction.profile.username}?`
                  : `Suspender a conta de @${confirmAction.profile.username}?`
              )}
            </p>
            <p className="text-xs text-gray-400 mb-5">Esta ação será registrada no log de auditoria.</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (confirmAction.type === 'role') toggleRole(confirmAction.profile);
                  if (confirmAction.type === 'suspend') toggleSuspend(confirmAction.profile);
                }}
                className="brutal-btn bg-black text-white px-4 py-2 text-sm flex-1"
              >
                Confirmar
              </button>
              <button
                onClick={() => setConfirmAction(null)}
                className="brutal-btn bg-white px-4 py-2 text-sm flex-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="brutal-card bg-white p-6 max-w-md w-full">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {detail.avatar_url ? (
                  <img src={detail.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover brutal-border" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-100 brutal-border flex items-center justify-center font-display text-xl">
                    {(detail.display_name || detail.username)[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-display text-lg leading-tight">{detail.display_name || detail.username}</div>
                  <div className="text-sm text-gray-400">@{detail.username}</div>
                </div>
              </div>
              <button onClick={() => setDetail(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {detail.bio && (
              <p className="text-sm text-gray-600 mb-4 p-3 bg-gray-50 border border-gray-100">{detail.bio}</p>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Links', value: detailLoading ? '…' : detail.links_count },
                { label: 'Redes sociais', value: detailLoading ? '…' : detail.socials_count },
                { label: 'Vídeos', value: detailLoading ? '…' : detail.videos_count },
                { label: 'Banners', value: detailLoading ? '…' : detail.banners_count },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 bg-gray-50 brutal-border text-center">
                  <div className="font-display text-2xl">{value}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              ))}
            </div>

            <div className="text-xs text-gray-400 space-y-1 mb-4">
              <div>Tema: <span className="font-bold text-black capitalize">{detail.theme || 'brutalist'}</span></div>
              <div>Plano: <span className="font-bold text-black">{planLabel(detail.plan)}</span></div>
              {detail.plan_expires_at && (
                <div>Expira em: <span className="font-bold text-black">{new Date(detail.plan_expires_at).toLocaleDateString('pt-BR')}</span></div>
              )}
              {detail.referral_code && (
                <div>Código de indicação: <span className="font-bold text-black font-mono">{detail.referral_code}</span></div>
              )}
              <div>Cadastro: <span className="font-bold text-black">{new Date(detail.created_at).toLocaleDateString('pt-BR')}</span></div>
              <div>Status: <span className="font-bold text-black">{detail.suspended_at ? 'Suspenso' : 'Ativo'}</span></div>
            </div>

            <a
              href={`/${detail.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="brutal-btn bg-bioyellow px-4 py-2 text-sm w-full justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" /> Ver perfil público
            </a>
          </div>
        </div>
      )}

      {/* Plan Edit Modal */}
      {planEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="brutal-card bg-white p-6 max-w-md w-full">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display text-xl mb-1">Gerenciar plano</h3>
                <p className="text-xs text-gray-500">@{planEdit.username}</p>
              </div>
              <button onClick={() => setPlanEdit(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <label className="block text-xs font-bold uppercase tracking-wide mb-2">Plano</label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(Object.keys(PLANS) as PlanSlug[]).map(slug => (
                <button
                  key={slug}
                  onClick={() => setPlanEditSlug(slug)}
                  className={`brutal-border px-3 py-2 text-xs font-bold ${planEditSlug === slug ? 'bg-black text-white' : 'bg-white'}`}
                >
                  {PLANS[slug].name}
                </button>
              ))}
            </div>

            <label className="block text-xs font-bold uppercase tracking-wide mb-2">Validade</label>
            <input
              type="date"
              value={planEditExpires}
              onChange={e => setPlanEditExpires(e.target.value)}
              disabled={planEditSlug === 'free'}
              className="brutal-input px-3 py-2 w-full text-sm mb-2 disabled:bg-neutral-100"
            />
            <div className="flex gap-2 flex-wrap mb-4">
              <button type="button" onClick={() => setExpiryOffset(30)} disabled={planEditSlug === 'free'} className="brutal-btn bg-white px-2 py-1 text-xs disabled:opacity-40">+30 dias</button>
              <button type="button" onClick={() => setExpiryOffset(365)} disabled={planEditSlug === 'free'} className="brutal-btn bg-white px-2 py-1 text-xs disabled:opacity-40">+1 ano</button>
              <button type="button" onClick={() => setPlanEditExpires('')} disabled={planEditSlug === 'free'} className="brutal-btn bg-white px-2 py-1 text-xs disabled:opacity-40">Sem expiração</button>
            </div>

            <p className="text-[11px] text-gray-500 mb-4">
              {planEditSlug === 'free'
                ? 'Usuário voltará para o plano Free sem expiração.'
                : planEditExpires
                  ? `Plano válido até ${new Date(planEditExpires + 'T23:59:59').toLocaleDateString('pt-BR')}.`
                  : 'Plano vitalício (sem data de expiração).'}
            </p>

            <div className="flex gap-3">
              <button
                onClick={savePlan}
                disabled={planSaving}
                className="brutal-btn bg-black text-white px-4 py-2 text-sm flex-1 disabled:opacity-60"
              >
                {planSaving ? 'Salvando...' : 'Salvar plano'}
              </button>
              <button
                onClick={() => setPlanEdit(null)}
                className="brutal-btn bg-white px-4 py-2 text-sm flex-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
