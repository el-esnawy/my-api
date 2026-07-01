import type { NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { RecordModel } from "@/lib/models/Record";
import type { HttpMethod } from "@/lib/models/Endpoint";
import { gate, loadFields, jsonWithHeaders } from "@/lib/api/publicEngine";
import {
  validateRecordData,
  projectReadable,
  coerceScalar,
} from "@/lib/records/validate";
import { findUniqueConflicts, type UniqueCandidate } from "@/lib/records/unique";
import { withErrorHandling } from "@/lib/api/respond";

export const runtime = "nodejs";

type Params = { params: Promise<{ endpoint: string }> };
type ManyUpdateMethod = Extract<HttpMethod, "PUT_MANY" | "PATCH_MANY">;

interface ManyUpdateItem {
  id: string;
  data: Record<string, unknown>;
}

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

    // Records are owned by the schema; the endpoint is a projection over them.
    const filter: Record<string, unknown> = {
      userId: auth.userId,
      schemaId: auth.endpoint.schemaId,
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
    const { auth, headers, t } = g;

    await connectDB();
    const fields = await loadFields(auth);
    const body = await req.json().catch(() => null);

    const result = validateRecordData(fields, body, {
      writableFields: auth.endpoint.writableFields ?? [],
      t,
    });
    if (!result.ok) {
      return jsonWithHeaders(
        { error: t("api.errors.validationFailed"), fields: result.errors },
        400,
        headers
      );
    }

    const conflicts = await findUniqueConflicts({
      schemaId: String(auth.endpoint.schemaId),
      userId: auth.userId,
      fields,
      candidates: [{ data: result.value! }],
    });
    if (conflicts.length > 0) {
      const errors: Record<string, string> = {};
      for (const c of conflicts) errors[c.field] = t("validation.record.unique");
      return jsonWithHeaders({ error: t("api.errors.validationFailed"), fields: errors }, 400, headers);
    }

    const rec = await RecordModel.create({
      userId: auth.userId,
      schemaId: auth.endpoint.schemaId,
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

function parseManyUpdateBody(input: unknown): ManyUpdateItem[] | null {
  const rawItems = Array.isArray(input)
    ? input
    : input && typeof input === "object" && Array.isArray((input as any).updates)
      ? (input as any).updates
      : input && typeof input === "object" && Array.isArray((input as any).records)
        ? (input as any).records
        : null;

  if (!rawItems) return null;

  const items: ManyUpdateItem[] = [];
  for (const item of rawItems) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const objectItem = item as Record<string, unknown>;
    const id = objectItem.id;
    if (typeof id !== "string" || id.trim() === "") return null;
    const data =
      objectItem.data && typeof objectItem.data === "object" && !Array.isArray(objectItem.data)
        ? (objectItem.data as Record<string, unknown>)
        : Object.fromEntries(
            Object.entries(objectItem).filter(
              ([key]) => key !== "id" && key !== "_id" && key !== "recordId"
            )
          );
    items.push({ id, data });
  }

  return items.length > 0 ? items : null;
}

async function applyManyUpdate(
  req: NextRequest,
  params: Params["params"],
  method: ManyUpdateMethod
) {
  return withErrorHandling(async () => {
    const { endpoint: slug } = await params;
    const g = await gate(req, slug, method);
    if (!g.ok) return g.response;
    const { auth, headers, t } = g;

    const body = await req.json().catch(() => null);
    const items = parseManyUpdateBody(body);
    if (!items) {
      return jsonWithHeaders(
        {
          error: t("api.errors.validationFailed"),
          fields: { _root: t("validation.record.manyBody") },
        },
        400,
        headers
      );
    }

    await connectDB();
    const fields = await loadFields(auth);
    const schemaId = String(auth.endpoint.schemaId);
    const userId = auth.userId;
    const partial = method === "PATCH_MANY";

    const errors: { id: string; fields: Record<string, string> }[] = [];
    const seenIds = new Set<string>();
    const duplicateIds = new Set<string>();
    for (const item of items) {
      if (seenIds.has(item.id)) duplicateIds.add(item.id);
      else seenIds.add(item.id);
    }
    for (const id of duplicateIds) {
      errors.push({ id, fields: { _root: t("api.errors.duplicateUpdateId") } });
    }

    const invalidIds = items.filter((item) => !isValidObjectId(item.id));
    for (const item of invalidIds) {
      errors.push({ id: item.id, fields: { _root: t("api.errors.unknownEntry") } });
    }

    const validIds = items.map((item) => item.id).filter((id) => isValidObjectId(id));
    const records = await RecordModel.find({
      _id: { $in: validIds },
      userId,
      schemaId,
    });
    const recordById = new Map(records.map((record) => [String(record._id), record]));
    for (const id of validIds) {
      if (!recordById.has(id)) {
        errors.push({ id, fields: { _root: t("api.errors.unknownEntry") } });
      }
    }

    const validatedUpdates: {
      id: string;
      data: Record<string, unknown>;
      nextData: Record<string, unknown>;
    }[] = [];
    for (const item of items) {
      if (!isValidObjectId(item.id) || !recordById.has(item.id) || duplicateIds.has(item.id)) {
        continue;
      }
      const result = validateRecordData(fields, item.data, {
        partial,
        writableFields: auth.endpoint.writableFields ?? [],
        t,
      });
      if (!result.ok) {
        errors.push({ id: item.id, fields: result.errors! });
        continue;
      }
      const record = recordById.get(item.id)!;
      const nextData = {
        ...(record.data as Record<string, unknown>),
        ...result.value,
      };
      validatedUpdates.push({ id: item.id, data: result.value!, nextData });
    }

    const candidates: UniqueCandidate[] = validatedUpdates.map((update) => ({
      data: update.nextData,
      excludeId: update.id,
    }));
    const conflicts = await findUniqueConflicts({
      schemaId,
      userId,
      fields,
      candidates,
    });
    for (const conflict of conflicts) {
      const update = validatedUpdates[conflict.index];
      errors.push({
        id: update.id,
        fields: { [conflict.field]: t("validation.record.unique") },
      });
    }

    if (errors.length > 0) {
      return jsonWithHeaders(
        { error: t("api.errors.entriesInvalid"), items: errors },
        400,
        headers
      );
    }

    await RecordModel.bulkWrite(
      validatedUpdates.map((update) => ({
        updateOne: {
          filter: { _id: update.id, userId, schemaId },
          update: { $set: { data: update.nextData } },
        },
      }))
    );

    return jsonWithHeaders({ updated: validatedUpdates.length }, 200, headers);
  });
}

/** PUT /api/v1/:endpoint — full update for many records. */
export function PUT(req: NextRequest, { params }: Params) {
  return applyManyUpdate(req, params, "PUT_MANY");
}

/** PATCH /api/v1/:endpoint — partial update for many records. */
export function PATCH(req: NextRequest, { params }: Params) {
  return applyManyUpdate(req, params, "PATCH_MANY");
}
