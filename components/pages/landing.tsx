import { getSession } from "@/lib/auth/session";
import { LandingHeader } from "@/components/sections/landing/landing-header";
import { LandingHero } from "@/components/sections/landing/landing-hero";
import { LandingFeatures } from "@/components/sections/landing/landing-features";
import { LandingHowItWorks } from "@/components/sections/landing/landing-how-it-works";
import { LandingPricing } from "@/components/sections/landing/landing-pricing";
import { LandingFooter } from "@/components/sections/landing/landing-footer";

export default async function LandingPage() {
  const session = await getSession();
  const signedIn = !!session;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <LandingHeader signedIn={signedIn} />
      <LandingHero signedIn={signedIn} />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingPricing signedIn={signedIn} />
      <LandingFooter />
    </div>
  );
}
