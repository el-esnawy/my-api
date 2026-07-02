import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { DataSchema } from "@/lib/models/DataSchema";
import { Endpoint } from "@/lib/models/Endpoint";
import { RecordModel } from "@/lib/models/Record";
import { requireSession } from "@/lib/api/dashboardAuth";
import { updateSchemaInput } from "@/lib/validation/schemas";
import { serializeSchema } from "@/lib/api/serialize";
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
    // Scope by organizationId so one org can never read another's schema.
    const schema = await DataSchema.findOne({ _id: id, organizationId: auth.session.orgId });
    if (!schema) return notFound(t("api.errors.schemaNotFound"));
    return ok({ schema: serializeSchema(schema) });
  });
}

export async function PUT(req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(req);
    const auth = await requireSession(t);
    if ("response" in auth) return auth.response;
    const { id } = await params;

    const body = await req.json().catch(() => null);
    const parsed = updateSchemaInput.safeParse(body);
    if (!parsed.success) {
      return badRequest(t("api.errors.validationFailed"), { fields: zodErrors(parsed.error, t) });
    }

    if (parsed.data.fields) {
      const names = parsed.data.fields.map((f) => f.name);
      if (new Set(names).size !== names.length) {
        return badRequest(t("api.errors.fieldNamesUnique"));
      }
    }

    await connectDB();
    try {
      const schema = await DataSchema.findOneAndUpdate(
        { _id: id, organizationId: auth.session.orgId },
        { $set: parsed.data },
        { new: true }
      );
      if (!schema) return notFound(t("api.errors.schemaNotFound"));
      return ok({ schema: serializeSchema(schema) });
    } catch (err: any) {
      if (err?.code === 11000) return conflict(t("api.errors.schemaSlugExists"));
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

    // Refuse to delete a schema that endpoints still depend on.
    const inUse = await Endpoint.countDocuments({
      organizationId: auth.session.orgId,
      schemaId: id,
    });
    if (inUse > 0) {
      return conflict(t("api.errors.schemaInUse", { count: inUse }));
    }

    const deleted = await DataSchema.findOneAndDelete({
      _id: id,
      organizationId: auth.session.orgId,
    });
    if (!deleted) return notFound(t("api.errors.schemaNotFound"));

    // The schema owns its entries — remove them with it.
    await RecordModel.deleteMany({ organizationId: auth.session.orgId, schemaId: deleted._id });

    return ok({ success: true });
  });
}
