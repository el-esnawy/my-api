import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Invite } from "@/lib/models/Invite";
import { Membership } from "@/lib/models/Membership";
import { User } from "@/lib/models/User";
import { Organization } from "@/lib/models/Organization";
import { requireSession } from "@/lib/api/dashboardAuth";
import { requireOrgRole } from "@/lib/api/orgAuth";
import { generateInviteToken } from "@/lib/auth/token";
import { sendInviteEmail } from "@/lib/email/sendInviteEmail";
import { createInviteInput } from "@/lib/validation/schemas";
import { serializeInvite } from "@/lib/api/serialize";
import { getRequestTranslator } from "@/i18n/server";
import { env } from "@/lib/env";
import { badRequest, conflict, created, ok, withErrorHandling, zodErrors } from "@/lib/api/respond";

export const runtime = "nodejs";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** GET /api/account/invites — pending/past invites for the current org. */
export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(req);
    const auth = await requireSession(t);
    if ("response" in auth) return auth.response;
    const roleCheck = requireOrgRole(auth.session, ["owner", "admin"], t);
    if ("response" in roleCheck) return roleCheck.response;

    await connectDB();
    const invites = await Invite.find({ organizationId: auth.session.orgId }).sort({ createdAt: -1 });
    return ok({ invites: invites.map(serializeInvite) });
  });
}

/** POST /api/account/invites — invite a teammate by email (owner/admin only). */
export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(req);
    const auth = await requireSession(t);
    if ("response" in auth) return auth.response;
    const roleCheck = requireOrgRole(auth.session, ["owner", "admin"], t);
    if ("response" in roleCheck) return roleCheck.response;

    const body = await req.json().catch(() => null);
    const parsed = createInviteInput.safeParse(body);
    if (!parsed.success) {
      return badRequest(t("api.errors.validationFailed"), { fields: zodErrors(parsed.error, t) });
    }
    const { email, role } = parsed.data;

    await connectDB();

    const existingPending = await Invite.findOne({
      organizationId: auth.session.orgId,
      email,
      status: "pending",
    });
    if (existingPending) return conflict(t("api.errors.inviteAlreadyPending"));

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const alreadyMember = await Membership.findOne({
        organizationId: auth.session.orgId,
        userId: existingUser._id,
      });
      if (alreadyMember) return conflict(t("api.errors.alreadyMember"));
    }

    const { token, tokenHash } = generateInviteToken();
    const invite = await Invite.create({
      organizationId: auth.session.orgId,
      email,
      role,
      invitedBy: auth.session.userId,
      tokenHash,
      status: "pending",
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    });

    const organization = await Organization.findById(auth.session.orgId).select("name");
    const acceptUrl = `${env.APP_URL}/invite/${token}`;
    const emailSent = await sendInviteEmail({
      to: email,
      organizationName: organization?.name ?? "your team",
      inviterEmail: auth.session.email,
      acceptUrl,
    });

    return created({
      invite: serializeInvite(invite),
      emailSent,
      ...(env.isProd ? {} : { acceptUrl }),
    });
  });
}
