import Link from "next/link";
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
  // When signed in, every CTA becomes "Go to my account" → the dashboard.
  const ctaHref = signedIn ? "/dashboard/schemas" : tier.cta.href;
  const ctaLabel = signedIn ? "Go to my account" : tier.cta.label;

  return (
    <div
      className={
        "relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm " +
        (tier.featured ? "border-indigo-300 ring-2 ring-indigo-200" : "border-slate-200")
      }
    >
      {tier.featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
          Most popular
        </span>
      )}

      <h3 className="text-lg font-semibold text-slate-900">{tier.name}</h3>
      <p className="mt-1 text-sm text-slate-500">{tier.tagline}</p>

      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight text-slate-900">{tier.price}</span>
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
            ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500"
            : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50")
        }
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
