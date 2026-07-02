import { Resend } from "resend";
import { env } from "@/lib/env";

/**
 * Lazily-constructed Resend client. No safe dev fallback exists for
 * RESEND_API_KEY (unlike every other env var in lib/env.ts) — the Resend SDK
 * throws at construction time if given no key, so we simply don't construct
 * it without one. Callers (sendInviteEmail) treat a missing client as a
 * non-fatal "email didn't send" rather than crashing the request.
 */
let client: Resend | null | undefined;

export function getResendClient(): Resend | null {
  if (client === undefined) {
    client = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
  }
  return client;
}
