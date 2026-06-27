import { destroySession } from "@/lib/auth/session";
import { ok, withErrorHandling } from "@/lib/api/respond";

export const runtime = "nodejs";

export async function POST() {
  return withErrorHandling(async () => {
    await destroySession();
    return ok({ success: true });
  });
}
