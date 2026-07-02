import { ensureRedisReady, redis } from "@/lib/db/redis";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Fixed-window rate limiter backed by Redis. Keyed by an arbitrary string
 * (we key by organization id, so a plan's per-minute budget is shared across
 * all of that org's tokens). Fails OPEN if Redis is unavailable so an outage
 * never blocks legitimate traffic.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const redisKey = `rl:${key}`;

  try {
    await ensureRedisReady();
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.expire(redisKey, windowSec);
    }
    const ttl = await redis.ttl(redisKey);
    return {
      allowed: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      resetSeconds: ttl >= 0 ? ttl : windowSec,
    };
  } catch {
    return { allowed: true, limit, remaining: limit, resetSeconds: windowSec };
  }
}

export interface QuotaResult {
  allowed: boolean;
  limit: number;
  used: number;
}

/**
 * Monthly request quota per organization, bucketed by UTC calendar month.
 * Same fail-open philosophy as `rateLimit()` — a Redis outage means the
 * monthly quota goes unenforced for its duration, not that traffic is blocked.
 */
export async function checkMonthlyQuota(
  organizationId: string,
  monthlyLimit: number
): Promise<QuotaResult> {
  if (!Number.isFinite(monthlyLimit)) {
    return { allowed: true, limit: monthlyLimit, used: 0 };
  }

  const bucket = new Date().toISOString().slice(0, 7); // "YYYY-MM" (UTC)
  const redisKey = `quota:${organizationId}:${bucket}`;

  try {
    await ensureRedisReady();
    const used = await redis.incr(redisKey);
    if (used === 1) {
      await redis.expire(redisKey, 60 * 60 * 24 * 32); // self-cleans a month later
    }
    return { allowed: used <= monthlyLimit, limit: monthlyLimit, used };
  } catch {
    return { allowed: true, limit: monthlyLimit, used: 0 };
  }
}

/** Attach standard rate-limit headers to a response. */
export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetSeconds),
  };
}

/** Attach monthly quota headers to a response. */
export function quotaHeaders(result: QuotaResult): HeadersInit {
  if (!Number.isFinite(result.limit)) return {};
  return {
    "X-Quota-Limit": String(result.limit),
    "X-Quota-Remaining": String(Math.max(0, result.limit - result.used)),
  };
}
