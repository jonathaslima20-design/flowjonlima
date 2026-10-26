import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Nav } from '@/components/landing/Nav';
import { Footer } from '@/components/landing/Footer';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { ExampleNiches } from '@/components/landing/ExampleNiches';
import { AttributionCapture } from '@/components/landing/AttributionCapture';
import { fetchLandingNiches } from '@/lib/landing-niches';

// Mesmos exemplos da seção "Para quem é" (Admin → Nichos da landing); atualiza a cada 5 minutos
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Exemplos de link na bio para lojas, criadores, profissionais e restaurantes | BioFlowzy',
  description: 'Veja exemplos de páginas de link na bio para cada tipo de negócio e crie a sua grátis em 2 minutos: WhatsApp, cardápio, agendamento, catálogo e muito mais.',
  alternates: { canonical: '/exemplos' },
  openGraph: {
    title: 'Exemplos de link na bio | BioFlowzy',
    description: 'Páginas de exemplo para lojas, criadores, profissionais liberais, restaurantes e agências.',
    url: '/exemplos',
  },
};

export default async function ExamplesPage() {
  const niches = await fetchLandingNiches();

  return (
    <main className="min-h-screen bg-white">
      <Nav />
      <section className="pt-32 pb-16 bg-biolime/20 border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <span className="inline-block bg-black text-white px-3 py-1 text-xs font-bold">EXEMPLOS</span>
          <h1 className="font-display text-4xl md:text-6xl mt-4 leading-[0.95]">Exemplos de link na bio para o seu negócio</h1>
          <p className="mt-5 text-base md:text-lg text-black/70">
            Inspire-se nestas páginas e monte a sua em minutos, com o modelo do seu nicho já pronto no painel.
          </p>
          <Link href="/register" className="mt-8 brutal-btn bg-bioblue text-white px-6 py-3 gap-2 inline-flex">
            Criar minha página grátis <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <ExampleNiches niches={niches} />

      <FinalCTA />
      <Footer />
      <AttributionCapture />
    </main>
  );
}
