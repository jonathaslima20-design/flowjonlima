import Link from 'next/link';
import { Waypoints } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-black text-white border-t-2 border-black">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 grid md:grid-cols-3 gap-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 bg-bioyellow brutal-border flex items-center justify-center">
              <Waypoints className="w-5 h-5 text-black" />
            </span>
            <span className="font-display text-xl">BioFlowzy</span>
          </div>
          <p className="mt-4 text-sm text-white/80">Um link para compartilhar tudo o que importa.</p>
        </div>
        <FooterCol title="Produto" items={[
          { label: 'Recursos', href: '/#features' },
          { label: 'Preços', href: '/#pricing' },
          { label: 'Exemplos', href: '/exemplos' },
          { label: 'Para agências', href: '/#agencias' },
        ]} />
        <FooterCol title="Legal" items={[
          { label: 'Termos de Uso', href: '/termos' },
          { label: 'Privacidade', href: '/privacidade' },
          { label: 'Cookies', href: '/privacidade#cookies' },
          { label: 'Direitos autorais', href: '/termos#direitos-autorais' },
        ]} />
      </div>
      <div className="border-t-2 border-white/20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 flex items-center justify-center text-xs">
          <span>© 2026 BioFlowzy. Todos os direitos reservados.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="font-display text-sm mb-4">{title}</h4>
      <ul className="space-y-2 text-sm text-white/80">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="hover:text-bioyellow">{i.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
