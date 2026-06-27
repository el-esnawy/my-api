import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { signInInput } from "@/lib/validation/schemas";
import { serializeUser } from "@/lib/api/serialize";
import { badRequest, ok, unauthorized, withErrorHandling, zodErrors } from "@/lib/api/respond";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const body = await req.json().catch(() => null);
    const parsed = signInInput.safeParse(body);
    if (!parsed.success) {
      return badRequest("Validation failed", { fields: zodErrors(parsed.error) });
    }

    await connectDB();

    const user = await User.findOne({ email: parsed.data.email });
    // Same generic error whether the email is unknown or the password is wrong,
    // to avoid leaking which emails are registered.
    const genericFail = unauthorized("Invalid email or password");
    if (!user) return genericFail;

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) return genericFail;

    await createSession({ userId: String(user._id), email: user.email });
    return ok({ user: serializeUser(user) });
  });
}
