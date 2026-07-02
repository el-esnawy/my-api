import type { NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { RecordModel } from "@/lib/models/Record";
import { requireSession } from "@/lib/api/dashboardAuth";
import { loadOwnedSchema } from "@/lib/api/entries";
import { batchEntriesInput } from "@/lib/validation/schemas";
import { validateRecordData } from "@/lib/records/validate";
import { findUniqueConflicts, type UniqueCandidate } from "@/lib/records/unique";
import { getRequestTranslator } from "@/i18n/server";
import {
  badRequest,
  notFound,
  ok,
  withErrorHandling,
  zodErrors,
} from "@/lib/api/respond";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** Per-item error, addressed by the client's tempId (creates) or record id (updates/deletes). */
interface ItemError {
  tempId?: string;
  id?: string;
  fields: Record<string, string>;
}

/**
 * POST /api/schemas/:id/entries/batch — commit a staged editing session.
 * All items are validated first (shape, required, types, unique); if anything
 * fails, NOTHING is written and every error is reported so the client can fix
 * and retry. Only a fully valid batch is applied.
 */
export async function POST(req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const t = await getRequestTranslator(req);
    const auth = await requireSession(t);
    if ("response" in auth) return auth.response;
    const { id } = await params;

    const body = await req.json().catch(() => null);
    const parsed = batchEntriesInput.safeParse(body);
    if (!parsed.success) {
      return badRequest(t("api.errors.validationFailed"), { fields: zodErrors(parsed.error, t) });
    }
    const { creates, updates, deletes } = parsed.data;

    await connectDB();
    const owned = await loadOwnedSchema(id, auth.session.orgId);
    if (!owned) return notFound(t("api.errors.schemaNotFound"));
    const schemaId = String(owned.schema._id);
    const organizationId = auth.session.orgId;

    const errors: ItemError[] = [];

    // --- Referenced records must exist and belong to this organization + schema ---
    const referencedIds = [...updates.map((u) => u.id), ...deletes];
    const invalidIds = referencedIds.filter((rid) => !isValidObjectId(rid));
    for (const rid of invalidIds) {
      errors.push({ id: rid, fields: { _root: t("api.errors.unknownEntry") } });
    }
    const validIds = referencedIds.filter((rid) => isValidObjectId(rid));
    const found = await RecordModel.find({
      _id: { $in: validIds },
      organizationId,
      schemaId,
    }).select("_id");
    const foundSet = new Set(found.map((r) => String(r._id)));
    for (const rid of validIds) {
      if (!foundSet.has(rid)) errors.push({ id: rid, fields: { _root: t("api.errors.unknownEntry") } });
    }

    // --- Field-level validation (required, types, enums) ---
    const validatedCreates: { tempId: string; data: Record<string, unknown> }[] = [];
    for (const c of creates) {
      const result = validateRecordData(owned.fields, c.data, { t });
      if (!result.ok) errors.push({ tempId: c.tempId, fields: result.errors! });
      else validatedCreates.push({ tempId: c.tempId, data: result.value! });
    }
    const validatedUpdates: { id: string; data: Record<string, unknown> }[] = [];
    for (const u of updates) {
      const result = validateRecordData(owned.fields, u.data, { t });
      if (!result.ok) errors.push({ id: u.id, fields: result.errors! });
      else validatedUpdates.push({ id: u.id, data: result.value! });
    }

    // --- Uniqueness across the batch and the database ---
    const candidates: UniqueCandidate[] = [
      ...validatedCreates.map((c) => ({ data: c.data })),
      ...validatedUpdates.map((u) => ({ data: u.data, excludeId: u.id })),
    ];
    const conflicts = await findUniqueConflicts({
      schemaId,
      organizationId,
      fields: owned.fields,
      candidates,
      extraExcludeIds: deletes.filter((d) => isValidObjectId(d)),
    });
    for (const conflict of conflicts) {
      const ref =
        conflict.index < validatedCreates.length
          ? { tempId: validatedCreates[conflict.index].tempId }
          : { id: validatedUpdates[conflict.index - validatedCreates.length].id };
      errors.push({ ...ref, fields: { [conflict.field]: t("validation.record.unique") } });
    }

    if (errors.length > 0) {
      return badRequest(t("api.errors.entriesInvalid"), { items: errors });
    }

    // --- Apply (validation passed for every item) ---
    if (validatedCreates.length > 0) {
      await RecordModel.insertMany(
        validatedCreates.map((c) => ({
          organizationId,
          createdBy: auth.session.userId,
          schemaId,
          data: c.data,
        }))
      );
    }
    if (validatedUpdates.length > 0) {
      await RecordModel.bulkWrite(
        validatedUpdates.map((u) => ({
          updateOne: {
            filter: { _id: u.id, organizationId, schemaId },
            update: { $set: { data: u.data } },
          },
        }))
      );
    }
    if (deletes.length > 0) {
      await RecordModel.deleteMany({ _id: { $in: deletes }, organizationId, schemaId });
    }

    return ok({
      created: validatedCreates.length,
      updated: validatedUpdates.length,
      deleted: deletes.length,
    });
  });
}
