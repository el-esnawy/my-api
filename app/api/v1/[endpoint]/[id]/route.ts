import type { NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { RecordModel } from "@/lib/models/Record";
import type { HttpMethod } from "@/lib/models/Endpoint";
import { gate, loadFields, jsonWithHeaders } from "@/lib/api/publicEngine";
import { validateRecordData, projectReadable } from "@/lib/records/validate";
import { findUniqueConflicts } from "@/lib/records/unique";
import { withErrorHandling } from "@/lib/api/respond";

export const runtime = "nodejs";

type Params = { params: Promise<{ endpoint: string; id: string }> };

/** GET /api/v1/:endpoint/:id — fetch one record. */
export async function GET(req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const { endpoint: slug, id } = await params;
    const g = await gate(req, slug, "GET");
    if (!g.ok) return g.response;
    const { auth, headers, t } = g;

    if (!isValidObjectId(id)) {
      return jsonWithHeaders({ error: t("api.errors.recordNotFound") }, 404, headers);
    }

    await connectDB();
    const rec = await RecordModel.findOne({
      _id: id,
      userId: auth.userId,
      schemaId: auth.endpoint.schemaId,
    });
    if (!rec) return jsonWithHeaders({ error: t("api.errors.recordNotFound") }, 404, headers);

    return jsonWithHeaders(
      {
        record: {
          id: String(rec._id),
          data: projectReadable(rec.data as Record<string, unknown>, auth.endpoint.readableFields ?? []),
          createdAt: rec.createdAt,
          updatedAt: rec.updatedAt,
        },
      },
      200,
      headers
    );
  });
}

async function applyUpdate(req: NextRequest, params: Params["params"], method: HttpMethod) {
  return withErrorHandling(async () => {
    const { endpoint: slug, id } = await params;
    const g = await gate(req, slug, method);
    if (!g.ok) return g.response;
    const { auth, headers, t } = g;

    if (!isValidObjectId(id)) {
      return jsonWithHeaders({ error: t("api.errors.recordNotFound") }, 404, headers);
    }

    await connectDB();
    const rec = await RecordModel.findOne({
      _id: id,
      userId: auth.userId,
      schemaId: auth.endpoint.schemaId,
    });
    if (!rec) return jsonWithHeaders({ error: t("api.errors.recordNotFound") }, 404, headers);

    const fields = await loadFields(auth);
    const body = await req.json().catch(() => null);

    // PATCH = partial update; PUT = full update (required writable fields enforced).
    const result = validateRecordData(fields, body, {
      partial: method === "PATCH",
      writableFields: auth.endpoint.writableFields ?? [],
      t,
    });
    if (!result.ok) {
      return jsonWithHeaders({ error: t("api.errors.validationFailed"), fields: result.errors }, 400, headers);
    }

    const nextData = { ...(rec.data as Record<string, unknown>), ...result.value };

    const conflicts = await findUniqueConflicts({
      schemaId: String(auth.endpoint.schemaId),
      userId: auth.userId,
      fields,
      candidates: [{ data: nextData, excludeId: String(rec._id) }],
    });
    if (conflicts.length > 0) {
      const errors: Record<string, string> = {};
      for (const c of conflicts) errors[c.field] = t("validation.record.unique");
      return jsonWithHeaders({ error: t("api.errors.validationFailed"), fields: errors }, 400, headers);
    }

    rec.data = nextData;
    rec.markModified("data");
    await rec.save();

    return jsonWithHeaders(
      {
        record: {
          id: String(rec._id),
          data: projectReadable(rec.data as Record<string, unknown>, auth.endpoint.readableFields ?? []),
          createdAt: rec.createdAt,
          updatedAt: rec.updatedAt,
        },
      },
      200,
      headers
    );
  });
}

/** PUT /api/v1/:endpoint/:id — full update. */
export function PUT(req: NextRequest, { params }: Params) {
  return applyUpdate(req, params, "PUT");
}

/** PATCH /api/v1/:endpoint/:id — partial update. */
export function PATCH(req: NextRequest, { params }: Params) {
  return applyUpdate(req, params, "PATCH");
}

/** DELETE /api/v1/:endpoint/:id — remove a record. */
export async function DELETE(req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const { endpoint: slug, id } = await params;
    const g = await gate(req, slug, "DELETE");
    if (!g.ok) return g.response;
    const { auth, headers, t } = g;

    if (!isValidObjectId(id)) {
      return jsonWithHeaders({ error: t("api.errors.recordNotFound") }, 404, headers);
    }

    await connectDB();
    const deleted = await RecordModel.findOneAndDelete({
      _id: id,
      userId: auth.userId,
      schemaId: auth.endpoint.schemaId,
    });
    if (!deleted) return jsonWithHeaders({ error: t("api.errors.recordNotFound") }, 404, headers);

    return jsonWithHeaders({ success: true, id }, 200, headers);
  });
}
