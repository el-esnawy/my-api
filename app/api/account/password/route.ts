import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import { requireSession } from "@/lib/api/dashboardAuth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { changePasswordInput } from "@/lib/validation/schemas";
import { getRequestTranslator } from "@/i18n/server";
import { badRequest, ok, unauthorized, withErrorHandling, zodErrors } from "@/lib/api/respond";

export const runtime = "nodejs";

/** POST /api/account/password — change the signed-in user's password. */
export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(req);
    const auth = await requireSession(t);
    if ("response" in auth) return auth.response;

    const body = await req.json().catch(() => null);
    const parsed = changePasswordInput.safeParse(body);
    if (!parsed.success) {
      return badRequest(t("api.errors.validationFailed"), { fields: zodErrors(parsed.error, t) });
    }

    await connectDB();
    const user = await User.findById(auth.session.userId);
    if (!user) return unauthorized(t("api.errors.unauthorized"));

    const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
    if (!valid) {
      return badRequest(t("api.errors.validationFailed"), {
        fields: { currentPassword: t("api.errors.currentPasswordIncorrect") },
      });
    }

    user.passwordHash = await hashPassword(parsed.data.newPassword);
    await user.save();

    return ok({ success: true });
  });
}
