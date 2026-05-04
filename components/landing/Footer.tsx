import Link from 'next/link';
import { Instagram, Youtube, Twitter, Github, Waypoints } from 'lucide-react';

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
          <div className="mt-5 flex gap-3">
            {[Instagram, Youtube, Twitter, Github].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-10 h-10 bg-black border-2 border-white flex items-center justify-center active:translate-x-[2px] active:translate-y-[2px] transition-transform"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
        <FooterCol title="Produto" items={['Recursos', 'Preços', 'Templates', 'Integrações']} />
        <FooterCol title="Legal" items={['Termos', 'Privacidade', 'Cookies', 'DMCA']} />
      </div>
      <div className="border-t-2 border-white/20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 flex items-center justify-center text-xs">
          <span>© 2026 BioFlowzy. Todos os direitos reservados.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="font-display text-sm mb-4">{title}</h4>
      <ul className="space-y-2 text-sm text-white/80">
        {items.map((i) => (
          <li key={i}>
            <Link href="#" className="hover:text-bioyellow">{i}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
