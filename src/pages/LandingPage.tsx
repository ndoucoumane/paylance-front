import { ContactSection } from '../components/landing/ContactSection';
import { Developers } from '../components/landing/Developers';
import { Faq } from '../components/landing/Faq';
import { Features } from '../components/landing/Features';
import { Hero } from '../components/landing/Hero';
import { HowItWorks } from '../components/landing/HowItWorks';
import { Partners } from '../components/landing/Partners';
import { Pricing } from '../components/landing/Pricing';
import { Problem } from '../components/landing/Problem';
import { Security } from '../components/landing/Security';
import { SocialProof } from '../components/landing/SocialProof';
import { Solutions } from '../components/landing/Solutions';
import { SiteLayout } from '../components/layout/SiteLayout';
import { fr } from '../content/fr';
import { usePageTitle } from '../lib/hooks/usePageTitle';

export default function LandingPage() {
  usePageTitle(fr.meta.landingTitle);
  return (
    <SiteLayout>
      <Hero />
      <Problem />
      <HowItWorks />
      <Features />
      <Developers />
      <Security />
      <Solutions />
      <SocialProof />
      <Partners />
      <Pricing />
      <Faq />
      <ContactSection />
    </SiteLayout>
  );
}
