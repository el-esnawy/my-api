import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Endpoint } from "@/lib/models/Endpoint";
import { DataSchema } from "@/lib/models/DataSchema";
import { AccessToken } from "@/lib/models/AccessToken";
import { requireSession } from "@/lib/api/dashboardAuth";
import { updateEndpointInput } from "@/lib/validation/schemas";
import { serializeEndpoint } from "@/lib/api/serialize";
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
    const endpoint = await Endpoint.findOne({ _id: id, userId: auth.session.userId });
    if (!endpoint) return notFound("Endpoint not found");
    return ok({ endpoint: serializeEndpoint(endpoint) });
  });
}

export async function PUT(req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const auth = await requireSession();
    if ("response" in auth) return auth.response;
    const { id } = await params;

    const body = await req.json().catch(() => null);
    const parsed = updateEndpointInput.safeParse(body);
    if (!parsed.success) {
      return badRequest("Validation failed", { fields: zodErrors(parsed.error) });
    }

    await connectDB();
    const endpoint = await Endpoint.findOne({ _id: id, userId: auth.session.userId });
    if (!endpoint) return notFound("Endpoint not found");

    // Determine the effective schema (possibly changed) and validate field subsets.
    const effectiveSchemaId = parsed.data.schemaId ?? String(endpoint.schemaId);
    const schema = await DataSchema.findOne({
      _id: effectiveSchemaId,
      userId: auth.session.userId,
    });
    if (!schema) return badRequest("Unknown schema");

    const fieldNames = new Set(schema.fields.map((f) => f.name));
    const readable = parsed.data.readableFields ?? endpoint.readableFields;
    const writable = parsed.data.writableFields ?? endpoint.writableFields;
    const unknown = [...readable, ...writable].filter((f) => !fieldNames.has(f));
    if (unknown.length) {
      return badRequest("Readable/writable fields must belong to the schema", { unknown });
    }

    Object.assign(endpoint, parsed.data);
    try {
      await endpoint.save();
      return ok({ endpoint: serializeEndpoint(endpoint) });
    } catch (err: any) {
      if (err?.code === 11000) return conflict("You already have an endpoint with that slug");
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
    const endpoint = await Endpoint.findOneAndDelete({
      _id: id,
      userId: auth.session.userId,
    });
    if (!endpoint) return notFound("Endpoint not found");

    // Records are owned by the schema, so they survive endpoint deletion —
    // only the token grants pointing at this endpoint need cleaning up.
    await AccessToken.updateMany(
      { userId: auth.session.userId },
      { $pull: { grants: { endpointId: endpoint._id } } }
    );

    return ok({ success: true });
  });
}
