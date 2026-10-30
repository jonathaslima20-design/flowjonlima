'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PLANS, PlanSlug, isPlanSlug } from '@/lib/plans';

export type PlanEditTarget = {
  id: string;
  username: string;
  plan: string | null;
  plan_expires_at: string | null;
  plan_started_at: string | null;
};

export type PlanEditResult = { plan: PlanSlug; plan_expires_at: string | null };

// Troca manual de plano/validade (Admin → Usuários), registrada no log de auditoria
export function PlanEditDialog({ target, onClose, onSaved }: {
  target: PlanEditTarget;
  onClose: () => void;
  onSaved: (result: PlanEditResult) => void;
}) {
  const [slug, setSlug] = useState<PlanSlug>(isPlanSlug(target.plan) ? target.plan : 'free');
  const [expires, setExpires] = useState(target.plan_expires_at ? target.plan_expires_at.slice(0, 10) : '');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function addDays(days: number) {
    // Soma a partir da validade atual (se ainda vigente) ou de hoje
    const base = target.plan_expires_at && new Date(target.plan_expires_at) > new Date() && slug === target.plan
      ? new Date(target.plan_expires_at)
      : new Date();
    base.setDate(base.getDate() + days);
    setExpires(base.toISOString().slice(0, 10));
  }

  async function save() {
    setSaving(true);
    setError('');
    const expiresAt = slug === 'free' ? null : (expires ? new Date(expires + 'T23:59:59').toISOString() : null);
    const patch: { plan: PlanSlug; plan_expires_at: string | null; plan_started_at?: string } = { plan: slug, plan_expires_at: expiresAt };
    if (slug !== 'free' && !target.plan_started_at) patch.plan_started_at = new Date().toISOString();
    const { error: upErr } = await supabase.from('profiles').update(patch).eq('id', target.id);
    if (upErr) {
      setSaving(false);
      setError(upErr.message);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('admin_audit_log').insert({
      admin_id: user?.id ?? '',
      action: 'plan_change',
      target_type: 'profile',
      target_id: target.id,
      details: {
        before: { plan: target.plan, plan_expires_at: target.plan_expires_at },
        after: { plan: slug, plan_expires_at: expiresAt },
        ...(reason.trim() ? { reason: reason.trim().slice(0, 300) } : {}),
      },
    });
    setSaving(false);
    onSaved({ plan: slug, plan_expires_at: expiresAt });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="brutal-card bg-white p-6 max-w-md w-full">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-display text-xl mb-1">Gerenciar plano</h3>
            <p className="text-xs text-gray-500">@{target.username}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <label className="block text-xs font-bold uppercase tracking-wide mb-2">Plano</label>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(Object.keys(PLANS) as PlanSlug[]).map(s => (
            <button
              key={s}
              onClick={() => setSlug(s)}
              className={`brutal-border px-3 py-2 text-xs font-bold ${slug === s ? 'bg-black text-white' : 'bg-white'}`}
            >
              {PLANS[s].name}
            </button>
          ))}
        </div>

        <label className="block text-xs font-bold uppercase tracking-wide mb-2">Validade</label>
        <input
          type="date"
          value={expires}
          onChange={e => setExpires(e.target.value)}
          disabled={slug === 'free'}
          className="brutal-input px-3 py-2 w-full text-sm mb-2 disabled:bg-neutral-100"
        />
        <div className="flex gap-2 flex-wrap mb-4">
          {[7, 30, 90, 365].map(d => (
            <button key={d} type="button" onClick={() => addDays(d)} disabled={slug === 'free'} className="brutal-btn bg-white px-2 py-1 text-xs disabled:opacity-40">
              +{d === 365 ? '1 ano' : `${d} dias`}
            </button>
          ))}
          <button type="button" onClick={() => setExpires('')} disabled={slug === 'free'} className="brutal-btn bg-white px-2 py-1 text-xs disabled:opacity-40">Sem expiração</button>
        </div>

        <p className="text-[11px] text-gray-500 mb-4">
          {slug === 'free'
            ? 'Usuário voltará para o plano Free sem expiração.'
            : expires
              ? `Plano válido até ${new Date(expires + 'T23:59:59').toLocaleDateString('pt-BR')}.`
              : 'Plano vitalício (sem data de expiração).'}
        </p>

        <label className="block text-xs font-bold uppercase tracking-wide mb-2">Motivo (opcional)</label>
        <input
          value={reason}
          onChange={e => setReason(e.target.value)}
          maxLength={300}
          placeholder="Ex.: cortesia para parceiro, compensação por falha"
          className="brutal-input px-3 py-2 w-full text-sm mb-4"
        />

        {error && <p className="text-sm text-biored font-bold mb-3">{error}</p>}

        <div className="flex gap-3">
          <button onClick={save} disabled={saving} className="brutal-btn bg-black text-white px-4 py-2 text-sm flex-1 disabled:opacity-60">
            {saving ? 'Salvando...' : 'Salvar plano'}
          </button>
          <button onClick={onClose} className="brutal-btn bg-white px-4 py-2 text-sm flex-1">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
