import { Nav } from '@/components/landing/Nav';
import { Hero } from '@/components/landing/Hero';
import { Marquee } from '@/components/landing/Marquee';
import { Features } from '@/components/landing/Features';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { NicheShowcase } from '@/components/landing/NicheShowcase';
import { FeatureShowcase } from '@/components/landing/FeatureShowcase';
import { ThemeGallery } from '@/components/landing/ThemeGallery';
import { BusinessSection } from '@/components/landing/BusinessSection';
import { Comparison } from '@/components/landing/Comparison';
import { Testimonials } from '@/components/landing/Testimonials';
import { ReferralCalculator } from '@/components/landing/ReferralCalculator';
import { Pricing } from '@/components/landing/Pricing';
import { FAQ } from '@/components/landing/FAQ';
import { Footer } from '@/components/landing/Footer';
import { fetchSocialProof } from '@/lib/theme-showcase';
import { fetchLandingNiches } from '@/lib/landing-niches';
import { fetchTestimonials, fetchThemeGallery } from '@/lib/landing-content';

export default async function Home() {
  const [socialProof, niches, gallery, testimonials] = await Promise.all([
    fetchSocialProof(),
    fetchLandingNiches(),
    fetchThemeGallery(),
    fetchTestimonials(),
  ]);

  return (
    <main className="min-h-screen bg-white">
      <Nav />
      <Hero socialProof={socialProof} />
      <Marquee />
      <HowItWorks />
      <NicheShowcase niches={niches} />
      <Features />
      <FeatureShowcase />
      <ThemeGallery data={gallery} />
      <BusinessSection />
      <Comparison />
      <Testimonials items={testimonials} />
      <Pricing />
      <ReferralCalculator />
      <FAQ />
      <Footer />
    </main>
  );
}
