import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/lib/models/User";
import { getSession } from "@/lib/auth/session";
import { serializeUser } from "@/lib/api/serialize";
import { ok, unauthorized, withErrorHandling } from "@/lib/api/respond";

export const runtime = "nodejs";

export async function GET() {
  return withErrorHandling(async () => {
    const session = await getSession();
    if (!session) return unauthorized();

    await connectDB();
    const user = await User.findById(session.userId);
    if (!user) return unauthorized();

    return ok({ user: serializeUser(user) });
  });
}
