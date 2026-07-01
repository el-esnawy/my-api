import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { DataSchema } from "@/lib/models/DataSchema";
import { Endpoint } from "@/lib/models/Endpoint";
import { RecordModel } from "@/lib/models/Record";
import { requireSession } from "@/lib/api/dashboardAuth";
import { updateSchemaInput } from "@/lib/validation/schemas";
import { serializeSchema } from "@/lib/api/serialize";
import {
  badRequest,
  conflict,
  notFound,
  ok,
  withErrorHandling,
  zodErrors,
} from "@/lib/api/respond";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const auth = await requireSession();
    if ("response" in auth) return auth.response;
    const { id } = await params;

    await connectDB();
    // Scope by userId so one user can never read another's schema.
    const schema = await DataSchema.findOne({ _id: id, userId: auth.session.userId });
    if (!schema) return notFound("Schema not found");
    return ok({ schema: serializeSchema(schema) });
  });
}

export async function PUT(req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const auth = await requireSession();
    if ("response" in auth) return auth.response;
    const { id } = await params;

    const body = await req.json().catch(() => null);
    const parsed = updateSchemaInput.safeParse(body);
    if (!parsed.success) {
      return badRequest("Validation failed", { fields: zodErrors(parsed.error) });
    }

    if (parsed.data.fields) {
      const names = parsed.data.fields.map((f) => f.name);
      if (new Set(names).size !== names.length) {
        return badRequest("Field names must be unique");
      }
    }

    await connectDB();
    try {
      const schema = await DataSchema.findOneAndUpdate(
        { _id: id, userId: auth.session.userId },
        { $set: parsed.data },
        { new: true }
      );
      if (!schema) return notFound("Schema not found");
      return ok({ schema: serializeSchema(schema) });
    } catch (err: any) {
      if (err?.code === 11000) return conflict("You already have a schema with that slug");
      throw err;
    }
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const auth = await requireSession();
    if ("response" in auth) return auth.response;
    const { id } = await params;

    await connectDB();

    // Refuse to delete a schema that endpoints still depend on.
    const inUse = await Endpoint.countDocuments({
      userId: auth.session.userId,
      schemaId: id,
    });
    if (inUse > 0) {
      return conflict(
        `Schema is used by ${inUse} endpoint(s). Delete those endpoints first.`
      );
    }

    const deleted = await DataSchema.findOneAndDelete({
      _id: id,
      userId: auth.session.userId,
    });
    if (!deleted) return notFound("Schema not found");

    // The schema owns its entries — remove them with it.
    await RecordModel.deleteMany({ userId: auth.session.userId, schemaId: deleted._id });

    return ok({ success: true });
  });
}
