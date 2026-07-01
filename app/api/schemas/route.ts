import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { DataSchema } from "@/lib/models/DataSchema";
import { requireSession } from "@/lib/api/dashboardAuth";
import { createSchemaInput } from "@/lib/validation/schemas";
import { serializeSchema } from "@/lib/api/serialize";
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
    const schemas = await DataSchema.find({ userId: auth.session.userId }).sort({
      createdAt: -1,
    });
    return ok({ schemas: schemas.map(serializeSchema) });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(req);
    const auth = await requireSession(t);
    if ("response" in auth) return auth.response;

    const body = await req.json().catch(() => null);
    const parsed = createSchemaInput.safeParse(body);
    if (!parsed.success) {
      return badRequest(t("api.errors.validationFailed"), { fields: zodErrors(parsed.error, t) });
    }

    // Field names must be unique within a schema.
    const names = parsed.data.fields.map((f) => f.name);
    if (new Set(names).size !== names.length) {
      return badRequest(t("api.errors.fieldNamesUnique"));
    }

    await connectDB();
    try {
      const schema = await DataSchema.create({
        userId: auth.session.userId,
        name: parsed.data.name,
        slug: parsed.data.slug,
        fields: parsed.data.fields,
      });
      return created({ schema: serializeSchema(schema) });
    } catch (err: any) {
      if (err?.code === 11000) return conflict(t("api.errors.schemaSlugExists"));
      throw err;
    }
  });
}
