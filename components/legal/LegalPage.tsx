import type { ReactNode } from 'react';
import Link from 'next/link';
import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';
import { LEGAL } from '@/lib/legal';

// Moldura das páginas legais (Termos e Privacidade)
export function LegalPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-white">
      <Nav />
      <article className="max-w-3xl mx-auto px-4 md:px-6 pt-32 pb-20">
        <span className="inline-block bg-black text-white px-3 py-1 text-xs font-bold">LEGAL</span>
        <h1 className="font-display text-4xl md:text-5xl mt-4">{title}</h1>
        <p className="mt-2 text-sm text-black/60">Última atualização: {LEGAL.updatedAt}</p>
        <p className="mt-6 text-base leading-relaxed text-black/80">{intro}</p>
        <div className="mt-10 flex flex-col gap-10">{children}</div>
        <div className="mt-12 brutal-card p-5 bg-biolime/30 text-sm">
          <p className="font-bold">Contato</p>
          <ContactLines />
          <p className="mt-3">
            Veja também: <Link href="/termos" className="underline font-bold">Termos de Uso</Link> ·{' '}
            <Link href="/privacidade" className="underline font-bold">Política de Privacidade</Link>
          </p>
        </div>
      </article>
      <Footer />
    </main>
  );
}

export function ContactLines() {
  return (
    <div className="mt-1 text-black/80 space-y-1">
      {LEGAL.company && <p>{LEGAL.company}{LEGAL.cnpj ? ` · CNPJ ${LEGAL.cnpj}` : ''}</p>}
      {LEGAL.email && <p>E-mail: <a href={`mailto:${LEGAL.email}`} className="underline">{LEGAL.email}</a></p>}
      <p>WhatsApp do suporte: <a href={LEGAL.whatsapp} target="_blank" rel="noopener noreferrer" className="underline">fale com a gente</a></p>
    </div>
  );
}

export function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="font-display text-2xl mb-3">{title}</h2>
      <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-black/80 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-black">
        {children}
      </div>
    </section>
  );
}
