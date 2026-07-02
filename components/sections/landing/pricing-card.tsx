import Link from "next/link";
import { useTranslation } from "react-i18next";
import { CheckIcon } from "@/components/atoms/icons/check-icon";

export interface PricingTier {
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
  cta: { label: string; href: string };
  featured: boolean;
}

export function PricingCard({
  tier,
  signedIn,
}: {
  tier: PricingTier;
  signedIn: boolean;
}) {
  const { t } = useTranslation();
  // When signed in, every CTA becomes "Go to my account" → the billing page.
  const ctaHref = signedIn ? "/dashboard/account/billing" : tier.cta.href;
  const ctaLabel = signedIn ? t("landing.pricing.signedInCta") : tier.cta.label;

  return (
    <div
      className={
        "relative flex flex-col rounded-lg border bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900/80 " +
        (tier.featured
          ? "border-indigo-300 ring-2 ring-indigo-200 dark:border-indigo-500/60 dark:ring-indigo-500/20"
          : "border-slate-200 dark:border-slate-800")
      }
    >
      {tier.featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm dark:bg-indigo-500">
          {t("landing.pricing.mostPopular")}
        </span>
      )}

      <h3 className="text-lg font-semibold text-slate-900">{tier.name}</h3>
      <p className="mt-1 text-sm text-slate-500">{tier.tagline}</p>

      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-4xl font-bold text-slate-900">{tier.price}</span>
        {tier.cadence && <span className="text-sm text-slate-500">{tier.cadence}</span>}
      </div>

      <ul className="mt-6 flex-1 space-y-3">
        {tier.features.map((feat) => (
          <li key={feat} className="flex items-start gap-2.5 text-sm text-slate-600">
            <CheckIcon size={18} className="mt-0.5 shrink-0 text-indigo-600" />
            {feat}
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        className={
          "mt-8 inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition " +
          (tier.featured
            ? "bg-indigo-600 text-white shadow-sm hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-md dark:bg-indigo-500 dark:hover:bg-indigo-400"
            : "border border-slate-200 bg-white text-slate-800 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800")
        }
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
