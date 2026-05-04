import { Link2, ChartBar as BarChart3, Palette, Smartphone, Globe, Shield } from 'lucide-react';

const items = [
  { icon: Link2, bg: 'bg-bioyellow', title: 'Links ilimitados', desc: 'Adicione quantos links quiser, organize por seções e reordene com drag & drop.' },
  { icon: BarChart3, bg: 'bg-biolime', title: 'Analytics claro', desc: 'Veja cliques, origens e picos de tráfego em gráficos sólidos e objetivos.' },
  { icon: Palette, bg: 'bg-bioblue', title: 'Temas personalizáveis', desc: 'Escolha cores, bordas e sombras. De acordo com o seu estilo.' },
  { icon: Smartphone, bg: 'bg-bioyellow', title: 'Mobile first', desc: 'Sua bio fica perfeita em qualquer tela, com carregamento instantâneo.' },
  { icon: Globe, bg: 'bg-biolime', title: 'Domínio próprio', desc: 'Conecte seu domínio com um clique. Assinantes Pro sem branding.' },
  { icon: Shield, bg: 'bg-bioblue', title: 'Seguro por padrão', desc: 'Autenticação Supabase, RLS em todas as tabelas. Seus dados são seus.' },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="max-w-2xl">
          <span className="inline-block bg-black text-white px-3 py-1 text-xs font-bold">RECURSOS</span>
          <h2 className="font-display text-4xl md:text-5xl mt-4">Tudo que você precisa.</h2>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(({ icon: Icon, bg, title, desc }) => (
            <div key={title} className="brutal-card p-6 hover:-translate-y-1 transition-transform">
              <div className={`w-14 h-14 ${bg} brutal-border flex items-center justify-center mb-5`}>
                <Icon className={`w-7 h-7 ${bg === 'bg-bioblue' ? 'text-white' : 'text-black'}`} />
              </div>
              <h3 className="font-display text-xl mb-2">{title}</h3>
              <p className="text-sm text-black/80 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
