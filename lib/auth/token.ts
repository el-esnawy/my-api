import {
  randomBytes,
  createHash,
  createCipheriv,
  createDecipheriv,
  timingSafeEqual,
} from "crypto";
import { env } from "@/lib/env";

/**
 * Request tokens are opaque random secrets. We store a SHA-256 hash for fast,
 * authoritative lookup on every public API request (unaffected by anything
 * below), plus an AES-256-GCM encrypted copy so the owning user can reveal the
 * plaintext again later from the dashboard — the hash is never decrypted or
 * used for that purpose.
 */

const TOKEN_PREFIX = "mapi_";

// AES-256-GCM needs exactly 32 bytes; sha256 conveniently produces exactly that,
// so any length TOKEN_ENCRYPTION_SECRET normalizes to a valid key.
const ENCRYPTION_KEY = createHash("sha256").update(env.TOKEN_ENCRYPTION_SECRET).digest();
const IV_LENGTH = 12; // recommended IV size for GCM

export interface GeneratedToken {
  token: string; // plaintext — returned at creation and via the reveal endpoint
  tokenHash: string; // sha256 hex — stored & indexed, used for public API auth
  tokenPrefix: string; // first chars, safe to display in lists
  tokenEncrypted: string; // AES-256-GCM ciphertext, decryptable on demand
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Encrypt a plaintext token for at-rest storage. Format: iv:authTag:ciphertext (hex). */
export function encryptToken(token: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

/** Reverse of encryptToken. Throws if the payload is malformed or the tag doesn't match. */
export function decryptToken(encrypted: string): string {
  const [ivHex, authTagHex, ciphertextHex] = encrypted.split(":");
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error("Malformed encrypted token payload");
  }
  const decipher = createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, "hex")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

export function generateAccessToken(): GeneratedToken {
  const secret = randomBytes(32).toString("base64url");
  const token = `${TOKEN_PREFIX}${secret}`;
  return {
    token,
    tokenHash: hashToken(token),
    tokenPrefix: token.slice(0, 12),
    tokenEncrypted: encryptToken(token),
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
