import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { createOrganizationForUser } from "@/lib/api/organization";
import { signUpInput } from "@/lib/validation/schemas";
import { serializeUser } from "@/lib/api/serialize";
import { getRequestTranslator } from "@/i18n/server";
import {
  badRequest,
  conflict,
  created,
  withErrorHandling,
  zodErrors,
} from "@/lib/api/respond";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(req);
    const body = await req.json().catch(() => null);
    const parsed = signUpInput.safeParse(body);
    if (!parsed.success) {
      return badRequest(t("api.errors.validationFailed"), { fields: zodErrors(parsed.error, t) });
    }

    await connectDB();

    try {
      const user = await User.create({
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
        name: parsed.data.name,
      });

      const organization = await createOrganizationForUser(user);

      await createSession({
        userId: String(user._id),
        email: user.email,
        orgId: String(organization._id),
        role: "owner",
      });
      return created({ user: serializeUser(user) });
    } catch (err: any) {
      // Duplicate key on the unique email index.
      if (err?.code === 11000) return conflict(t("api.errors.emailRegistered"));
      throw err;
    }
  });
}
