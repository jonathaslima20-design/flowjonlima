'use client';

import { useEffect, useState } from 'react';
import { UserRoundCog, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { readImpersonation, stopImpersonation, type ImpersonationState } from '@/lib/impersonation';

// Faixa fixa enquanto o admin está dentro da conta de um usuário ("Entrar como o usuário")
export function ImpersonationBanner() {
  const { ready, userId } = useAuth();
  const [state, setState] = useState<ImpersonationState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const s = readImpersonation();
    // Só vale enquanto a sessão aberta é a do usuário acessado
    setState(s && userId === s.targetId ? s : null);
  }, [ready, userId]);

  useEffect(() => {
    if (!state) return;
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, [state]);

  useEffect(() => {
    if (state && now >= state.expiresAt && !leaving) {
      setLeaving(true);
      stopImpersonation('expired');
    }
  }, [state, now, leaving]);

  if (!state) return null;

  const minutes = Math.max(0, Math.ceil((state.expiresAt - now) / 60000));

  return (
    <div className="fixed bottom-0 inset-x-0 z-[300] bg-biored text-white border-t-2 border-black">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 flex-wrap">
        <UserRoundCog className="w-4 h-4 shrink-0" />
        <p className="text-sm font-bold flex-1 min-w-0">
          Você está como <span className="underline">@{state.targetUsername}</span>.
          <span className="font-medium opacity-90"> Tudo o que fizer vale para essa conta. Expira em {minutes} min.</span>
        </p>
        <button
          onClick={() => { setLeaving(true); stopImpersonation('manual'); }}
          disabled={leaving}
          className="brutal-btn bg-white text-black px-3 py-1.5 text-xs gap-1.5 disabled:opacity-70"
        >
          {leaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
          Voltar ao admin
        </button>
      </div>
    </div>
  );
}
