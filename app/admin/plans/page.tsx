'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Pencil, ToggleLeft, ToggleRight, Trash2, X, Check, TriangleAlert as AlertTriangle, Users, RefreshCw } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price_cents: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  button_label: string | null;
  button_url: string | null;
  subscribers?: number;
}

interface PlanForm {
  name: string;
  price_cents: string;
  features: string[];
  is_active: boolean;
  button_label: string;
  button_url: string;
}

const emptyForm: PlanForm = { name: '', price_cents: '0', features: [''], is_active: true, button_label: '', button_url: '' };

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState<string>('');
  const [modal, setModal] = useState<'create' | Plan | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Plan | null>(null);
  const [drillPlan, setDrillPlan] = useState<{ plan: Plan; users: any[] } | null>(null);
  const [drillLoading, setDrillLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setAdminId(data.user.id);
    });
  }, []);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    const { data: plansData } = await supabase
      .from('plans')
      .select('id, name, price_cents, features, is_active, created_at, button_label, button_url')
      .order('price_cents', { ascending: true });

    const { data: subsData } = await supabase
      .from('subscriptions')
      .select('plan_id')
      .eq('status', 'active');

    const countMap: Record<string, number> = {};
    (subsData ?? []).forEach((s: any) => {
      countMap[s.plan_id] = (countMap[s.plan_id] || 0) + 1;
    });

    setPlans((plansData ?? []).map((p: any) => ({
      ...p,
      features: Array.isArray(p.features) ? p.features : [],
      is_active: p.is_active !== false,
      subscribers: countMap[p.id] ?? 0,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  async function logAction(action: string, planId: string, details: object = {}) {
    await supabase.from('admin_audit_log').insert({
      admin_id: adminId,
      action,
      target_type: 'plan',
      target_id: planId,
      details,
    });
  }

  function openCreate() {
    setForm(emptyForm);
    setModal('create');
  }

  function openEdit(plan: Plan) {
    setForm({
      name: plan.name,
      price_cents: String(plan.price_cents),
      features: plan.features.length > 0 ? plan.features : [''],
      is_active: plan.is_active,
      button_label: plan.button_label ?? '',
      button_url: plan.button_url ?? '',
    });
    setModal(plan);
  }

  async function savePlan() {
    const price = parseInt(form.price_cents, 10);
    if (!form.name.trim() || isNaN(price)) return;
    const cleanFeatures = form.features.filter(f => f.trim() !== '');

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      price_cents: price,
      features: cleanFeatures,
      is_active: form.is_active,
      button_label: form.button_label.trim() || null,
      button_url: form.button_url.trim() || null,
    };
    if (modal === 'create') {
      const { data } = await supabase.from('plans').insert(payload).select().maybeSingle();
      if (data) await logAction('create_plan', data.id, { name: form.name, price_cents: price });
    } else if (modal && typeof modal === 'object') {
      await supabase.from('plans').update(payload).eq('id', modal.id);
      await logAction('update_plan', modal.id, { name: form.name, price_cents: price });
    }
    await fetchPlans();
    setSaving(false);
    setModal(null);
  }

  async function toggleActive(plan: Plan) {
    setActionLoading(plan.id + '_active');
    await supabase.from('plans').update({ is_active: !plan.is_active }).eq('id', plan.id);
    await logAction(plan.is_active ? 'deactivate_plan' : 'activate_plan', plan.id);
    setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_active: !p.is_active } : p));
    setActionLoading(null);
  }

  async function deletePlan(plan: Plan) {
    setActionLoading(plan.id + '_delete');
    await supabase.from('plans').delete().eq('id', plan.id);
    await logAction('delete_plan', plan.id, { name: plan.name });
    setPlans(prev => prev.filter(p => p.id !== plan.id));
    setConfirmDelete(null);
    setActionLoading(null);
  }

  async function openDrill(plan: Plan) {
    setDrillLoading(true);
    setDrillPlan({ plan, users: [] });
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('profile_id')
      .eq('plan_id', plan.id)
      .eq('status', 'active');
    const ids = (subs ?? []).map((s: any) => s.profile_id);
    if (ids.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, created_at')
        .in('id', ids)
        .order('created_at', { ascending: false });
      setDrillPlan({ plan, users: profiles ?? [] });
    } else {
      setDrillPlan({ plan, users: [] });
    }
    setDrillLoading(false);
  }

  function addFeature() {
    setForm(f => ({ ...f, features: [...f.features, ''] }));
  }

  function updateFeature(i: number, val: string) {
    setForm(f => ({ ...f, features: f.features.map((feat, idx) => idx === i ? val : feat) }));
  }

  function removeFeature(i: number) {
    setForm(f => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }));
  }

  const hasActiveSubscribers = (plan: Plan) => (plan.subscribers ?? 0) > 0;

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl mb-1">Gestão de Planos</h1>
          <p className="text-gray-500 text-sm">{plans.length} planos cadastrados</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchPlans} className="brutal-btn px-3 py-2 bg-white text-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openCreate} className="brutal-btn bg-bioyellow px-4 py-2 text-sm gap-2">
            <Plus className="w-4 h-4" /> Novo plano
          </button>
        </div>
      </div>

      {loading ? (
        <div className="brutal-card p-12 text-center font-bold text-gray-400 animate-pulse">Carregando...</div>
      ) : (
        <div className="grid gap-4">
          {plans.map(plan => (
            <div key={plan.id} className={`brutal-card p-5 transition-all ${!plan.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <span className="font-display text-xl">{plan.name}</span>
                    {!plan.is_active && (
                      <span className="text-[10px] bg-gray-100 text-gray-500 border border-gray-300 px-2 py-0.5 font-bold">INATIVO</span>
                    )}
                    <button
                      onClick={() => openDrill(plan)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-black transition-colors font-bold"
                    >
                      <Users className="w-3.5 h-3.5" />
                      {plan.subscribers} {plan.subscribers === 1 ? 'assinante' : 'assinantes'}
                    </button>
                  </div>
                  <div className="font-display text-2xl mb-3">
                    {plan.price_cents === 0
                      ? 'Gratuito'
                      : `R$ ${(plan.price_cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`}
                  </div>
                  <ul className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {(plan.button_label || plan.button_url) && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span className="font-bold bg-gray-100 border border-gray-300 px-2 py-0.5">{plan.button_label || '—'}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-mono truncate max-w-[200px]">{plan.button_url || '—'}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(plan)}
                    disabled={actionLoading === plan.id + '_active'}
                    title={plan.is_active ? 'Desativar plano' : 'Ativar plano'}
                    className={`brutal-btn px-3 py-2 text-xs gap-1.5 ${plan.is_active ? 'bg-white' : 'bg-green-50 border-green-400'}`}
                  >
                    {plan.is_active
                      ? <ToggleRight className="w-4 h-4 text-green-500" />
                      : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                    <span className="hidden sm:inline">{plan.is_active ? 'Ativo' : 'Inativo'}</span>
                  </button>
                  <button
                    onClick={() => openEdit(plan)}
                    className="brutal-btn bg-white px-3 py-2 text-xs gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Editar</span>
                  </button>
                  <button
                    onClick={() => setConfirmDelete(plan)}
                    disabled={actionLoading === plan.id + '_delete'}
                    title="Excluir plano"
                    className="brutal-btn bg-white px-3 py-2 text-xs hover:bg-red-50 hover:border-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="brutal-card bg-white p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl">
                {modal === 'create' ? 'Novo plano' : `Editar: ${(modal as Plan).name}`}
              </h3>
              <button onClick={() => setModal(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning if editing plan with subscribers */}
            {modal !== 'create' && hasActiveSubscribers(modal as Plan) && (
              <div className="flex items-start gap-2 bg-yellow-50 border-2 border-yellow-400 p-3 mb-4 text-sm">
                <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                <span className="text-yellow-800 font-bold">
                  Este plano tem {(modal as Plan).subscribers} assinante(s) ativo(s). Alterações no preço afetarão apenas novas contratações.
                </span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Nome do plano</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="brutal-input w-full py-2 px-3 text-sm"
                  placeholder="Ex: Pro, Business..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Preço (em centavos)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={form.price_cents}
                    onChange={e => setForm(f => ({ ...f, price_cents: e.target.value }))}
                    className="brutal-input w-full py-2 px-3 text-sm"
                    placeholder="0 = gratuito"
                  />
                  <span className="text-sm text-gray-500 shrink-0">
                    = R$ {(parseInt(form.price_cents || '0', 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold mb-1">Texto do botão</label>
                  <input
                    type="text"
                    value={form.button_label}
                    onChange={e => setForm(f => ({ ...f, button_label: e.target.value }))}
                    className="brutal-input w-full py-2 px-3 text-sm"
                    placeholder="Ex: ASSINAR PRO"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Link do botão</label>
                  <input
                    type="text"
                    value={form.button_url}
                    onChange={e => setForm(f => ({ ...f, button_url: e.target.value }))}
                    className="brutal-input w-full py-2 px-3 text-sm"
                    placeholder="Ex: /register?plan=pro"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold">Funcionalidades</label>
                  <button onClick={addFeature} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </button>
                </div>
                <div className="space-y-2">
                  {form.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={feat}
                        onChange={e => updateFeature(i, e.target.value)}
                        className="brutal-input flex-1 py-1.5 px-3 text-sm"
                        placeholder="Ex: Links ilimitados"
                      />
                      {form.features.length > 1 && (
                        <button
                          onClick={() => removeFeature(i)}
                          className="p-1.5 hover:bg-red-50 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-red-400" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4"
                />
                <label htmlFor="is_active" className="text-sm font-bold">Plano ativo (visível para usuários)</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={savePlan}
                disabled={saving || !form.name.trim()}
                className="brutal-btn bg-black text-white px-4 py-2 text-sm flex-1 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : modal === 'create' ? 'Criar plano' : 'Salvar alterações'}
              </button>
              <button
                onClick={() => setModal(null)}
                className="brutal-btn bg-white px-4 py-2 text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="brutal-card bg-white p-6 max-w-sm w-full">
            <h3 className="font-display text-xl mb-2">Excluir plano</h3>
            <p className="text-sm text-gray-600 mb-1">
              Tem certeza que deseja excluir o plano <strong>{confirmDelete.name}</strong>?
            </p>
            {hasActiveSubscribers(confirmDelete) && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-300 p-3 my-3 text-xs">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="text-red-700 font-bold">
                  Atenção: existem {confirmDelete.subscribers} assinante(s) ativos neste plano. A exclusão pode afetar suas assinaturas.
                </span>
              </div>
            )}
            <p className="text-xs text-gray-400 mb-5">Esta ação é irreversível e será registrada no log.</p>
            <div className="flex gap-3">
              <button
                onClick={() => deletePlan(confirmDelete)}
                className="brutal-btn bg-red-500 text-white px-4 py-2 text-sm flex-1"
              >
                Excluir
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="brutal-btn bg-white px-4 py-2 text-sm flex-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drill-down: subscribers */}
      {drillPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="brutal-card bg-white p-6 max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl">Assinantes: {drillPlan.plan.name}</h3>
              <button onClick={() => setDrillPlan(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            {drillLoading ? (
              <div className="text-center py-8 font-bold text-gray-400 animate-pulse">Carregando...</div>
            ) : drillPlan.users.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Nenhum assinante ativo neste plano.</p>
            ) : (
              <div className="overflow-y-auto flex-1">
                {drillPlan.users.map((u: any) => (
                  <div key={u.id} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-400 text-xs">
                        {(u.display_name || u.username)[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm leading-tight truncate">{u.display_name || u.username}</div>
                      <div className="text-xs text-gray-400">@{u.username}</div>
                    </div>
                    <a
                      href={`/${u.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-400 hover:text-black transition-colors"
                    >
                      Ver perfil
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
