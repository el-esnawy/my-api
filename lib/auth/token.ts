import { randomBytes, createHash, timingSafeEqual } from "crypto";

/**
 * Access tokens are opaque random secrets. We only ever store their SHA-256
 * hash; the plaintext is returned to the user exactly once at creation time.
 */

const TOKEN_PREFIX = "mapi_";

export interface GeneratedToken {
  token: string; // plaintext — show once, never stored
  tokenHash: string; // sha256 hex — stored & indexed
  tokenPrefix: string; // first chars, safe to display in lists
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateAccessToken(): GeneratedToken {
  const secret = randomBytes(32).toString("base64url");
  const token = `${TOKEN_PREFIX}${secret}`;
  return {
    token,
    tokenHash: hashToken(token),
    tokenPrefix: token.slice(0, 12),
  };
}

/** Constant-time compare of two hex digests. */
export function safeHashEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** Extract a bearer token from an Authorization header value. */
export function parseBearer(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}
