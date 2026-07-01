import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { AccessToken } from "@/lib/models/AccessToken";
import { requireSession } from "@/lib/api/dashboardAuth";
import { decryptToken } from "@/lib/auth/token";
import { notFound, ok, withErrorHandling } from "@/lib/api/respond";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/**
 * Reveals the plaintext of a previously created request token. Scoped to the
 * signed-in user's own tokens; `tokenEncrypted` is `select: false` on the model,
 * so it must be explicitly requested here and nowhere else.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const auth = await requireSession();
    if ("response" in auth) return auth.response;
    const { id } = await params;

    await connectDB();
    const token = await AccessToken.findOne({ _id: id, userId: auth.session.userId }).select(
      "+tokenEncrypted"
    );
    if (!token) return notFound("Token not found");
    if (!token.tokenEncrypted) {
      return notFound("This token was created before viewing was supported — revoke it and create a new one");
    }

    return ok({ token: decryptToken(token.tokenEncrypted) });
  });
}
