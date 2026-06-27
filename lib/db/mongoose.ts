import mongoose from "mongoose";
import { env } from "@/lib/env";

/**
 * Cached Mongoose connection. Next.js (especially in dev with HMR, and in
 * serverless) can evaluate modules many times — we stash the connection on the
 * global object so we reuse a single pool instead of opening one per request.
 */
declare global {
  var _mongooseCache:
    | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
    | undefined;
}

const cache = global._mongooseCache ?? { conn: null, promise: null };
if (!global._mongooseCache) global._mongooseCache = cache;

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(env.MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }

  return cache.conn;
}
