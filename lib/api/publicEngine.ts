import { NextResponse } from "next/server";
import type { HttpMethod } from "@/lib/models/Endpoint";
import { DataSchema } from "@/lib/models/DataSchema";
import { Organization } from "@/lib/models/Organization";
import { authorizePublicRequest, type AuthSuccess } from "./publicAuth";
import { rateLimit, rateLimitHeaders, checkMonthlyQuota, quotaHeaders } from "./rateLimit";
import { limitsFor } from "@/lib/billing/plans";
import { env } from "@/lib/env";
import { getRequestTranslator } from "@/i18n/server";
import type { ApiTranslator } from "./respond";
import type { SchemaFieldLike } from "@/lib/records/validate";

/**
 * Shared plumbing for the public REST engine: authorize the request, apply
 * the org's plan-derived rate limit and monthly quota, and load the
 * endpoint's schema fields. Both v1 route files funnel through `gate()` so
 * the security checks live in exactly one place.
 */

export type Gate =
  | { ok: true; auth: AuthSuccess; headers: HeadersInit; t: ApiTranslator }
  | { ok: false; response: NextResponse };

export async function gate(
  req: Request,
  slug: string,
  method: HttpMethod
): Promise<Gate> {
  const t = await getRequestTranslator(req);
  const auth = await authorizePublicRequest(req, slug, method, t);
  if (!auth.ok) {
    return {
      ok: false,
      response: NextResponse.json({ error: auth.message }, { status: auth.status }),
    };
  }

  // The tier's throughput budget is shared across every token in the org —
  // minting more tokens doesn't buy more throughput.
  const org = await Organization.findById(auth.organizationId).select("plan");
  const limits = limitsFor(org?.plan ?? "hobby");

  const rl = await rateLimit(`org:${auth.organizationId}`, limits.requestsPerMinute, env.RATE_LIMIT_WINDOW);
  const headers = { ...rateLimitHeaders(rl) };
  if (!rl.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: t("api.errors.rateLimitExceeded") },
        { status: 429, headers }
      ),
    };
  }

  const quota = await checkMonthlyQuota(auth.organizationId, limits.requestsPerMonth);
  Object.assign(headers, quotaHeaders(quota));
  if (!quota.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: t("api.errors.monthlyQuotaExceeded") },
        { status: 429, headers }
      ),
    };
  }

  return { ok: true, auth, headers, t };
}

export async function loadFields(auth: AuthSuccess): Promise<SchemaFieldLike[]> {
  const schema = await DataSchema.findById(auth.endpoint.schemaId);
  if (!schema) return [];
  return schema.fields.map((f: any) => ({
    name: f.name,
    type: f.type,
    required: !!f.required,
    unique: !!f.unique,
    enumValues: f.enumValues ?? null,
  }));
}

export function jsonWithHeaders(
  data: unknown,
  status: number,
  headers: HeadersInit
): NextResponse {
  return NextResponse.json(data, { status, headers });
}
