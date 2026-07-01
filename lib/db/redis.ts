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
  var _redisReadyPromise: Promise<void> | undefined;
}

function createClient(): Redis {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
    lazyConnect: true,
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

export async function ensureRedisReady(): Promise<void> {
  if (redis.status === "ready") return;

  global._redisReadyPromise ??= new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      redis.off("ready", onReady);
      redis.off("error", onError);
    };
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = (err: Error) => {
      cleanup();
      global._redisReadyPromise = undefined;
      reject(err);
    };

    redis.once("ready", onReady);
    redis.once("error", onError);

    if (redis.status === "wait" || redis.status === "end") {
      redis.connect().catch(onError);
    }
  });

  await global._redisReadyPromise;
}
