import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Membership } from "@/lib/models/Membership";
import { requireSession } from "@/lib/api/dashboardAuth";
import { serializeMember } from "@/lib/api/serialize";
import { getRequestTranslator } from "@/i18n/server";
import { ok, withErrorHandling } from "@/lib/api/respond";

export const runtime = "nodejs";

/** GET /api/account/members — every member of the current org. */
export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(req);
    const auth = await requireSession(t);
    if ("response" in auth) return auth.response;

    await connectDB();
    const members = await Membership.find({ organizationId: auth.session.orgId })
      .sort({ createdAt: 1 })
      .populate("userId", "email name");

    return ok({ members: members.map(serializeMember) });
  });
}
