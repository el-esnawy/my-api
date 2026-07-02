import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { RecordModel } from "@/lib/models/Record";
import { requireSession } from "@/lib/api/dashboardAuth";
import { loadOwnedSchema } from "@/lib/api/entries";
import { serializeRecord } from "@/lib/api/serialize";
import { getRequestTranslator } from "@/i18n/server";
import { notFound, ok, withErrorHandling } from "@/lib/api/respond";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

const MAX_LISTED = 2000;

/** GET /api/schemas/:id/entries — all entries of one owned schema (editor working set). */
export async function GET(_req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(_req);
    const auth = await requireSession(t);
    if ("response" in auth) return auth.response;
    const { id } = await params;

    await connectDB();
    const owned = await loadOwnedSchema(id, auth.session.orgId);
    if (!owned) return notFound(t("api.errors.schemaNotFound"));

    // Oldest-first so the editor reads like an append-only sheet.
    const entries = await RecordModel.find({
      organizationId: auth.session.orgId,
      schemaId: owned.schema._id,
    })
      .sort({ createdAt: 1 })
      .limit(MAX_LISTED);

    return ok({
      entries: entries.map(serializeRecord),
      truncated: entries.length === MAX_LISTED,
    });
  });
}
