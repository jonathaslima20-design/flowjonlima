'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Waypoints } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    if (data.user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
      router.push(profile?.role === 'admin' ? '/admin' : '/dashboard');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-biolime/30 p-4">
      <div className="w-full max-w-md brutal-card p-8">
        <Link href="/" className="flex items-center gap-2 justify-center mb-6">
          <span className="w-10 h-10 bg-bioblue brutal-border flex items-center justify-center">
            <Waypoints className="w-5 h-5 text-white" />
          </span>
          <span className="font-display text-2xl">BioFlowzy</span>
        </Link>
        <h1 className="font-display text-3xl text-center mb-2">Entrar</h1>
        <p className="text-center text-sm mb-6">Bem-vindo de volta!</p>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input className="brutal-input" type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="brutal-input" type="password" required placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} />
          {err && <div className="text-sm text-biored font-bold">{err}</div>}
          <button disabled={loading} className="brutal-btn bg-bioyellow py-3 mt-2">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div className="mt-6 flex justify-between text-sm">
          <Link href="/forgot-password" className="font-bold underline">Esqueci a senha</Link>
          <Link href="/register" className="font-bold underline">Criar conta</Link>
        </div>
      </div>
    </div>
  );
}
