import type { PlanName } from "@/lib/models/Organization";

export interface PlanLimits {
  maxSchemas: number;
  maxEndpoints: number;
  maxTokens: number;
  requestsPerMinute: number;
  requestsPerMonth: number;
}

/**
 * Mock billing tiers — mirrors the pricing copy in i18n (`landing.pricing.tiers`).
 * No payment processor; `Organization.plan` is switched directly via the
 * account API. Tune freely, it's all sourced from this one object.
 */
export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  hobby: {
    maxSchemas: 3,
    maxEndpoints: 3,
    maxTokens: 1,
    requestsPerMinute: 60,
    requestsPerMonth: 10_000,
  },
  pro: {
    maxSchemas: Infinity,
    maxEndpoints: Infinity,
    maxTokens: 10,
    requestsPerMinute: 600,
    requestsPerMonth: 1_000_000,
  },
  enterprise: {
    maxSchemas: Infinity,
    maxEndpoints: Infinity,
    maxTokens: Infinity,
    requestsPerMinute: 6000,
    requestsPerMonth: Infinity,
  },
};

export function limitsFor(plan: PlanName): PlanLimits {
  return PLAN_LIMITS[plan];
}
