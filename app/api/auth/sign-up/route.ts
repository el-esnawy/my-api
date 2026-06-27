import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { signUpInput } from "@/lib/validation/schemas";
import { serializeUser } from "@/lib/api/serialize";
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
    const body = await req.json().catch(() => null);
    const parsed = signUpInput.safeParse(body);
    if (!parsed.success) {
      return badRequest("Validation failed", { fields: zodErrors(parsed.error) });
    }

    await connectDB();

    try {
      const user = await User.create({
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
        name: parsed.data.name,
      });

      await createSession({ userId: String(user._id), email: user.email });
      return created({ user: serializeUser(user) });
    } catch (err: any) {
      // Duplicate key on the unique email index.
      if (err?.code === 11000) return conflict("Email already registered");
      throw err;
    }
  });
}
