import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { getMembershipForUser } from "@/lib/api/organization";
import { signInInput } from "@/lib/validation/schemas";
import { serializeUser } from "@/lib/api/serialize";
import { getRequestTranslator } from "@/i18n/server";
import { badRequest, ok, unauthorized, withErrorHandling, zodErrors } from "@/lib/api/respond";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(req);
    const body = await req.json().catch(() => null);
    const parsed = signInInput.safeParse(body);
    if (!parsed.success) {
      return badRequest(t("api.errors.validationFailed"), { fields: zodErrors(parsed.error, t) });
    }

    await connectDB();

    const user = await User.findOne({ email: parsed.data.email });
    // Same generic error whether the email is unknown or the password is wrong,
    // to avoid leaking which emails are registered.
    const genericFail = unauthorized(t("api.errors.invalidCredentials"));
    if (!user) return genericFail;

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) return genericFail;

    const membership = await getMembershipForUser(String(user._id));
    if (!membership) return genericFail;

    await createSession({
      userId: String(user._id),
      email: user.email,
      orgId: String(membership.organizationId),
      role: membership.role,
    });
    return ok({ user: serializeUser(user) });
  });
}
