"use client";

import { useTranslation } from "react-i18next";
import { CheckIcon } from "@/components/atoms/icons/check-icon";
import { Button } from "@/components/atoms/button";
import { Badge } from "@/components/atoms/badge";
import { Spinner } from "@/components/atoms/spinner";
import { cn } from "@/lib/client/util";
import type { Plan } from "@/lib/client/types";

export interface PlanTier {
  key: Plan;
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
  featured?: boolean;
}

export function PlanCard({
  tier,
  active,
  canChange,
  pending,
  onSelect,
}: {
  tier: PlanTier;
  active: boolean;
  canChange: boolean;
  pending: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm",
        active ? "border-indigo-300 ring-2 ring-indigo-200" : "border-slate-200"
      )}
    >
      {active && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
          {t("account.billing.currentBadge")}
        </span>
      )}

      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-slate-900">{tier.name}</h3>
        {tier.featured && !active && <Badge tone="indigo">{t("landing.pricing.mostPopular")}</Badge>}
      </div>
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

      <Button
        className="mt-8"
        variant={active ? "secondary" : "primary"}
        disabled={active || !canChange || pending}
        onClick={onSelect}
      >
        {pending && <Spinner />}
        {active ? t("account.billing.currentPlan") : t("account.billing.upgrade")}
      </Button>
    </div>
  );
}
