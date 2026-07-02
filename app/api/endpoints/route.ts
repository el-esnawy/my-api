import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Endpoint } from "@/lib/models/Endpoint";
import { DataSchema } from "@/lib/models/DataSchema";
import { requireSession } from "@/lib/api/dashboardAuth";
import { assertUnderLimit } from "@/lib/billing/enforceLimit";
import { createEndpointInput } from "@/lib/validation/schemas";
import { serializeEndpoint } from "@/lib/api/serialize";
import { getRequestTranslator } from "@/i18n/server";
import {
  badRequest,
  conflict,
  created,
  ok,
  withErrorHandling,
  zodErrors,
} from "@/lib/api/respond";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(req);
    const auth = await requireSession(t);
    if ("response" in auth) return auth.response;

    await connectDB();
    const endpoints = await Endpoint.find({ organizationId: auth.session.orgId }).sort({
      createdAt: -1,
    });
    return ok({ endpoints: endpoints.map(serializeEndpoint) });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(req);
    const auth = await requireSession(t);
    if ("response" in auth) return auth.response;

    const body = await req.json().catch(() => null);
    const parsed = createEndpointInput.safeParse(body);
    if (!parsed.success) {
      return badRequest(t("api.errors.validationFailed"), { fields: zodErrors(parsed.error, t) });
    }

    await connectDB();
    const limitErr = await assertUnderLimit(auth.session.orgId, "endpoints", t);
    if (limitErr) return limitErr.response;

    // The referenced schema must exist and belong to this organization.
    const schema = await DataSchema.findOne({
      _id: parsed.data.schemaId,
      organizationId: auth.session.orgId,
    });
    if (!schema) return badRequest(t("api.errors.unknownSchema"));

    // Readable/writable fields must be a subset of the schema's field names.
    const fieldNames = new Set(schema.fields.map((f) => f.name));
    const unknownReadable = parsed.data.readableFields.filter((f) => !fieldNames.has(f));
    const unknownWritable = parsed.data.writableFields.filter((f) => !fieldNames.has(f));
    if (unknownReadable.length || unknownWritable.length) {
      return badRequest(t("api.errors.endpointFieldsInvalid"), {
        unknownReadable,
        unknownWritable,
      });
    }

    try {
      const endpoint = await Endpoint.create({
        organizationId: auth.session.orgId,
        createdBy: auth.session.userId,
        schemaId: schema._id,
        name: parsed.data.name,
        slug: parsed.data.slug,
        methods: parsed.data.methods,
        methodsVersion: 2,
        readableFields: parsed.data.readableFields,
        writableFields: parsed.data.writableFields,
      });
      return created({ endpoint: serializeEndpoint(endpoint) });
    } catch (err: any) {
      if (err?.code === 11000) return conflict(t("api.errors.endpointSlugExists"));
      throw err;
    }
  });
}
