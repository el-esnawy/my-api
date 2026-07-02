import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Invite } from "@/lib/models/Invite";
import { requireSession } from "@/lib/api/dashboardAuth";
import { requireOrgRole } from "@/lib/api/orgAuth";
import { getRequestTranslator } from "@/i18n/server";
import { notFound, ok, withErrorHandling } from "@/lib/api/respond";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** DELETE /api/account/invites/[id] — revoke a pending invite (owner/admin only). Soft-delete: keeps the audit trail. */
export async function DELETE(req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(req);
    const auth = await requireSession(t);
    if ("response" in auth) return auth.response;
    const roleCheck = requireOrgRole(auth.session, ["owner", "admin"], t);
    if ("response" in roleCheck) return roleCheck.response;
    const { id } = await params;

    await connectDB();
    const invite = await Invite.findOneAndUpdate(
      { _id: id, organizationId: auth.session.orgId, status: "pending" },
      { $set: { status: "revoked" } },
      { new: true }
    );
    if (!invite) return notFound(t("api.errors.inviteNotFound"));

    return ok({ success: true });
  });
}
