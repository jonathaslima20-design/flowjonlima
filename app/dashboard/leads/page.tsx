'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, Lock, Trash2, Mail, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { usePlan } from '@/hooks/use-plan';
import { useUpgradeModal } from '@/components/dashboard/UpgradeModal';
import { LEAD_FORM_URL } from '@/lib/leads';

type Lead = { id: string; name: string; email: string | null; phone: string | null; created_at: string };
type FormLink = { id: string; title: string | null; is_active: boolean | null };

function csvCell(value: string | null) {
  const v = value ?? '';
  return /[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export default function LeadsPage() {
  const { plan, loading } = usePlan();
  const { open: openUpgrade } = useUpgradeModal();
  const [profileId, setProfileId] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);
  const [formLink, setFormLink] = useState<FormLink | null>(null);
  const [title, setTitle] = useState('Fale comigo');
  const [busy, setBusy] = useState(false);

  const limit = plan.limits.leads;
  const unlocked = limit !== 0;
  const canExport = limit < 0;

  const load = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setProfileId(u.user.id);
    const [{ data: leadRows }, { data: linkRow }, { data: usageData }] = await Promise.all([
      supabase.from('page_leads').select('id, name, email, phone, created_at').eq('profile_id', u.user.id).order('created_at', { ascending: false }).limit(500),
      supabase.from('links').select('id, title, is_active').eq('profile_id', u.user.id).eq('url', LEAD_FORM_URL).maybeSingle(),
      supabase.rpc('lead_usage'),
    ]);
    setLeads(leadRows ?? []);
    setFormLink(linkRow ?? null);
    if (linkRow?.title) setTitle(linkRow.title);
    setUsage(usageData as unknown as { used: number; limit: number });
  }, []);

  useEffect(() => { load(); }, [load]);

  async function enableForm() {
    setBusy(true);
    // Entra como o primeiro link da página; dá para reordenar em Links
    const { data: first } = await supabase.from('links').select('position').eq('profile_id', profileId).order('position', { ascending: true }).limit(1).maybeSingle();
    const { error } = await supabase.from('links').insert({
      profile_id: profileId,
      title: title.trim() || 'Fale comigo',
      url: LEAD_FORM_URL,
      position: (first?.position ?? 0) - 1,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Botão de contato adicionado à sua página');
    load();
  }

  async function disableForm() {
    if (!formLink) return;
    setBusy(true);
    const { error } = await supabase.from('links').delete().eq('id', formLink.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setFormLink(null);
    toast.success('Botão de contato removido');
  }

  async function saveTitle() {
    if (!formLink) return;
    const { error } = await supabase.from('links').update({ title: title.trim() || 'Fale comigo' }).eq('id', formLink.id);
    if (error) toast.error(error.message);
    else toast.success('Texto do botão salvo');
  }

  async function removeLead(lead: Lead) {
    if (!window.confirm('Apagar este contato?')) return;
    const { error } = await supabase.from('page_leads').delete().eq('id', lead.id);
    if (error) { toast.error(error.message); return; }
    setLeads(list => list.filter(l => l.id !== lead.id));
  }

  function exportCsv() {
    const rows = [['Nome', 'E-mail', 'WhatsApp', 'Data'], ...leads.map(l => [l.name, l.email, l.phone, new Date(l.created_at).toLocaleString('pt-BR')])];
    const csv = rows.map(r => r.map(c => csvCell(c)).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads-bioflowzy.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-4xl mb-1">Leads</h1>
      <p className="text-sm font-bold text-black/60 mb-6">Contatos deixados pelos visitantes no formulário da sua página.</p>

      {!loading && !unlocked && (
        <div className="brutal-card p-5 mb-6 bg-bioyellow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Transforme visitas em contatos</p>
              <p className="text-xs text-black/70">Adicione um botão “Fale comigo” na sua página e receba nome, e-mail e WhatsApp de quem tem interesse. Disponível no Pro.</p>
            </div>
          </div>
          <button onClick={openUpgrade} className="brutal-btn bg-black text-white px-4 py-2 text-xs shrink-0">Ver planos</button>
        </div>
      )}

      <section className={`brutal-card p-5 mb-6 ${unlocked ? '' : 'opacity-60 pointer-events-none select-none'}`}>
        <h2 className="font-display text-xl mb-3">Formulário na sua página</h2>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <label className="text-xs font-bold flex flex-col gap-1 flex-1">
            Texto do botão
            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={60} className="brutal-input px-3 py-2 text-sm font-normal" />
          </label>
          {formLink ? (
            <div className="flex gap-2">
              <button onClick={saveTitle} className="brutal-btn bg-white px-4 py-2 text-xs">Salvar texto</button>
              <button onClick={disableForm} disabled={busy} className="brutal-btn bg-white px-4 py-2 text-xs disabled:opacity-50">Remover botão</button>
            </div>
          ) : (
            <button onClick={enableForm} disabled={busy || !profileId} className="brutal-btn bg-bioyellow px-4 py-2 text-xs disabled:opacity-50">Adicionar botão à página</button>
          )}
        </div>
        <p className="text-[11px] opacity-60 mt-2">
          {formLink
            ? 'O botão aparece na sua página como um link. Para mudar a posição, arraste em Links.'
            : 'O botão entra como o primeiro link da sua página e abre um formulário com nome, e-mail, WhatsApp e autorização de contato.'}
        </p>
      </section>

      <section className="brutal-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 flex-wrap p-5 border-b-2 border-black">
          <div>
            <h2 className="font-display text-xl">Contatos recebidos</h2>
            {usage && usage.limit > 0 && (
              <p className="text-xs font-bold text-black/60">{usage.used} de {usage.limit} neste mês</p>
            )}
          </div>
          <button
            onClick={canExport ? exportCsv : undefined}
            disabled={!canExport || leads.length === 0}
            title={canExport ? 'Exportar CSV' : 'Exportação disponível no plano Business (em breve)'}
            className="brutal-btn bg-white px-3 py-2 text-xs gap-2 disabled:opacity-50"
          >
            {canExport ? <Download className="w-4 h-4" /> : <Lock className="w-4 h-4" />} Exportar CSV
          </button>
        </div>
        {leads.length === 0 ? (
          <p className="p-8 text-center text-sm text-black/50">Nenhum contato ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-black bg-gray-50">
                  <th className="text-left px-4 py-3 font-display text-xs uppercase tracking-wider">Nome</th>
                  <th className="text-left px-4 py-3 font-display text-xs uppercase tracking-wider">Contato</th>
                  <th className="text-left px-4 py-3 font-display text-xs uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {leads.map(l => (
                  <tr key={l.id} className="border-b border-gray-100">
                    <td className="px-4 py-3 font-bold">{l.name || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {l.email && (
                          <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1 text-xs hover:underline"><Mail className="w-3 h-3" /> {l.email}</a>
                        )}
                        {l.phone && (
                          <a href={`https://wa.me/${l.phone}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs hover:underline"><MessageCircle className="w-3 h-3" /> {l.phone}</a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(l.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => removeLead(l)} className="p-1.5 hover:bg-gray-100 rounded" aria-label="Apagar contato">
                        <Trash2 className="w-4 h-4 text-gray-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
