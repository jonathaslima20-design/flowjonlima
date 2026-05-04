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
} from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';

const archivo = Archivo_Black({ subsets: ['latin'], weight: '400', variable: '--font-archivo-black', display: 'swap', preload: true });
const grotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk', display: 'swap', preload: true });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' });
const dmsans = DM_Sans({ subsets: ['latin'], variable: '--font-dmsans', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });
const syne = Syne({ subsets: ['latin'], variable: '--font-syne', display: 'swap' });
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', display: 'swap', adjustFontFallback: false });
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-cormorant', display: 'swap' });
const dmserif = DM_Serif_Display({ subsets: ['latin'], weight: '400', variable: '--font-dmserif', display: 'swap' });
const ibmplex = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-ibmplex', display: 'swap' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bioflowzy.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'BioFlowzy — Sua bio, seu link, seu universo',
  description: 'Plataforma brutalista de bio links. Compartilhe tudo em um só lugar.',
  icons: {
    icon: '/Gemini_Generated_Image_i7bfh0i7bfh0i7bf_(1).png',
    apple: '/Gemini_Generated_Image_i7bfh0i7bfh0i7bf_(1).png',
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
        url: `${siteUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'BioFlowzy — Um link para compartilhar tudo o que importa',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BioFlowzy — Um link para compartilhar tudo o que importa',
    description: 'Crie uma página de bio link em minutos. Compartilhe tudo em um só lugar.',
    images: [`${siteUrl}/opengraph-image`],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const classes = [
    archivo.variable, grotesk.variable, playfair.variable, inter.variable,
    jetbrains.variable, dmsans.variable, fraunces.variable, manrope.variable,
    syne.variable, bricolage.variable, cormorant.variable, dmserif.variable, ibmplex.variable,
  ].join(' ');
  return (
    <html lang="pt-BR" className={classes}>
      <body className="antialiased bg-white text-black"><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
