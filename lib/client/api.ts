export class ApiError extends Error {
  status: number;
  fields?: Record<string, string>;
  body: any;

  constructor(message: string, status: number, body: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    this.fields = body?.fields;
  }
}

interface ApiOptions extends Omit<RequestInit, "body"> {
  json?: unknown;
}

/** Thin fetch wrapper for the dashboard API (cookie-authenticated). */
export async function api<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options;

  const res = await fetch(path, {
    ...rest,
    credentials: "same-origin",
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(data?.error ?? "Request failed", res.status, data);
  }
  return data as T;
}
