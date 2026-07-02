import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Membership } from "@/lib/models/Membership";
import { requireSession } from "@/lib/api/dashboardAuth";
import { requireOrgRole } from "@/lib/api/orgAuth";
import { updateMemberInput } from "@/lib/validation/schemas";
import { serializeMember } from "@/lib/api/serialize";
import { getRequestTranslator } from "@/i18n/server";
import { badRequest, conflict, notFound, ok, withErrorHandling, zodErrors } from "@/lib/api/respond";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** Refuses to leave the org with zero owners. */
async function wouldRemoveLastOwner(organizationId: string, membershipId: string) {
  const membership = await Membership.findOne({ _id: membershipId, organizationId });
  if (!membership || membership.role !== "owner") return false;
  const owners = await Membership.countDocuments({ organizationId, role: "owner" });
  return owners <= 1;
}

/** PATCH /api/account/members/[id] — change a member's role (owner/admin only). */
export async function PATCH(req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(req);
    const auth = await requireSession(t);
    if ("response" in auth) return auth.response;
    const roleCheck = requireOrgRole(auth.session, ["owner", "admin"], t);
    if ("response" in roleCheck) return roleCheck.response;
    const { id } = await params;

    const body = await req.json().catch(() => null);
    const parsed = updateMemberInput.safeParse(body);
    if (!parsed.success) {
      return badRequest(t("api.errors.validationFailed"), { fields: zodErrors(parsed.error, t) });
    }

    await connectDB();
    if (parsed.data.role !== "owner" && (await wouldRemoveLastOwner(auth.session.orgId, id))) {
      return conflict(t("api.errors.lastOwner"));
    }

    const member = await Membership.findOneAndUpdate(
      { _id: id, organizationId: auth.session.orgId },
      { $set: { role: parsed.data.role } },
      { new: true }
    ).populate("userId", "email name");
    if (!member) return notFound(t("api.errors.memberNotFound"));

    return ok({ member: serializeMember(member) });
  });
}

/** DELETE /api/account/members/[id] — remove a member (owner/admin only). */
export async function DELETE(req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(req);
    const auth = await requireSession(t);
    if ("response" in auth) return auth.response;
    const roleCheck = requireOrgRole(auth.session, ["owner", "admin"], t);
    if ("response" in roleCheck) return roleCheck.response;
    const { id } = await params;

    await connectDB();
    if (await wouldRemoveLastOwner(auth.session.orgId, id)) {
      return conflict(t("api.errors.lastOwner"));
    }

    const deleted = await Membership.findOneAndDelete({ _id: id, organizationId: auth.session.orgId });
    if (!deleted) return notFound(t("api.errors.memberNotFound"));

    return ok({ success: true });
  });
}
