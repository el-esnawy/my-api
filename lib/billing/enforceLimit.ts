import type { NextResponse } from "next/server";
import { Organization } from "@/lib/models/Organization";
import { DataSchema } from "@/lib/models/DataSchema";
import { Endpoint } from "@/lib/models/Endpoint";
import { AccessToken } from "@/lib/models/AccessToken";
import { limitsFor } from "./plans";
import { forbidden, type ApiTranslator } from "@/lib/api/respond";

type Resource = "schemas" | "endpoints" | "tokens";

const COUNTERS: Record<Resource, (organizationId: string) => Promise<number>> = {
  schemas: (organizationId) => DataSchema.countDocuments({ organizationId }),
  endpoints: (organizationId) => Endpoint.countDocuments({ organizationId }),
  tokens: (organizationId) => AccessToken.countDocuments({ organizationId }),
};

const LIMIT_KEYS: Record<Resource, "maxSchemas" | "maxEndpoints" | "maxTokens"> = {
  schemas: "maxSchemas",
  endpoints: "maxEndpoints",
  tokens: "maxTokens",
};

const ERROR_KEYS: Record<Resource, string> = {
  schemas: "api.errors.planLimitSchemas",
  endpoints: "api.errors.planLimitEndpoints",
  tokens: "api.errors.planLimitTokens",
};

/**
 * Blocks creating a new schema/endpoint/token once an organization has hit
 * its plan's cap (the caps advertised on the pricing page). Assumes the
 * caller has already called `connectDB()`.
 */
export async function assertUnderLimit(
  organizationId: string,
  resource: Resource,
  t?: ApiTranslator
): Promise<{ response: NextResponse } | null> {
  const org = await Organization.findById(organizationId).select("plan");
  const plan = org?.plan ?? "hobby";
  const limit = limitsFor(plan)[LIMIT_KEYS[resource]];
  if (!Number.isFinite(limit)) return null;

  const count = await COUNTERS[resource](organizationId);
  if (count < limit) return null;

  return {
    response: forbidden(t?.(ERROR_KEYS[resource], { limit, plan })),
  };
}
