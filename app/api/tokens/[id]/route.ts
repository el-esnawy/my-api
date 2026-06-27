import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { AccessToken } from "@/lib/models/AccessToken";
import { Endpoint } from "@/lib/models/Endpoint";
import { requireSession } from "@/lib/api/dashboardAuth";
import { updateTokenInput } from "@/lib/validation/schemas";
import { serializeToken } from "@/lib/api/serialize";
import {
  badRequest,
  notFound,
  ok,
  withErrorHandling,
  zodErrors,
} from "@/lib/api/respond";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const auth = await requireSession();
    if ("response" in auth) return auth.response;
    const { id } = await params;

    await connectDB();
    const token = await AccessToken.findOne({ _id: id, userId: auth.session.userId });
    if (!token) return notFound("Token not found");
    return ok({ token: serializeToken(token) });
  });
}

// Update a token: rename, revoke/un-revoke, or change endpoint grants.
export async function PATCH(req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const auth = await requireSession();
    if ("response" in auth) return auth.response;
    const { id } = await params;

    const body = await req.json().catch(() => null);
    const parsed = updateTokenInput.safeParse(body);
    if (!parsed.success) {
      return badRequest("Validation failed", { fields: zodErrors(parsed.error) });
    }

    await connectDB();

    if (parsed.data.grants) {
      const endpointIds = [...new Set(parsed.data.grants.map((g) => g.endpointId))];
      const owned = await Endpoint.find({
        _id: { $in: endpointIds },
        userId: auth.session.userId,
      }).select("_id");
      const ownedSet = new Set(owned.map((e) => String(e._id)));
      const notOwned = endpointIds.filter((eid) => !ownedSet.has(eid));
      if (notOwned.length) {
        return badRequest("Some endpoints are unknown or not yours", { notOwned });
      }
    }

    const token = await AccessToken.findOneAndUpdate(
      { _id: id, userId: auth.session.userId },
      { $set: parsed.data },
      { new: true }
    );
    if (!token) return notFound("Token not found");
    return ok({ token: serializeToken(token) });
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const auth = await requireSession();
    if ("response" in auth) return auth.response;
    const { id } = await params;

    await connectDB();
    const deleted = await AccessToken.findOneAndDelete({
      _id: id,
      userId: auth.session.userId,
    });
    if (!deleted) return notFound("Token not found");
    return ok({ success: true });
  });
}
