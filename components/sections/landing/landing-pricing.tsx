import { PricingCard, type PricingTier } from "./pricing-card";

const tiers: PricingTier[] = [
  {
    name: "Hobby",
    price: "$0",
    cadence: "/mo",
    tagline: "For side projects and trying things out.",
    features: [
      "3 schemas",
      "3 endpoints",
      "1 access token",
      "10k requests / month",
      "Community support",
    ],
    cta: { label: "Get started", href: "/sign-up" },
    featured: false,
  },
  {
    name: "Pro",
    price: "$19",
    cadence: "/mo",
    tagline: "For production apps that need room to grow.",
    features: [
      "Unlimited schemas & endpoints",
      "10 access tokens",
      "1M requests / month",
      "Higher rate limits",
      "Email support",
    ],
    cta: { label: "Start free trial", href: "/sign-up" },
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    tagline: "For teams with scale, security, and SLA needs.",
    features: [
      "Unlimited everything",
      "SSO & audit logs",
      "Custom rate limits",
      "Dedicated support & SLA",
      "On-prem / VPC options",
    ],
    cta: { label: "Contact sales", href: "mailto:sales@example.com" },
    featured: false,
  },
];

export function LandingPricing({ signedIn }: { signedIn: boolean }) {
  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-8 px-6 py-16">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Simple, transparent pricing</h2>
        <p className="mx-auto mt-2 max-w-xl text-slate-600">
          Start free and upgrade when you need more endpoints, tokens, and throughput.
        </p>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {tiers.map((tier) => (
          <PricingCard key={tier.name} tier={tier} signedIn={signedIn} />
        ))}
      </div>
    </section>
  );
}
