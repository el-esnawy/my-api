import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

/**
 * Pure JWT helpers built on `jose` so they run in BOTH the Edge runtime
 * (middleware) and the Node runtime (route handlers). This module must never
 * import anything Node-only (mongoose, ioredis, next/headers).
 */

const secret = new TextEncoder().encode(env.SESSION_SECRET);

export const SESSION_COOKIE = "my_api_session";

export interface SessionPayload {
  userId: string;
  email: string;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(env.SESSION_TTL)
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub) return null;
    return { userId: payload.sub, email: String(payload.email ?? "") };
  } catch {
    return null;
  }
}
