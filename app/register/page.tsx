'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Waypoints } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUsername = (searchParams.get('username') ?? '')
    .replace(/[^a-z0-9_.-]/gi, '')
    .toLowerCase();
  const refCode = searchParams.get('ref') ?? '';
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);

    const clean = username.replace(/[^a-z0-9_.-]/gi, '').toLowerCase();
    if (!clean) { setErr('Escolha um @ válido'); setLoading(false); return; }

    const { data: taken } = await supabase.from('profiles').select('id').eq('username', clean).maybeSingle();
    if (taken) { setErr('Este @ já está em uso.'); setLoading(false); return; }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: clean,
          display_name: clean,
          ...(refCode ? { referred_by_code: refCode.toUpperCase() } : {}),
        },
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined,
      },
    });

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('already') || msg.includes('registered')) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) {
          setErr('Este email já está cadastrado. Faça login.');
          setLoading(false);
          return;
        }
        router.push('/dashboard');
        return;
      }
      if (msg.includes('rate') || msg.includes('limit')) {
        setErr('Muitas tentativas. Aguarde alguns minutos e tente novamente, ou use outro email.');
      } else {
        setErr(error.message);
      }
      setLoading(false);
      return;
    }

    if (!data.user) { setErr('Não foi possível criar a conta.'); setLoading(false); return; }

    if (!data.session) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        setErr('Conta criada. Faça login para continuar.');
        setLoading(false);
        setTimeout(() => router.push('/login'), 1500);
        return;
      }
    }

    setLoading(false);
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bioyellow/40 p-4">
      <div className="w-full max-w-md brutal-card p-8">
        <Link href="/" className="flex items-center gap-2 justify-center mb-6">
          <span className="w-10 h-10 bg-bioblue brutal-border flex items-center justify-center">
            <Waypoints className="w-5 h-5 text-white" />
          </span>
          <span className="font-display text-2xl">BioFlowzy</span>
        </Link>
        <h1 className="font-display text-3xl text-center mb-2">Criar conta</h1>
        {refCode ? (
          <p className="text-center text-sm mb-6 font-bold">Voce foi indicado! Crie sua conta gratuita.</p>
        ) : (
          <p className="text-center text-sm mb-6">Reserve seu @ agora.</p>
        )}
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex brutal-border bg-white">
            <span className="px-3 bg-black text-white font-bold flex items-center text-sm">bioflowzy.com/</span>
            <input className="flex-1 px-3 py-3 outline-none" placeholder="seunome" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <input className="brutal-input" type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="brutal-input" type="password" required minLength={6} placeholder="Senha (min 6)" value={password} onChange={e => setPassword(e.target.value)} />
          {err && <div className="text-sm text-biored font-bold">{err}</div>}
          <button disabled={loading} className="brutal-btn bg-bioblue text-white py-3 mt-2">
            {loading ? 'Criando...' : 'Criar conta grátis'}
          </button>
        </form>
        <div className="mt-6 text-center text-sm">
          Ja tem conta? <Link href="/login" className="font-bold underline">Entrar</Link>
        </div>
      </div>
    </div>
  );
}
