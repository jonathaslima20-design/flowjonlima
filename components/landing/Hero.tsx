'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeCarousel } from './ThemeCarousel';
import { ArrowRight, Sparkles } from 'lucide-react';
import { fetchSocialProof, DEFAULT_SOCIAL_PROOF, SocialProofConfig } from '@/lib/theme-showcase';

export function Hero() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [socialProof, setSocialProof] = useState<SocialProofConfig>(DEFAULT_SOCIAL_PROOF);

  useEffect(() => {
    fetchSocialProof().then(setSocialProof);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = username.replace(/[^a-z0-9_.-]/gi, '').toLowerCase();
    const qs = clean ? `?username=${encodeURIComponent(clean)}` : '';
    router.push(`/register${qs}`);
  }

  return (
    <section className="relative pt-28 pb-20 overflow-hidden bg-white">
      <div className="absolute inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="max-w-7xl mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-2 bg-biolime brutal-border px-3 py-1 text-xs font-bold brutal-shadow">
            <Sparkles className="w-3 h-3" /> A evolução do seu perfil começa aqui!
          </span>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl mt-6 leading-[0.95]">
            Um link para{' '}
            <span className="bg-bioyellow brutal-border px-2 inline-block -rotate-1">
              compartilhar
            </span>{' '}
            tudo o que importa.
          </h1>
          <p className="mt-6 text-lg text-black/80 max-w-lg">
            Crie uma página de bio link bonita em minutos. Compartilhe seus links, vídeos e perfis sociais com uma única URL personalizável.
          </p>

          <form onSubmit={submit} className="mt-8 max-w-lg">
            <div className="flex items-stretch brutal-border brutal-shadow bg-white">
              <div className="flex items-center px-3 bg-black text-white font-bold text-sm whitespace-nowrap">
                bioflowzy.com/
              </div>
              <input
                type="text"
                placeholder="seunome"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-z0-9_.-]/gi, '').toLowerCase())}
                className="flex-1 min-w-0 px-3 py-3 outline-none"
              />
            </div>
            <button
              type="submit"
              className="mt-4 brutal-btn bg-bioblue text-white px-6 py-3 font-bold gap-2"
            >
              Criar agora
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4 text-xs font-bold">
            <div className="flex -space-x-2">
              {socialProof.avatars.filter(Boolean).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  className="w-8 h-8 rounded-full brutal-border object-cover"
                  alt=""
                />
              ))}
            </div>
            {socialProof.text}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -top-6 -left-6 w-20 h-20 bg-biolime brutal-border rotate-12 -z-0" />
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-bioblue brutal-border -rotate-6 -z-0" />
          <div className="relative z-10">
            <ThemeCarousel />
          </div>
        </div>
      </div>
    </section>
  );
}
