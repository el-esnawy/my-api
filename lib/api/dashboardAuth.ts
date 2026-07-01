import type { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "@/lib/auth/session";
import { unauthorized, type ApiTranslator } from "./respond";

/**
 * Resolve the dashboard session or short-circuit with a 401. Usage:
 *
 *   const auth = await requireSession();
 *   if ("response" in auth) return auth.response;
 *   const { session } = auth;  // session.userId is trusted from here on
 */
export async function requireSession(t?: ApiTranslator): Promise<
  { session: SessionPayload } | { response: NextResponse }
> {
  const session = await getSession();
  if (!session) return { response: unauthorized(t?.("api.errors.unauthorized")) };
  return { session };
}
