import './globals.css';
import type { Metadata } from 'next';
import {
  Archivo_Black,
  Space_Grotesk,
  Playfair_Display,
  Inter,
  JetBrains_Mono,
  DM_Sans,
  Fraunces,
  Manrope,
  Syne,
  Bricolage_Grotesque,
  Cormorant_Garamond,
  DM_Serif_Display,
  IBM_Plex_Mono,
  Caveat,
  Press_Start_2P,
  Anton,
  Instrument_Serif,
  Unbounded,
} from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { SiteTracking } from '@/components/shared/SiteTracking';

const archivo = Archivo_Black({ subsets: ['latin'], weight: '400', variable: '--font-archivo-black', display: 'swap', preload: true });
const grotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk', display: 'swap', preload: true });
// Fontes dos temas: sem preload, o navegador só baixa as que o tema da página usa
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap', preload: false });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap', preload: false });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap', preload: false });
const dmsans = DM_Sans({ subsets: ['latin'], variable: '--font-dmsans', display: 'swap', preload: false });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap', preload: false });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap', preload: false });
const syne = Syne({ subsets: ['latin'], variable: '--font-syne', display: 'swap', preload: false });
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', display: 'swap', preload: false, adjustFontFallback: false });
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-cormorant', display: 'swap', preload: false });
const dmserif = DM_Serif_Display({ subsets: ['latin'], weight: '400', variable: '--font-dmserif', display: 'swap', preload: false });
const ibmplex = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-ibmplex', display: 'swap', preload: false });
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat', display: 'swap', preload: false });
const pixel = Press_Start_2P({ subsets: ['latin'], weight: '400', variable: '--font-pixel', display: 'swap', preload: false });
const anton = Anton({ subsets: ['latin'], weight: '400', variable: '--font-anton', display: 'swap', preload: false });
const instrument = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-instrument', display: 'swap', preload: false });
const unbounded = Unbounded({ subsets: ['latin'], variable: '--font-unbounded', display: 'swap', preload: false });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bioflowzy.com';

const baseMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'BioFlowzy — Sua bio, seu link, seu universo',
  description: 'Crie sua página de link na bio em minutos: WhatsApp, redes sociais, contatos, analytics e domínio próprio.',
  icons: {
    icon: '/favicon-48.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'BioFlowzy — Um link para compartilhar tudo o que importa',
    description: 'Crie uma página de bio link em minutos. Compartilhe tudo em um só lugar.',
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl,
    siteName: 'BioFlowzy',
    images: [
      {
        url: '/og-home.png',
        width: 989,
        height: 948,
        alt: 'BioFlowzy',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'BioFlowzy — Um link para compartilhar tudo o que importa',
    description: 'Crie uma página de bio link em minutos. Compartilhe tudo em um só lugar.',
    images: ['/og-home.png'],
  },
};

type MetaPixelSetting = { pixel_id?: string; enabled?: boolean; domain_verification?: string };

// Meta Pixel do site (Admin → Rastreamento). Leitura pública pela REST com cache de 5 min,
// sem o cliente do Supabase para não tirar as páginas do ISR.
async function readMetaPixel(): Promise<MetaPixelSetting | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/admin_settings?key=eq.meta_pixel&select=value`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return rows?.[0]?.value ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const meta = await readMetaPixel();
  const code = meta?.domain_verification?.trim();
  return code && /^[a-z0-9]{10,64}$/i.test(code)
    ? { ...baseMetadata, other: { 'facebook-domain-verification': code } }
    : baseMetadata;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const meta = await readMetaPixel();
  const pixelId = meta?.enabled && /^\d{6,20}$/.test(meta.pixel_id ?? '') ? meta.pixel_id! : null;
  const classes = [
    archivo.variable, grotesk.variable, playfair.variable, inter.variable,
    jetbrains.variable, dmsans.variable, fraunces.variable, manrope.variable,
    syne.variable, bricolage.variable, cormorant.variable, dmserif.variable, ibmplex.variable,
    caveat.variable, pixel.variable, anton.variable, instrument.variable, unbounded.variable,
  ].join(' ');
  return (
    <html lang="pt-BR" className={classes}>
      <body className="antialiased bg-white text-black"><AuthProvider>{children}<SiteTracking pixelId={pixelId} /></AuthProvider></body>
    </html>
  );
}
