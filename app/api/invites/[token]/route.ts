import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Invite } from "@/lib/models/Invite";
import { Membership } from "@/lib/models/Membership";
import { Organization } from "@/lib/models/Organization";
import { User } from "@/lib/models/User";
import { hashToken } from "@/lib/auth/token";
import { hashPassword } from "@/lib/auth/password";
import { createSession, getSession } from "@/lib/auth/session";
import { acceptInviteInput } from "@/lib/validation/schemas";
import { serializeUser } from "@/lib/api/serialize";
import { getRequestTranslator } from "@/i18n/server";
import { badRequest, created, forbidden, gone, notFound, ok, withErrorHandling, zodErrors } from "@/lib/api/respond";

export const runtime = "nodejs";

type Params = { params: Promise<{ token: string }> };

type ResolvedInvite =
  | { ok: true; invite: InstanceType<typeof Invite> }
  | { ok: false; response: ReturnType<typeof notFound> };

/** Loads a pending, non-expired invite by its plaintext token, or a typed failure. */
async function resolveInvite(
  token: string,
  t: Awaited<ReturnType<typeof getRequestTranslator>>
): Promise<ResolvedInvite> {
  const invite = await Invite.findOne({ tokenHash: hashToken(token) });
  if (!invite) return { ok: false, response: notFound(t("api.errors.inviteNotFound")) };
  if (invite.status === "accepted") return { ok: false, response: gone(t("api.errors.inviteAlreadyAccepted")) };
  if (invite.status === "revoked") return { ok: false, response: gone(t("api.errors.inviteRevoked")) };
  if (invite.expiresAt.getTime() < Date.now()) return { ok: false, response: gone(t("api.errors.inviteExpired")) };
  return { ok: true, invite };
}

/** GET /api/invites/[token] — public: invite context for the accept page. */
export async function GET(req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(req);
    const { token } = await params;

    await connectDB();
    const resolved = await resolveInvite(token, t);
    if (!resolved.ok) return resolved.response;
    const { invite } = resolved;

    const [organization, existingUser, inviter] = await Promise.all([
      Organization.findById(invite.organizationId).select("name"),
      User.findOne({ email: invite.email }).select("_id"),
      User.findById(invite.invitedBy).select("email"),
    ]);

    return ok({
      organizationName: organization?.name ?? null,
      inviterEmail: inviter?.email ?? null,
      email: invite.email,
      role: invite.role,
      alreadyHasAccount: !!existingUser,
    });
  });
}

/** POST /api/invites/[token] — accept the invite, signing the invitee in. */
export async function POST(req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(req);
    const { token } = await params;

    await connectDB();
    const resolved = await resolveInvite(token, t);
    if (!resolved.ok) return resolved.response;
    const { invite } = resolved;

    const body = await req.json().catch(() => ({}));
    const parsed = acceptInviteInput.safeParse(body);
    if (!parsed.success) {
      return badRequest(t("api.errors.validationFailed"), { fields: zodErrors(parsed.error, t) });
    }

    const existingUser = await User.findOne({ email: invite.email });
    let userId: string;

    if (existingUser) {
      // Must already be signed in as this exact account to accept.
      const session = await getSession();
      if (!session || session.userId !== String(existingUser._id)) {
        return forbidden(t("api.errors.mustSignInToAccept"));
      }
      // v1 is single-org-per-user — accepting a second org's invite isn't supported yet.
      const alreadyMember = await Membership.findOne({ userId: existingUser._id });
      if (alreadyMember) return forbidden(t("api.errors.alreadyInOrganization"));
      userId = String(existingUser._id);
    } else {
      if (!parsed.data.password) {
        return badRequest(t("api.errors.validationFailed"), {
          fields: { password: t("validation.passwordMin") },
        });
      }
      const newUser = await User.create({
        email: invite.email,
        passwordHash: await hashPassword(parsed.data.password),
        name: parsed.data.name,
      });
      userId = String(newUser._id);
    }

    await Membership.create({
      organizationId: invite.organizationId,
      userId,
      role: invite.role,
    });
    invite.status = "accepted";
    invite.acceptedAt = new Date();
    invite.acceptedBy = userId as any;
    await invite.save();

    const user = await User.findById(userId);
    await createSession({
      userId,
      email: invite.email,
      orgId: String(invite.organizationId),
      role: invite.role,
    });

    return created({ user: serializeUser(user) });
  });
}
