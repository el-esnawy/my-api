import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { RecordModel } from "@/lib/models/Record";
import { gate, loadFields, jsonWithHeaders } from "@/lib/api/publicEngine";
import {
  validateRecordData,
  projectReadable,
  coerceScalar,
} from "@/lib/records/validate";
import { withErrorHandling } from "@/lib/api/respond";

export const runtime = "nodejs";

type Params = { params: Promise<{ endpoint: string }> };

function clampInt(value: string | null, fallback: number, min: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

/** GET /api/v1/:endpoint — list records (with optional field filters + pagination). */
export async function GET(req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const { endpoint: slug } = await params;
    const g = await gate(req, slug, "GET");
    if (!g.ok) return g.response;
    const { auth, headers } = g;

    await connectDB();
    const fields = await loadFields(auth);
    const readable = auth.endpoint.readableFields ?? [];

    const url = new URL(req.url);
    const limit = clampInt(url.searchParams.get("limit"), 50, 1, 200);
    const skip = clampInt(url.searchParams.get("skip"), 0, 0, 1_000_000);

    // Build an equality filter from query params matching readable fields.
    const filter: Record<string, unknown> = {
      userId: auth.userId,
      endpointId: auth.endpoint._id,
    };
    for (const field of fields) {
      const isReadable = readable.length === 0 || readable.includes(field.name);
      if (!isReadable) continue;
      const raw = url.searchParams.get(field.name);
      if (raw === null) continue;
      const coerced = coerceScalar(field.type, raw);
      if (coerced !== undefined) filter[`data.${field.name}`] = coerced;
    }

    const [items, total] = await Promise.all([
      RecordModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      RecordModel.countDocuments(filter),
    ]);

    const records = items.map((r) => ({
      id: String(r._id),
      data: projectReadable(r.data as Record<string, unknown>, readable),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return jsonWithHeaders({ records, pagination: { total, limit, skip } }, 200, headers);
  });
}

/** POST /api/v1/:endpoint — create a record. */
export async function POST(req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const { endpoint: slug } = await params;
    const g = await gate(req, slug, "POST");
    if (!g.ok) return g.response;
    const { auth, headers } = g;

    await connectDB();
    const fields = await loadFields(auth);
    const body = await req.json().catch(() => null);

    const result = validateRecordData(fields, body, {
      writableFields: auth.endpoint.writableFields ?? [],
    });
    if (!result.ok) {
      return jsonWithHeaders(
        { error: "Validation failed", fields: result.errors },
        400,
        headers
      );
    }

    const rec = await RecordModel.create({
      userId: auth.userId,
      endpointId: auth.endpoint._id,
      data: result.value,
    });

    return jsonWithHeaders(
      {
        record: {
          id: String(rec._id),
          data: projectReadable(rec.data as Record<string, unknown>, auth.endpoint.readableFields ?? []),
          createdAt: rec.createdAt,
          updatedAt: rec.updatedAt,
        },
      },
      201,
      headers
    );
  });
}
