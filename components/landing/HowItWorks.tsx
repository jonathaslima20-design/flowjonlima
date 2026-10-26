import Link from 'next/link';
import { ArrowRight, LayoutTemplate, Link2, Share2 } from 'lucide-react';

const steps = [
  {
    icon: LayoutTemplate,
    bg: 'bg-bioyellow',
    title: 'Escolha um modelo',
    desc: 'Comece com um modelo pronto para o seu tipo de negócio e um tema com a cara da sua marca.',
  },
  {
    icon: Link2,
    bg: 'bg-biolime',
    title: 'Adicione seus links',
    desc: 'WhatsApp, loja, redes sociais, vídeos e banners. Arraste para ordenar e veja a prévia na hora.',
  },
  {
    icon: Share2,
    bg: 'bg-bioblue',
    title: 'Cole na sua bio',
    desc: 'Copie bioflowzy.com/seunome e coloque no Instagram, TikTok, WhatsApp ou no QR code da sua loja.',
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24 bg-biolime/20 border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="max-w-2xl">
          <span className="inline-block bg-black text-white px-3 py-1 text-xs font-bold">COMO FUNCIONA</span>
          <h2 className="font-display text-4xl md:text-5xl mt-4">Sua página no ar em 3 passos.</h2>
          <p className="mt-4 text-base text-black/70">Sem código, sem designer e sem cartão de crédito. Leva menos tempo que um café.</p>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {steps.map(({ icon: Icon, bg, title, desc }, i) => (
            <div key={title} className="brutal-card p-6 bg-white relative">
              <span className="absolute -top-4 -left-3 w-10 h-10 bg-black text-white font-display text-xl flex items-center justify-center brutal-border">
                {i + 1}
              </span>
              <div className={`w-14 h-14 ${bg} brutal-border flex items-center justify-center mb-5 mt-2`}>
                <Icon className={`w-7 h-7 ${bg === 'bg-bioblue' ? 'text-white' : 'text-black'}`} />
              </div>
              <h3 className="font-display text-xl mb-2">{title}</h3>
              <p className="text-sm text-black/80 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Link href="/register" className="brutal-btn bg-bioblue text-white px-6 py-3 gap-2">
            Criar minha página grátis <ArrowRight className="w-4 h-4" />
          </Link>
          <span className="text-sm font-bold text-black/60">Grátis para sempre · Sem cartão de crédito</span>
        </div>
      </div>
    </section>
  );
}
