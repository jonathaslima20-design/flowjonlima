'use client';

import { useEffect, useState } from 'react';
import { X, CircleCheck } from 'lucide-react';

// Visual neutro de propósito: abre por cima de qualquer tema
export function LeadFormModal({
  profileId,
  ownerName,
  title,
  onClose,
}: {
  profileId: string;
  ownerName: string;
  title: string;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim() && !phone.trim()) { setError('Informe um e-mail ou WhatsApp.'); return; }
    if (!consent) { setError('É preciso autorizar o contato.'); return; }
    setSending(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/submit_lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ p_profile_id: profileId, p_name: name, p_email: email, p_phone: phone, p_consent: consent }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.message || 'Não foi possível enviar. Tente novamente.');
        return;
      }
      setDone(true);
    } catch {
      setError('Não foi possível enviar. Verifique sua conexão.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-white text-black rounded-2xl shadow-2xl p-6 font-sans"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold leading-tight">{title}</h2>
          <button onClick={onClose} aria-label="Fechar" className="shrink-0 p-1 rounded-full hover:bg-black/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="text-center py-6">
            <CircleCheck className="w-12 h-12 mx-auto text-green-600 mb-3" />
            <p className="font-bold">Contato enviado!</p>
            <p className="text-sm text-black/60 mt-1">{ownerName} vai falar com você em breve.</p>
            <button onClick={onClose} className="mt-5 w-full rounded-xl bg-black text-white py-3 font-bold">Fechar</button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={80}
              placeholder="Seu nome"
              className="w-full rounded-xl border border-black/20 px-4 py-3 outline-none focus:border-black"
            />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              maxLength={120}
              placeholder="Seu e-mail"
              className="w-full rounded-xl border border-black/20 px-4 py-3 outline-none focus:border-black"
            />
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              maxLength={20}
              placeholder="Seu WhatsApp (com DDD)"
              className="w-full rounded-xl border border-black/20 px-4 py-3 outline-none focus:border-black"
            />
            <label className="flex items-start gap-2 text-xs text-black/70">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5" />
              <span>Autorizo {ownerName} a entrar em contato comigo pelos dados informados.</span>
            </label>
            {error && <p className="text-sm font-bold text-red-600">{error}</p>}
            <button disabled={sending} className="w-full rounded-xl bg-black text-white py-3 font-bold disabled:opacity-60">
              {sending ? 'Enviando...' : 'Enviar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
