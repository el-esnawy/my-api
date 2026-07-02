/**
 * Centralized environment access. Values fall back to local-dev defaults so the
 * app boots even if a var is missing, but you MUST set a real SESSION_SECRET in
 * any non-local environment.
 *
 * This module only reads `process.env`, so it is safe to import from the Edge
 * runtime (middleware) as well as Node route handlers.
 */
export const env = {
  MONGODB_URI: process.env.MONGODB_URI ?? "mongodb://localhost:27017/my-api",
  REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
  SESSION_SECRET:
    process.env.SESSION_SECRET ??
    "dev-only-secret-please-change-0123456789abcdef0123456789",
  SESSION_TTL: process.env.SESSION_TTL ?? "7d",
  TOKEN_ENCRYPTION_SECRET:
    process.env.TOKEN_ENCRYPTION_SECRET ??
    "dev-only-secret-please-change-fedcba9876543210fedcba9876543210",
  // RATE_LIMIT_MAX is no longer read on the request path — per-request limits
  // are plan-derived (see lib/billing/plans.ts). Kept only so old .env files
  // don't error; RATE_LIMIT_WINDOW is still used as the shared window length.
  RATE_LIMIT_WINDOW: Number(process.env.RATE_LIMIT_WINDOW ?? 60),
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
  EMAIL_FROM: process.env.EMAIL_FROM ?? "My API <onboarding@resend.dev>",
  APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  isProd: process.env.NODE_ENV === "production",
};
