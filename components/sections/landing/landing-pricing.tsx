"use client";

import { useTranslation } from "react-i18next";
import { PricingCard, type PricingTier } from "./pricing-card";

function usePricingTiers(): PricingTier[] {
  const { t } = useTranslation();
  return [
  {
    name: t("landing.pricing.tiers.hobby.name"),
    price: t("landing.pricing.tiers.hobby.price"),
    cadence: t("landing.pricing.tiers.hobby.cadence"),
    tagline: t("landing.pricing.tiers.hobby.tagline"),
    features: t("landing.pricing.tiers.hobby.features", { returnObjects: true }) as string[],
    cta: { label: t("landing.pricing.tiers.hobby.cta"), href: "/sign-up" },
    featured: false,
  },
  {
    name: t("landing.pricing.tiers.pro.name"),
    price: t("landing.pricing.tiers.pro.price"),
    cadence: t("landing.pricing.tiers.pro.cadence"),
    tagline: t("landing.pricing.tiers.pro.tagline"),
    features: t("landing.pricing.tiers.pro.features", { returnObjects: true }) as string[],
    cta: { label: t("landing.pricing.tiers.pro.cta"), href: "/sign-up" },
    featured: true,
  },
  {
    name: t("landing.pricing.tiers.enterprise.name"),
    price: t("landing.pricing.tiers.enterprise.price"),
    cadence: t("landing.pricing.tiers.enterprise.cadence"),
    tagline: t("landing.pricing.tiers.enterprise.tagline"),
    features: t("landing.pricing.tiers.enterprise.features", { returnObjects: true }) as string[],
    cta: { label: t("landing.pricing.tiers.enterprise.cta"), href: "mailto:sales@example.com" },
    featured: false,
  },
  ];
}

export function LandingPricing({ signedIn }: { signedIn: boolean }) {
  const { t } = useTranslation();
  const tiers = usePricingTiers();

  return (
    <section id="pricing" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">Plans</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{t("landing.pricing.title")}</h2>
        <p className="mx-auto mt-2 max-w-xl text-slate-600">
          {t("landing.pricing.description")}
        </p>
      </div>
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {tiers.map((tier) => (
          <PricingCard key={tier.name} tier={tier} signedIn={signedIn} />
        ))}
      </div>
    </section>
  );
}
