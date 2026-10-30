'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Json } from '@/lib/database.types';
import { Search, Shield, ShieldOff, Ban, CircleCheck as CheckCircle2, ExternalLink, ChevronLeft, ChevronRight, RefreshCw, Filter, Eye, Crown } from 'lucide-react';
import { isPlanSlug, planLabel } from '@/lib/plans';
import { PlanEditDialog } from '@/components/admin/users/PlanEditDialog';
import { IconWhatsapp } from '@/lib/social-icons';
import { formatWhatsapp, whatsappLink } from '@/lib/whatsapp';

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_pro: boolean | null;
  plan: string | null;
  plan_expires_at: string | null;
  plan_started_at: string | null;
  referral_code: string | null;
  role: string | null;
  suspended_at: string | null;
  created_at: string | null;
  theme: string | null;
}

const PAGE_SIZE = 25;

type FilterRole = 'all' | 'admin' | 'user';
type FilterPlan = 'all' | 'free' | 'pro' | 'business';
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
  const [confirmAction, setConfirmAction] = useState<{ type: string; profile: Profile } | null>(null);
  const [adminId, setAdminId] = useState<string>('');
  const [planEdit, setPlanEdit] = useState<Profile | null>(null);
  // WhatsApp do cadastro (profile_private, leitura liberada para admin)
  const [phones, setPhones] = useState<Record<string, string>>({});

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

    // Páginas extras (Business) não são contas
    q = q.is('owner_id', null);

    // Vírgula, parênteses, aspas e barra mudam a sintaxe do filtro `or` do PostgREST
    const term = search.replace(/[,()"\\]/g, ' ').trim();
    if (term) q = q.or(`username.ilike.%${term}%,display_name.ilike.%${term}%`);
    if (filterRole !== 'all') q = q.eq('role', filterRole);
    if (filterPlan !== 'all') q = q.eq('plan', filterPlan);
    if (filterStatus === 'active') q = q.is('suspended_at', null);
    if (filterStatus === 'suspended') q = q.not('suspended_at', 'is', null);

    const { data, count } = await q
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    setProfiles(data ?? []);
    setTotal(count ?? 0);
    const ids = (data ?? []).map(p => p.id);
    if (ids.length) {
      const { data: priv } = await supabase.from('profile_private').select('profile_id, whatsapp').in('profile_id', ids);
      setPhones(Object.fromEntries((priv ?? []).filter(r => r.whatsapp).map(r => [r.profile_id, r.whatsapp])));
    }
    setLoading(false);
  }, [search, filterRole, filterPlan, filterStatus, page]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  async function logAction(action: string, targetId: string, details: Json = {}) {
    await supabase.from('admin_audit_log').insert({
      admin_id: adminId,
      action,
      target_type: 'profile',
      target_id: targetId,
      details,
    });
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
            <option value="pro">Pro</option>
            <option value="business">Business</option>
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
                        <Link href={`/admin/users/${p.id}`} className="hover:underline">
                          <div className="font-bold leading-tight">{p.display_name || p.username}</div>
                          <div className="text-xs text-gray-400">@{p.username}</div>
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-gray-500 capitalize">{p.theme || 'cupertino'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(() => {
                        const slug = isPlanSlug(p.plan) ? p.plan : 'free';
                        const label = planLabel(slug).toUpperCase();
                        const cls = slug === 'business'
                          ? 'bg-black text-white'
                          : slug === 'pro'
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
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          title="Ver detalhes"
                          href={`/admin/users/${p.id}`}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Eye className="w-4 h-4 text-gray-500" />
                        </Link>
                        {phones[p.id] ? (
                          <a
                            href={whatsappLink(phones[p.id], greeting(p)) ?? undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Conversar no WhatsApp: ${formatWhatsapp(phones[p.id])}`}
                            className="p-1.5 hover:bg-green-50 rounded transition-colors"
                          >
                            <IconWhatsapp className="w-4 h-4 text-green-600" />
                          </a>
                        ) : (
                          <span title="Sem WhatsApp cadastrado" className="p-1.5 opacity-30 cursor-not-allowed">
                            <IconWhatsapp className="w-4 h-4 text-gray-500" />
                          </span>
                        )}
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
                          onClick={() => setPlanEdit(p)}
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

      {planEdit && (
        <PlanEditDialog
          target={planEdit}
          onClose={() => setPlanEdit(null)}
          onSaved={r => {
            setProfiles(list => list.map(p => p.id === planEdit.id ? { ...p, ...r, is_pro: r.plan !== 'free' } : p));
            setPlanEdit(null);
          }}
        />
      )}
    </div>
  );
}

function greeting(p: { display_name: string | null; username: string }) {
  return `Olá, ${p.display_name || p.username}! Aqui é da equipe BioFlowzy.`;
}
