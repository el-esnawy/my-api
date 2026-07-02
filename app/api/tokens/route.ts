import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { AccessToken } from "@/lib/models/AccessToken";
import { Endpoint } from "@/lib/models/Endpoint";
import { requireSession } from "@/lib/api/dashboardAuth";
import { assertUnderLimit } from "@/lib/billing/enforceLimit";
import { createTokenInput } from "@/lib/validation/schemas";
import { generateAccessToken } from "@/lib/auth/token";
import { serializeToken } from "@/lib/api/serialize";
import { getRequestTranslator } from "@/i18n/server";
import {
  badRequest,
  created,
  ok,
  withErrorHandling,
  zodErrors,
} from "@/lib/api/respond";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(req);
    const auth = await requireSession(t);
    if ("response" in auth) return auth.response;

    await connectDB();
    const tokens = await AccessToken.find({ organizationId: auth.session.orgId }).sort({
      createdAt: -1,
    });
    return ok({ tokens: tokens.map(serializeToken) });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(req);
    const auth = await requireSession(t);
    if ("response" in auth) return auth.response;

    const body = await req.json().catch(() => null);
    const parsed = createTokenInput.safeParse(body);
    if (!parsed.success) {
      return badRequest(t("api.errors.validationFailed"), { fields: zodErrors(parsed.error, t) });
    }

    await connectDB();
    const limitErr = await assertUnderLimit(auth.session.orgId, "tokens", t);
    if (limitErr) return limitErr.response;

    // Every granted endpoint must exist and belong to this organization.
    const endpointIds = [...new Set(parsed.data.grants.map((g) => g.endpointId))];
    const owned = await Endpoint.find({
      _id: { $in: endpointIds },
      organizationId: auth.session.orgId,
    }).select("_id");
    const ownedSet = new Set(owned.map((e) => String(e._id)));
    const notOwned = endpointIds.filter((id) => !ownedSet.has(id));
    if (notOwned.length) {
      return badRequest(t("api.errors.endpointsUnknown"), { notOwned });
    }

    const { token, tokenHash, tokenPrefix, tokenEncrypted } = generateAccessToken();
    const doc = await AccessToken.create({
      organizationId: auth.session.orgId,
      createdBy: auth.session.userId,
      name: parsed.data.name,
      tokenHash,
      tokenPrefix,
      tokenEncrypted,
      grants: parsed.data.grants,
    });

    // Returned immediately at creation; can also be re-fetched later via
    // GET /api/tokens/[id]/reveal (decrypts tokenEncrypted on demand).
    return created({ token: serializeToken(doc), plaintext: token });
  });
}
