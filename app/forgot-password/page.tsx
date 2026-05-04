'use client';

import Link from 'next/link';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setErr(error.message);
    else setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md brutal-card p-8">
        <h1 className="font-display text-3xl text-center mb-2">Recuperar senha</h1>
        <p className="text-center text-sm mb-6">Enviaremos um link para seu email.</p>
        {sent ? (
          <div className="text-center font-bold">Link enviado! Verifique sua caixa de entrada.</div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <input className="brutal-input" type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            {err && <div className="text-sm text-biored font-bold">{err}</div>}
            <button className="brutal-btn bg-bioyellow py-3 mt-2">Enviar link</button>
          </form>
        )}
        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="font-bold underline">Voltar</Link>
        </div>
      </div>
    </div>
  );
}
