import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { Translator } from "@/i18n/settings";
import en from "@/i18n/en.json";

/** Standard JSON success/error response helpers with a consistent error shape. */

export type ApiTranslator = Translator;
const fallbackErrors = en.api.errors;

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

export const badRequest = (message = fallbackErrors.badRequest, extra?: Record<string, unknown>) =>
  fail(400, message, extra);
export const unauthorized = (message = fallbackErrors.unauthorized) => fail(401, message);
export const forbidden = (message = fallbackErrors.forbidden) => fail(403, message);
export const notFound = (message = fallbackErrors.notFound) => fail(404, message);
export const methodNotAllowed = (message = fallbackErrors.methodNotAllowed) => fail(405, message);
export const conflict = (message = fallbackErrors.conflict) => fail(409, message);
export const tooManyRequests = (message = fallbackErrors.rateLimitExceeded) => fail(429, message);
export const serverError = (message = fallbackErrors.serverError) => fail(500, message);

function translateMessage(message: string, t?: ApiTranslator): string {
  if (!t) return message;
  return t(message);
}

/** Turn a ZodError into a flat { field: message } object for a 400 response. */
export function zodErrors(err: ZodError, t?: ApiTranslator): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_root";
    if (!out[key]) out[key] = translateMessage(issue.message, t);
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
