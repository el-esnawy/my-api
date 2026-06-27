import Redis from "ioredis";
import { env } from "@/lib/env";

/**
 * Single shared ioredis client, cached on the global object to survive HMR.
 * Redis is used for per-token rate limiting and lightweight caching — the app
 * is written to degrade gracefully (fail open) if Redis is unavailable, so a
 * Redis outage never takes down the API.
 */
declare global {
  var _redisClient: Redis | undefined;
}

function createClient(): Redis {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
    lazyConnect: false,
  });

  // Without a listener, ioredis throws on connection errors and can crash the
  // process. Swallow + log so callers can fail open instead.
  let warned = false;
  client.on("error", (err) => {
    if (!warned) {
      console.warn("[redis] connection error (degrading gracefully):", err.message);
      warned = true;
    }
  });
  client.on("ready", () => {
    warned = false;
  });

  return client;
}

export const redis: Redis = global._redisClient ?? createClient();
if (!env.isProd) global._redisClient = redis;
