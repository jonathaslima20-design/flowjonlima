'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

// Chamada final antes do rodapé, com o mesmo campo de endereço do hero
export function FinalCTA() {
  const router = useRouter();
  const [username, setUsername] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = username.replace(/[^a-z0-9_.-]/gi, '').toLowerCase();
    router.push(`/register${clean ? `?username=${encodeURIComponent(clean)}` : ''}`);
  }

  return (
    <section id="comecar" className="py-24 bg-bioyellow border-y-2 border-black">
      <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
        <h2 className="font-display text-4xl md:text-6xl leading-[0.95]">Seu endereço ainda está livre?</h2>
        <p className="mt-5 text-base md:text-lg text-black/75">Garanta agora o seu bioflowzy.com/seunome. Leva 2 minutos e é grátis para sempre.</p>
        <form onSubmit={submit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
          <div className="flex flex-1 brutal-border bg-white brutal-shadow">
            <span className="bg-black text-white px-3 flex items-center text-sm font-bold shrink-0">bioflowzy.com/</span>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="seunome"
              aria-label="Seu endereço"
              className="flex-1 min-w-0 px-3 py-3 outline-none text-base"
            />
          </div>
          <button type="submit" className="brutal-btn bg-bioblue text-white px-6 py-3 gap-2">
            Criar minha página <ArrowRight className="w-4 h-4" />
          </button>
        </form>
        <p className="mt-4 text-sm font-bold text-black/60">Sem cartão de crédito · Planos pagos sem renovação automática</p>
      </div>
    </section>
  );
}
