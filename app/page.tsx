import { Nav } from '@/components/landing/Nav';
import { Hero } from '@/components/landing/Hero';
import { Marquee } from '@/components/landing/Marquee';
import { Features } from '@/components/landing/Features';
import { Pricing } from '@/components/landing/Pricing';
import { FAQ } from '@/components/landing/FAQ';
import { Footer } from '@/components/landing/Footer';
import { fetchSocialProof } from '@/lib/theme-showcase';

export default async function Home() {
  const socialProof = await fetchSocialProof();

  return (
    <main className="min-h-screen bg-white">
      <Nav />
      <Hero socialProof={socialProof} />
      <Marquee />
      <Features />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  );
}
