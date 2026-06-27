import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Endpoint } from "@/lib/models/Endpoint";
import { DataSchema } from "@/lib/models/DataSchema";
import { requireSession } from "@/lib/api/dashboardAuth";
import { createEndpointInput } from "@/lib/validation/schemas";
import { serializeEndpoint } from "@/lib/api/serialize";
import {
  badRequest,
  conflict,
  created,
  ok,
  withErrorHandling,
  zodErrors,
} from "@/lib/api/respond";

export const runtime = "nodejs";

export async function GET() {
  return withErrorHandling(async () => {
    const auth = await requireSession();
    if ("response" in auth) return auth.response;

    await connectDB();
    const endpoints = await Endpoint.find({ userId: auth.session.userId }).sort({
      createdAt: -1,
    });
    return ok({ endpoints: endpoints.map(serializeEndpoint) });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const auth = await requireSession();
    if ("response" in auth) return auth.response;

    const body = await req.json().catch(() => null);
    const parsed = createEndpointInput.safeParse(body);
    if (!parsed.success) {
      return badRequest("Validation failed", { fields: zodErrors(parsed.error) });
    }

    await connectDB();

    // The referenced schema must exist and belong to this user.
    const schema = await DataSchema.findOne({
      _id: parsed.data.schemaId,
      userId: auth.session.userId,
    });
    if (!schema) return badRequest("Unknown schema");

    // Readable/writable fields must be a subset of the schema's field names.
    const fieldNames = new Set(schema.fields.map((f) => f.name));
    const unknownReadable = parsed.data.readableFields.filter((f) => !fieldNames.has(f));
    const unknownWritable = parsed.data.writableFields.filter((f) => !fieldNames.has(f));
    if (unknownReadable.length || unknownWritable.length) {
      return badRequest("Readable/writable fields must belong to the schema", {
        unknownReadable,
        unknownWritable,
      });
    }

    try {
      const endpoint = await Endpoint.create({
        userId: auth.session.userId,
        schemaId: schema._id,
        name: parsed.data.name,
        slug: parsed.data.slug,
        methods: parsed.data.methods,
        readableFields: parsed.data.readableFields,
        writableFields: parsed.data.writableFields,
      });
      return created({ endpoint: serializeEndpoint(endpoint) });
    } catch (err: any) {
      if (err?.code === 11000) return conflict("You already have an endpoint with that slug");
      throw err;
    }
  });
}
