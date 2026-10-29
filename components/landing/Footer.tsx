import Link from 'next/link';
import { Mail, Waypoints } from 'lucide-react';
import { IconInstagram, IconWhatsapp } from '@/lib/social-icons';
import { LEGAL } from '@/lib/legal';
import { CookiePreferencesLink } from '@/components/shared/CookieConsent';

const SUPPORT_TEXT = encodeURIComponent('Olá, gostaria de falar com o suporte do BioFlowzy');

export function Footer() {
  return (
    <footer className="bg-black text-white border-t-2 border-black">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 grid sm:grid-cols-2 md:grid-cols-4 gap-10">
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
        <div>
          <h4 className="font-display text-sm mb-4">Contato</h4>
          <ul className="space-y-3 text-sm text-white/80">
            <li>
              <a href={`${LEGAL.whatsapp}?text=${SUPPORT_TEXT}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-bioyellow">
                <IconWhatsapp className="w-4 h-4" /> Suporte no WhatsApp
              </a>
            </li>
            <li>
              <a href={LEGAL.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-bioyellow">
                <IconInstagram className="w-4 h-4" /> {LEGAL.instagramLabel}
              </a>
            </li>
            <li>
              <a href={`mailto:${LEGAL.email}`} className="inline-flex items-center gap-2 hover:text-bioyellow">
                <Mail className="w-4 h-4" /> {LEGAL.email}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm mb-4">Legal</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li><Link href="/termos" className="hover:text-bioyellow">Termos de Uso</Link></li>
            <li><Link href="/privacidade" className="hover:text-bioyellow">Privacidade</Link></li>
            <li><Link href="/privacidade#cookies" className="hover:text-bioyellow">Política de cookies</Link></li>
            <li><CookiePreferencesLink className="hover:text-bioyellow text-left" /></li>
            <li><Link href="/termos#direitos-autorais" className="hover:text-bioyellow">Direitos autorais</Link></li>
          </ul>
        </div>
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
