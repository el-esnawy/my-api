import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Standard JSON success/error response helpers with a consistent error shape. */

export function json(data: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function ok(data: unknown): NextResponse {
  return NextResponse.json(data, { status: 200 });
}

export function created(data: unknown): NextResponse {
  return NextResponse.json(data, { status: 201 });
}

export function fail(
  status: number,
  message: string,
  extra?: Record<string, unknown>
): NextResponse {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export const badRequest = (message = "Bad request", extra?: Record<string, unknown>) =>
  fail(400, message, extra);
export const unauthorized = (message = "Unauthorized") => fail(401, message);
export const forbidden = (message = "Forbidden") => fail(403, message);
export const notFound = (message = "Not found") => fail(404, message);
export const methodNotAllowed = (message = "Method not allowed") => fail(405, message);
export const conflict = (message = "Conflict") => fail(409, message);
export const tooManyRequests = (message = "Rate limit exceeded") => fail(429, message);
export const serverError = (message = "Internal server error") => fail(500, message);

/** Turn a ZodError into a flat { field: message } object for a 400 response. */
export function zodErrors(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_root";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Wrap a handler so unexpected throws become a generic 500 (no internal leak). */
export async function withErrorHandling(
  fn: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    console.error("[api] unhandled error:", err);
    return serverError();
  }
}
