import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Endpoint } from "@/lib/models/Endpoint";
import { DataSchema } from "@/lib/models/DataSchema";
import { AccessToken } from "@/lib/models/AccessToken";
import { requireSession } from "@/lib/api/dashboardAuth";
import { updateEndpointInput } from "@/lib/validation/schemas";
import { serializeEndpoint } from "@/lib/api/serialize";
import { getRequestTranslator } from "@/i18n/server";
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
    const t = await getRequestTranslator(_req);
    const auth = await requireSession(t);
    if ("response" in auth) return auth.response;
    const { id } = await params;

    await connectDB();
    const endpoint = await Endpoint.findOne({ _id: id, organizationId: auth.session.orgId });
    if (!endpoint) return notFound(t("api.errors.endpointNotFound"));
    return ok({ endpoint: serializeEndpoint(endpoint) });
  });
}

export async function PUT(req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(req);
    const auth = await requireSession(t);
    if ("response" in auth) return auth.response;
    const { id } = await params;

    const body = await req.json().catch(() => null);
    const parsed = updateEndpointInput.safeParse(body);
    if (!parsed.success) {
      return badRequest(t("api.errors.validationFailed"), { fields: zodErrors(parsed.error, t) });
    }

    await connectDB();
    const endpoint = await Endpoint.findOne({ _id: id, organizationId: auth.session.orgId });
    if (!endpoint) return notFound(t("api.errors.endpointNotFound"));

    // Determine the effective schema (possibly changed) and validate field subsets.
    const effectiveSchemaId = parsed.data.schemaId ?? String(endpoint.schemaId);
    const schema = await DataSchema.findOne({
      _id: effectiveSchemaId,
      organizationId: auth.session.orgId,
    });
    if (!schema) return badRequest(t("api.errors.unknownSchema"));

    const fieldNames = new Set(schema.fields.map((f) => f.name));
    const readable = parsed.data.readableFields ?? endpoint.readableFields;
    const writable = parsed.data.writableFields ?? endpoint.writableFields;
    const unknown = [...readable, ...writable].filter((f) => !fieldNames.has(f));
    if (unknown.length) {
      return badRequest(t("api.errors.endpointFieldsInvalid"), { unknown });
    }

    if (parsed.data.name !== undefined) endpoint.name = parsed.data.name;
    if (parsed.data.slug !== undefined) endpoint.slug = parsed.data.slug;
    if (parsed.data.schemaId !== undefined) endpoint.schemaId = schema._id;
    if (parsed.data.methods !== undefined) {
      endpoint.methods = parsed.data.methods;
      (endpoint as any).methodsVersion = 2;
    }
    if (parsed.data.readableFields !== undefined) {
      endpoint.readableFields = parsed.data.readableFields;
    }
    if (parsed.data.writableFields !== undefined) {
      endpoint.writableFields = parsed.data.writableFields;
    }
    try {
      await endpoint.save();
      return ok({ endpoint: serializeEndpoint(endpoint) });
    } catch (err: any) {
      if (err?.code === 11000) return conflict(t("api.errors.endpointSlugExists"));
      throw err;
    }
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(_req);
    const auth = await requireSession(t);
    if ("response" in auth) return auth.response;
    const { id } = await params;

    await connectDB();
    const endpoint = await Endpoint.findOneAndDelete({
      _id: id,
      organizationId: auth.session.orgId,
    });
    if (!endpoint) return notFound(t("api.errors.endpointNotFound"));

    // Records are owned by the schema, so they survive endpoint deletion —
    // only the token grants pointing at this endpoint need cleaning up.
    await AccessToken.updateMany(
      { organizationId: auth.session.orgId },
      { $pull: { grants: { endpointId: endpoint._id } } }
    );

    return ok({ success: true });
  });
}
