"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAccountProfile, useUpgradePlan } from "@/lib/client/hooks";
import { ApiError } from "@/lib/client/api";
import type { Plan } from "@/lib/client/types";
import { Spinner } from "@/components/atoms/spinner";
import { PlanCard, type PlanTier } from "@/components/sections/dashboard/account/plan-card";
import { ToastStack, type ToastData } from "@/components/molecules/toast";

const PLAN_ORDER: Plan[] = ["hobby", "pro", "enterprise"];

export default function BillingPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useAccountProfile();
  const upgrade = useUpgradePlan();
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toastId = useRef(0);

  const pushToast = useCallback((message: string, tone: ToastData["tone"]) => {
    toastId.current += 1;
    setToasts((prev) => [...prev, { id: toastId.current, message, tone }]);
  }, []);
  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const tiers: PlanTier[] = PLAN_ORDER.map((key) => ({
    key,
    name: t(`landing.pricing.tiers.${key}.name`),
    price: t(`landing.pricing.tiers.${key}.price`),
    cadence: t(`landing.pricing.tiers.${key}.cadence`),
    tagline: t(`landing.pricing.tiers.${key}.tagline`),
    features: t(`landing.pricing.tiers.${key}.features`, { returnObjects: true }) as string[],
    featured: key === "pro",
  }));

  async function onSelect(plan: Plan) {
    try {
      await upgrade.mutateAsync(plan);
      pushToast(t("account.billing.switched"), "success");
    } catch (err) {
      pushToast(err instanceof ApiError ? err.message : t("account.billing.switchFailed"), "error");
    }
  }

  if (isLoading || !data) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <Spinner /> {t("common.loading")}
      </div>
    );
  }

  const canChange = data.role === "owner" || data.role === "admin";

  return (
    <div>
      <p className="text-sm text-slate-500">{t("account.billing.description")}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {tiers.map((tier) => (
          <PlanCard
            key={tier.key}
            tier={tier}
            active={tier.key === data.organization.plan}
            canChange={canChange}
            pending={upgrade.isPending}
            onSelect={() => onSelect(tier.key)}
          />
        ))}
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
