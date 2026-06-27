import { NextResponse } from "next/server";
import type { HttpMethod } from "@/lib/models/Endpoint";
import { DataSchema } from "@/lib/models/DataSchema";
import { authorizePublicRequest, type AuthSuccess } from "./publicAuth";
import { rateLimit, rateLimitHeaders } from "./rateLimit";
import type { SchemaFieldLike } from "@/lib/records/validate";

/**
 * Shared plumbing for the public REST engine: authorize the request, apply the
 * per-token rate limit, and load the endpoint's schema fields. Both v1 route
 * files funnel through `gate()` so the security checks live in exactly one place.
 */

export type Gate =
  | { ok: true; auth: AuthSuccess; headers: HeadersInit }
  | { ok: false; response: NextResponse };

export async function gate(
  req: Request,
  slug: string,
  method: HttpMethod
): Promise<Gate> {
  const auth = await authorizePublicRequest(req, slug, method);
  if (!auth.ok) {
    return {
      ok: false,
      response: NextResponse.json({ error: auth.message }, { status: auth.status }),
    };
  }

  const rl = await rateLimit(String(auth.token._id));
  const headers = rateLimitHeaders(rl);
  if (!rl.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers }
      ),
    };
  }

  return { ok: true, auth, headers };
}

export async function loadFields(auth: AuthSuccess): Promise<SchemaFieldLike[]> {
  const schema = await DataSchema.findById(auth.endpoint.schemaId);
  if (!schema) return [];
  return schema.fields.map((f: any) => ({
    name: f.name,
    type: f.type,
    required: !!f.required,
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
