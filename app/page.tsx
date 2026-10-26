import { Nav } from '@/components/landing/Nav';
import { Hero } from '@/components/landing/Hero';
import { Marquee } from '@/components/landing/Marquee';
import { Features } from '@/components/landing/Features';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { NicheShowcase } from '@/components/landing/NicheShowcase';
import { FeatureShowcase } from '@/components/landing/FeatureShowcase';
import { Pricing } from '@/components/landing/Pricing';
import { FAQ } from '@/components/landing/FAQ';
import { Footer } from '@/components/landing/Footer';
import { fetchSocialProof } from '@/lib/theme-showcase';
import { fetchLandingNiches } from '@/lib/landing-niches';

export default async function Home() {
  const [socialProof, niches] = await Promise.all([fetchSocialProof(), fetchLandingNiches()]);

  return (
    <main className="min-h-screen bg-white">
      <Nav />
      <Hero socialProof={socialProof} />
      <Marquee />
      <HowItWorks />
      <NicheShowcase niches={niches} />
      <Features />
      <FeatureShowcase />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  );
}
