'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CircleCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { maskWhatsapp } from '@/lib/whatsapp';
import { PARTNER_KINDS, PARTNER_STATUS } from '@/lib/partner';

function maskDocument(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 11) {
    return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
}

// Candidatura ao programa (precisa de conta: o parceiro usa o mesmo login do painel)
export function PartnerApplyForm({ enabled }: { enabled: boolean }) {
  const { ready, userId } = useAuth();
  const [status, setStatus] = useState<string | null | undefined>(undefined);
  const [form, setForm] = useState({ kind: 'agency', name: '', company: '', document: '', whatsapp: '', channels: '', audience: '', message: '' });
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) { setStatus(null); return; }
    supabase.from('partners').select('status').eq('profile_id', userId).maybeSingle().then(({ data }) => setStatus(data?.status ?? null));
  }, [userId]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: k === 'document' ? maskDocument(e.target.value) : k === 'whatsapp' ? maskWhatsapp(e.target.value) : e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!accepted) { setError('Aceite os termos da parceria para continuar.'); return; }
    setBusy(true);
    const { error } = await supabase.rpc('apply_partner', {
      p_kind: form.kind, p_name: form.name, p_company: form.company, p_document: form.document, p_whatsapp: form.whatsapp,
      p_channels: form.channels, p_audience: form.audience, p_message: form.message,
    });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setStatus('pending');
  }

  if (!enabled) {
    return <p className="font-bold">As candidaturas estão fechadas no momento. Volte em breve!</p>;
  }
  if (!ready || status === undefined) {
    return <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }
  if (!userId) {
    return (
      <div className="text-center py-4">
        <p className="font-bold mb-1">Para se candidatar, entre ou crie sua conta grátis.</p>
        <p className="text-sm text-black/60 mb-5">Você usa o mesmo login para acessar o Painel do Parceiro.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/register?next=/parceiros%23candidatura" className="brutal-btn bg-bioblue text-white px-5 py-3">Criar conta grátis</Link>
          <Link href="/login?next=/parceiros%23candidatura" className="brutal-btn bg-white px-5 py-3">Já tenho conta</Link>
        </div>
      </div>
    );
  }
  if (status && status !== 'rejected') {
    const s = PARTNER_STATUS[status];
    return (
      <div className="text-center py-4">
        <CircleCheck className="w-10 h-10 mx-auto" />
        <p className="font-display text-2xl mt-2">{status === 'pending' ? 'Candidatura enviada!' : 'Você já é parceiro'}</p>
        <p className="text-sm text-black/70 mt-1 mb-5">
          {status === 'pending'
            ? 'Vamos analisar e responder pelo WhatsApp em até 2 dias úteis. Acompanhe pelo painel.'
            : `Status: ${s?.label ?? status}.`}
        </p>
        <Link href="/dashboard/parceiro" className="brutal-btn bg-black text-white px-5 py-3 inline-flex">Abrir Painel do Parceiro</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
      {status === 'rejected' && (
        <p className="sm:col-span-2 text-sm font-bold bg-red-50 brutal-border p-3">Sua candidatura anterior não foi aprovada. Você pode enviar uma nova com mais detalhes.</p>
      )}
      <Field label="Você é *" full>
        <select value={form.kind} onChange={set('kind')} className="w-full brutal-input px-3 py-2.5 text-sm bg-white">
          {Object.entries(PARTNER_KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </Field>
      <Field label="Seu nome *"><input required value={form.name} onChange={set('name')} className="w-full brutal-input px-3 py-2.5 text-sm" /></Field>
      <Field label="Empresa / marca"><input value={form.company} onChange={set('company')} className="w-full brutal-input px-3 py-2.5 text-sm" /></Field>
      <Field label="CPF ou CNPJ *"><input required inputMode="numeric" value={form.document} onChange={set('document')} className="w-full brutal-input px-3 py-2.5 text-sm" /></Field>
      <Field label="WhatsApp *"><input required inputMode="numeric" value={form.whatsapp} onChange={set('whatsapp')} placeholder="(11) 99999-9999" className="w-full brutal-input px-3 py-2.5 text-sm" /></Field>
      <Field label="Onde você divulga (site, Instagram, canais)" full>
        <input value={form.channels} onChange={set('channels')} placeholder="@suaagencia, site.com.br, canal no YouTube…" className="w-full brutal-input px-3 py-2.5 text-sm" />
      </Field>
      <Field label="Audiência ou nº de clientes" full>
        <input value={form.audience} onChange={set('audience')} placeholder="Ex.: 40 clientes ativos, 25 mil seguidores" className="w-full brutal-input px-3 py-2.5 text-sm" />
      </Field>
      <Field label="Como pretende indicar o BioFlowzy?" full>
        <textarea value={form.message} onChange={set('message')} rows={3} className="w-full brutal-input px-3 py-2.5 text-sm" />
      </Field>
      <label className="sm:col-span-2 flex items-start gap-2 text-xs">
        <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="mt-0.5" />
        <span>
          Li e aceito as regras do programa nesta página: comissão sobre pagamentos aprovados, carência antes da liberação, estorno em
          reembolso ou chargeback, proibição de autoindicação, spam e anúncios usando a marca BioFlowzy, e os{' '}
          <Link href="/termos" target="_blank" className="underline font-bold">Termos de Uso</Link>.
        </span>
      </label>
      {error && <p className="sm:col-span-2 text-sm font-bold text-biored">{error}</p>}
      <button disabled={busy} className="sm:col-span-2 brutal-btn bg-black text-white py-3.5 gap-2 disabled:opacity-60">
        {busy && <Loader2 className="w-4 h-4 animate-spin" />} Enviar candidatura
      </button>
    </form>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
