import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { AccessToken } from "@/lib/models/AccessToken";
import { Endpoint } from "@/lib/models/Endpoint";
import { requireSession } from "@/lib/api/dashboardAuth";
import { createTokenInput } from "@/lib/validation/schemas";
import { generateAccessToken } from "@/lib/auth/token";
import { serializeToken } from "@/lib/api/serialize";
import {
  badRequest,
  created,
  ok,
  withErrorHandling,
  zodErrors,
} from "@/lib/api/respond";

export const runtime = "nodejs";

export async function GET() {
  return withErrorHandling(async () => {
    const auth = await requireSession();
    if ("response" in auth) return auth.response;

    await connectDB();
    const tokens = await AccessToken.find({ userId: auth.session.userId }).sort({
      createdAt: -1,
    });
    return ok({ tokens: tokens.map(serializeToken) });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const auth = await requireSession();
    if ("response" in auth) return auth.response;

    const body = await req.json().catch(() => null);
    const parsed = createTokenInput.safeParse(body);
    if (!parsed.success) {
      return badRequest("Validation failed", { fields: zodErrors(parsed.error) });
    }

    await connectDB();

    // Every granted endpoint must exist and belong to this user.
    const endpointIds = [...new Set(parsed.data.grants.map((g) => g.endpointId))];
    const owned = await Endpoint.find({
      _id: { $in: endpointIds },
      userId: auth.session.userId,
    }).select("_id");
    const ownedSet = new Set(owned.map((e) => String(e._id)));
    const notOwned = endpointIds.filter((id) => !ownedSet.has(id));
    if (notOwned.length) {
      return badRequest("Some endpoints are unknown or not yours", { notOwned });
    }

    const { token, tokenHash, tokenPrefix, tokenEncrypted } = generateAccessToken();
    const doc = await AccessToken.create({
      userId: auth.session.userId,
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
