import { connectDB } from "@/lib/db/mongoose";
import { AccessToken, type AccessTokenDoc } from "@/lib/models/AccessToken";
import { Endpoint, type EndpointDoc, type HttpMethod } from "@/lib/models/Endpoint";
import { hashToken, parseBearer } from "@/lib/auth/token";

/**
 * The core security gate for the public REST engine.
 *
 * A token uniquely identifies a tenant. We resolve the endpoint *within that
 * tenant only*, so a token can never address another user's endpoints — even if
 * two users happen to use the same slug. Authorization checks, in order:
 *   1. valid, non-revoked token
 *   2. endpoint exists for the token's user (slug scoped to userId)
 *   3. token has an explicit grant for that endpoint
 *   4. verb is allowed by the endpoint
 *   5. verb is permitted by the grant (read vs write)
 */

export type AuthSuccess = {
  ok: true;
  userId: string;
  token: AccessTokenDoc;
  endpoint: EndpointDoc;
  grant: { read: boolean; write: boolean };
};

export type AuthFailure = { ok: false; status: number; message: string };

export type PublicAuthResult = AuthSuccess | AuthFailure;

export async function authorizePublicRequest(
  req: Request,
  slug: string,
  method: HttpMethod
): Promise<PublicAuthResult> {
  const raw = parseBearer(req.headers.get("authorization"));
  if (!raw) {
    return { ok: false, status: 401, message: "Missing bearer access token" };
  }

  await connectDB();

  // Always look the token up live (no cache) so revocation takes effect immediately.
  const token = await AccessToken.findOne({
    tokenHash: hashToken(raw),
    revoked: false,
  });
  if (!token) {
    return { ok: false, status: 401, message: "Invalid or revoked access token" };
  }

  // Resolve the endpoint strictly within the token owner's namespace.
  const endpoint = await Endpoint.findOne({ userId: token.userId, slug });
  if (!endpoint) {
    return { ok: false, status: 404, message: "Endpoint not found" };
  }

  const grant = token.grants.find(
    (g) => String(g.endpointId) === String(endpoint._id)
  );
  if (!grant) {
    return {
      ok: false,
      status: 403,
      message: "This token is not authorized for this endpoint",
    };
  }

  if (!endpoint.methods.includes(method)) {
    return { ok: false, status: 405, message: `${method} is not enabled for this endpoint` };
  }

  const isWrite = method !== "GET";
  if (isWrite && !grant.write) {
    return { ok: false, status: 403, message: "This token lacks write permission" };
  }
  if (!isWrite && !grant.read) {
    return { ok: false, status: 403, message: "This token lacks read permission" };
  }

  // Best-effort last-used timestamp; never blocks the request.
  AccessToken.updateOne(
    { _id: token._id },
    { $set: { lastUsedAt: new Date() } }
  ).catch(() => {});

  return {
    ok: true,
    userId: String(token.userId),
    token,
    endpoint,
    grant: { read: !!grant.read, write: !!grant.write },
  };
}
