import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Invite } from "@/lib/models/Invite";
import { Organization } from "@/lib/models/Organization";
import { requireSession } from "@/lib/api/dashboardAuth";
import { requireOrgRole } from "@/lib/api/orgAuth";
import { generateInviteToken } from "@/lib/auth/token";
import { sendInviteEmail } from "@/lib/email/sendInviteEmail";
import { serializeInvite } from "@/lib/api/serialize";
import { getRequestTranslator } from "@/i18n/server";
import { env } from "@/lib/env";
import { notFound, ok, withErrorHandling } from "@/lib/api/respond";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * POST /api/account/invites/[id]/resend — regenerate the token + expiry and
 * re-send. The old link stops working since only the latest hash is stored.
 */
export async function POST(req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(req);
    const auth = await requireSession(t);
    if ("response" in auth) return auth.response;
    const roleCheck = requireOrgRole(auth.session, ["owner", "admin"], t);
    if ("response" in roleCheck) return roleCheck.response;
    const { id } = await params;

    await connectDB();
    const { token, tokenHash } = generateInviteToken();
    const invite = await Invite.findOneAndUpdate(
      { _id: id, organizationId: auth.session.orgId, status: "pending" },
      { $set: { tokenHash, expiresAt: new Date(Date.now() + INVITE_TTL_MS) } },
      { new: true }
    );
    if (!invite) return notFound(t("api.errors.inviteNotFound"));

    const organization = await Organization.findById(auth.session.orgId).select("name");
    const acceptUrl = `${env.APP_URL}/invite/${token}`;
    const emailSent = await sendInviteEmail({
      to: invite.email,
      organizationName: organization?.name ?? "your team",
      inviterEmail: auth.session.email,
      acceptUrl,
    });

    return ok({
      invite: serializeInvite(invite),
      emailSent,
      ...(env.isProd ? {} : { acceptUrl }),
    });
  });
}
