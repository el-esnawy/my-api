import type { NextResponse } from "next/server";
import type { SessionPayload, OrgRole } from "@/lib/auth/session";
import { forbidden, type ApiTranslator } from "./respond";

/**
 * Role check for org-scoped actions (invites, plan changes, member
 * management). Trusts `session.role` from the JWT — same trust model as the
 * rest of dashboard auth, which never re-checks the DB per request. A role
 * change/removal only takes effect for the affected user on their next login.
 */
export function requireOrgRole(
  session: SessionPayload,
  allowed: OrgRole[],
  t?: ApiTranslator
): { response: NextResponse } | { ok: true } {
  if (!allowed.includes(session.role)) {
    return { response: forbidden(t?.("api.errors.forbidden")) };
  }
  return { ok: true };
}
