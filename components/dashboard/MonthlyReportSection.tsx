'use client';

import { useState } from 'react';
import { Lock, Mail, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { usePlan } from '@/hooks/use-plan';
import { useUpgradeModal } from './UpgradeModal';

// Relatório mensal por e-mail da conta (Business): liga/desliga e envio de teste
export function MonthlyReportSection({ profileId, enabled: initialEnabled }: { profileId: string; enabled: boolean }) {
  const { has } = usePlan();
  const { open: openUpgrade } = useUpgradeModal();
  const unlocked = has('monthly_report');
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  async function toggle() {
    const next = !enabled;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ monthly_report_enabled: next }).eq('id', profileId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setEnabled(next);
    toast.success(next ? 'Você vai receber o relatório todo dia 1.' : 'Relatório mensal desligado.');
  }

  async function sendTest() {
    setSending(true);
    const { data, error } = await supabase.functions.invoke('monthly-report', { body: { mode: 'test' } });
    setSending(false);
    if (error) {
      let message = 'Não foi possível enviar o teste.';
      try { message = (await (error as any).context?.json())?.error || message; } catch {}
      toast.error(message);
      return;
    }
    toast.success(`Relatório de teste enviado para ${data?.email ?? 'seu e-mail'}.`);
  }

  return (
    <section>
      <h2 className="font-display text-2xl mb-4">Relatório mensal</h2>
      <div className="brutal-card p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-3">
            <Mail className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Resumo por e-mail todo dia 1</p>
              <p className="text-xs text-black/60 mt-1">Visitas, cliques, contatos, links mais clicados e de onde vieram as visitas de cada página, comparados com o mês anterior.</p>
            </div>
          </div>
          {unlocked ? (
            <label className="inline-flex items-center gap-3 shrink-0 cursor-pointer">
              <span className="text-xs font-bold">{enabled ? 'Ligado' : 'Desligado'}</span>
              <button
                onClick={toggle}
                disabled={saving}
                role="switch"
                aria-checked={enabled}
                aria-label="Receber relatório mensal"
                className={`relative inline-block w-11 h-6 brutal-border transition-colors ${enabled ? 'bg-black' : 'bg-white'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white brutal-border transition-transform ${enabled ? 'translate-x-5 bg-bioyellow' : ''}`} />
              </button>
            </label>
          ) : (
            <button onClick={openUpgrade} className="brutal-btn bg-black text-white px-4 py-2 text-xs gap-1 shrink-0">
              <Lock className="w-3 h-3" /> Disponível no Business
            </button>
          )}
        </div>
        {unlocked && (
          <button onClick={sendTest} disabled={sending} className="brutal-btn bg-white px-3 py-2 text-xs gap-2 self-start disabled:opacity-50">
            <Send className="w-3 h-3" /> {sending ? 'Enviando...' : 'Enviar um relatório de teste para mim'}
          </button>
        )}
      </div>
    </section>
  );
}
