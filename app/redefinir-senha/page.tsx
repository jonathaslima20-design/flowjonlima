'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Waypoints } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

// Destino do link de redefinição de senha (e-mail "Esqueci a senha" ou link gerado pelo admin)
export default function ResetPasswordPage() {
  const router = useRouter();
  const { ready, userId, role } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (password.length < 6) { setErr('A senha precisa ter pelo menos 6 caracteres.'); return; }
    if (password !== confirm) { setErr('As senhas não são iguais.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setErr(/different|same/i.test(error.message) ? 'Escolha uma senha diferente da atual.' : error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push(role === 'admin' ? '/admin' : '/dashboard'), 1500);
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
        <h1 className="font-display text-3xl text-center mb-2">Nova senha</h1>

        {!ready ? (
          <p className="text-center text-sm font-bold">Carregando...</p>
        ) : !userId ? (
          <div className="text-center">
            <p className="text-sm mb-6">O link expirou ou já foi usado. Peça um novo link de redefinição.</p>
            <Link href="/forgot-password" className="brutal-btn bg-bioyellow py-3 w-full">Pedir novo link</Link>
          </div>
        ) : done ? (
          <p className="text-center font-bold">Senha alterada! Entrando no painel...</p>
        ) : (
          <>
            <p className="text-center text-sm mb-6">Escolha a nova senha da sua conta.</p>
            <form onSubmit={submit} className="flex flex-col gap-3">
              <input className="brutal-input" type="password" required autoComplete="new-password" placeholder="Nova senha" value={password} onChange={e => setPassword(e.target.value)} />
              <input className="brutal-input" type="password" required autoComplete="new-password" placeholder="Repita a nova senha" value={confirm} onChange={e => setConfirm(e.target.value)} />
              {err && <div className="text-sm text-biored font-bold">{err}</div>}
              <button disabled={loading} className="brutal-btn bg-bioyellow py-3 mt-2">
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
