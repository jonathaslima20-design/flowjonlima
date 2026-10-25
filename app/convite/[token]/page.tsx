'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Layers, Waypoints } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { CURRENT_PAGE_STORAGE_KEY } from '@/lib/page-context';

type InviteInfo = { page_id: string; username: string; display_name: string | null; avatar_url: string | null; valid: boolean };

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { ready, userId } = useAuth();
  const [info, setInfo] = useState<InviteInfo | null | undefined>(undefined);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc('get_page_invite', { p_token: token });
      setInfo((data as unknown as InviteInfo | null) ?? null);
    })();
  }, [token]);

  async function accept() {
    setAccepting(true);
    setError('');
    const { data, error: err } = await supabase.rpc('accept_page_invite', { p_token: token });
    setAccepting(false);
    if (err) { setError(err.message); return; }
    // Abre o painel já editando a página recebida
    try { localStorage.setItem(CURRENT_PAGE_STORAGE_KEY, data as string); } catch {}
    router.push('/dashboard');
  }

  const next = encodeURIComponent(`/convite/${token}`);
  const name = info ? info.display_name || info.username : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-biolime/30 p-4">
      <div className="w-full max-w-md brutal-card p-8 text-center">
        <Link href="/" className="flex items-center gap-2 justify-center mb-6">
          <span className="w-10 h-10 bg-bioblue brutal-border flex items-center justify-center">
            <Waypoints className="w-5 h-5 text-white" />
          </span>
          <span className="font-display text-2xl">BioFlowzy</span>
        </Link>

        {info === undefined || !ready ? (
          <p className="font-bold">Carregando convite...</p>
        ) : !info || !info.valid ? (
          <>
            <h1 className="font-display text-2xl mb-2">Convite inválido</h1>
            <p className="text-sm text-black/70">Este link expirou, já foi usado ou foi cancelado. Peça um novo link a quem te convidou.</p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 mx-auto brutal-border bg-white overflow-hidden flex items-center justify-center mb-4">
              {info.avatar_url ? <img src={info.avatar_url} alt="" className="w-full h-full object-cover" /> : <Layers className="w-8 h-8" />}
            </div>
            <h1 className="font-display text-2xl">Você foi convidado</h1>
            <p className="text-sm mt-2 mb-6">
              para editar a página <b>{name}</b> <span className="text-black/60">(bioflowzy.com/{info.username})</span>.
            </p>
            {userId ? (
              <button onClick={accept} disabled={accepting} className="brutal-btn bg-bioyellow w-full py-3 disabled:opacity-50">
                {accepting ? 'Aceitando...' : 'Aceitar convite'}
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <Link href={`/login?next=${next}`} className="brutal-btn bg-bioyellow w-full py-3">Entrar para aceitar</Link>
                <Link href={`/register?next=${next}`} className="brutal-btn bg-white w-full py-3">Criar conta grátis</Link>
              </div>
            )}
            {error && <p className="text-xs font-bold text-red-600 mt-3">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
