import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import { Organization } from "@/lib/models/Organization";
import { requireSession } from "@/lib/api/dashboardAuth";
import { verifyPassword } from "@/lib/auth/password";
import { updateProfileInput } from "@/lib/validation/schemas";
import { serializeUser, serializeOrganization } from "@/lib/api/serialize";
import { getRequestTranslator } from "@/i18n/server";
import {
  badRequest,
  conflict,
  notFound,
  ok,
  unauthorized,
  withErrorHandling,
  zodErrors,
} from "@/lib/api/respond";

export const runtime = "nodejs";

/** GET /api/account/profile — the current user + their (one) organization. */
export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(req);
    const auth = await requireSession(t);
    if ("response" in auth) return auth.response;

    await connectDB();
    const user = await User.findById(auth.session.userId);
    if (!user) return unauthorized(t("api.errors.unauthorized"));
    const organization = await Organization.findById(auth.session.orgId);
    if (!organization) return notFound(t("api.errors.organizationNotFound"));

    return ok({
      user: serializeUser(user),
      organization: serializeOrganization(organization),
      role: auth.session.role,
    });
  });
}

/** PATCH /api/account/profile — update name and/or email. Email changes require current-password confirmation. */
export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(req);
    const auth = await requireSession(t);
    if ("response" in auth) return auth.response;

    const body = await req.json().catch(() => null);
    const parsed = updateProfileInput.safeParse(body);
    if (!parsed.success) {
      return badRequest(t("api.errors.validationFailed"), { fields: zodErrors(parsed.error, t) });
    }

    await connectDB();
    const user = await User.findById(auth.session.userId);
    if (!user) return unauthorized(t("api.errors.unauthorized"));

    if (parsed.data.email !== undefined) {
      const valid = await verifyPassword(parsed.data.currentPassword!, user.passwordHash);
      if (!valid) {
        return badRequest(t("api.errors.validationFailed"), {
          fields: { currentPassword: t("api.errors.currentPasswordIncorrect") },
        });
      }
      user.email = parsed.data.email;
    }
    if (parsed.data.name !== undefined) user.name = parsed.data.name;

    try {
      await user.save();
    } catch (err: any) {
      if (err?.code === 11000) return conflict(t("api.errors.emailRegistered"));
      throw err;
    }

    return ok({ user: serializeUser(user) });
  });
}
