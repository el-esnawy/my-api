import { cookies } from "next/headers";
import { env } from "@/lib/env";
import {
  SESSION_COOKIE,
  signSession,
  verifySession,
  type SessionPayload,
  type OrgRole,
} from "./jwt";

/**
 * Cookie-backed session helpers for Node route handlers / server components.
 * (Edge middleware uses `verifySession` from ./jwt directly against the request
 * cookie, since it can't use next/headers the same way.)
 */

const MAX_AGE = 60 * 60 * 24 * 7; // 7 days, matches default SESSION_TTL

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export type { SessionPayload, OrgRole };
