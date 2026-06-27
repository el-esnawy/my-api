import type { NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { RecordModel } from "@/lib/models/Record";
import type { HttpMethod } from "@/lib/models/Endpoint";
import { gate, loadFields, jsonWithHeaders } from "@/lib/api/publicEngine";
import { validateRecordData, projectReadable } from "@/lib/records/validate";
import { withErrorHandling } from "@/lib/api/respond";

export const runtime = "nodejs";

type Params = { params: Promise<{ endpoint: string; recordId: string }> };

/** GET /api/v1/:endpoint/:recordId — fetch one record. */
export async function GET(req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const { endpoint: slug, recordId } = await params;
    const g = await gate(req, slug, "GET");
    if (!g.ok) return g.response;
    const { auth, headers } = g;

    if (!isValidObjectId(recordId)) {
      return jsonWithHeaders({ error: "Record not found" }, 404, headers);
    }

    await connectDB();
    const rec = await RecordModel.findOne({
      _id: recordId,
      userId: auth.userId,
      endpointId: auth.endpoint._id,
    });
    if (!rec) return jsonWithHeaders({ error: "Record not found" }, 404, headers);

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
    const { endpoint: slug, recordId } = await params;
    const g = await gate(req, slug, method);
    if (!g.ok) return g.response;
    const { auth, headers } = g;

    if (!isValidObjectId(recordId)) {
      return jsonWithHeaders({ error: "Record not found" }, 404, headers);
    }

    await connectDB();
    const rec = await RecordModel.findOne({
      _id: recordId,
      userId: auth.userId,
      endpointId: auth.endpoint._id,
    });
    if (!rec) return jsonWithHeaders({ error: "Record not found" }, 404, headers);

    const fields = await loadFields(auth);
    const body = await req.json().catch(() => null);

    // PATCH = partial update; PUT = full update (required writable fields enforced).
    const result = validateRecordData(fields, body, {
      partial: method === "PATCH",
      writableFields: auth.endpoint.writableFields ?? [],
    });
    if (!result.ok) {
      return jsonWithHeaders({ error: "Validation failed", fields: result.errors }, 400, headers);
    }

    rec.data = { ...(rec.data as Record<string, unknown>), ...result.value };
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

/** PUT /api/v1/:endpoint/:recordId — full update. */
export function PUT(req: NextRequest, { params }: Params) {
  return applyUpdate(req, params, "PUT");
}

/** PATCH /api/v1/:endpoint/:recordId — partial update. */
export function PATCH(req: NextRequest, { params }: Params) {
  return applyUpdate(req, params, "PATCH");
}

/** DELETE /api/v1/:endpoint/:recordId — remove a record. */
export async function DELETE(req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const { endpoint: slug, recordId } = await params;
    const g = await gate(req, slug, "DELETE");
    if (!g.ok) return g.response;
    const { auth, headers } = g;

    if (!isValidObjectId(recordId)) {
      return jsonWithHeaders({ error: "Record not found" }, 404, headers);
    }

    await connectDB();
    const deleted = await RecordModel.findOneAndDelete({
      _id: recordId,
      userId: auth.userId,
      endpointId: auth.endpoint._id,
    });
    if (!deleted) return jsonWithHeaders({ error: "Record not found" }, 404, headers);

    return jsonWithHeaders({ success: true, id: recordId }, 200, headers);
  });
}
