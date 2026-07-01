import { ensureRedisReady, redis } from "@/lib/db/redis";
import { env } from "@/lib/env";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Fixed-window rate limiter backed by Redis. Keyed by an arbitrary string
 * (we use the token id). Fails OPEN if Redis is unavailable so an outage never
 * blocks legitimate traffic.
 */
export async function rateLimit(key: string): Promise<RateLimitResult> {
  const limit = env.RATE_LIMIT_MAX;
  const windowSec = env.RATE_LIMIT_WINDOW;
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

/** Attach standard rate-limit headers to a response. */
export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetSeconds),
  };
}
