import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { RecordModel } from "@/lib/models/Record";
import { requireSession } from "@/lib/api/dashboardAuth";
import { loadOwnedSchema } from "@/lib/api/entries";
import { importEntriesInput } from "@/lib/validation/schemas";
import { validateRecordData } from "@/lib/records/validate";
import { findUniqueConflicts } from "@/lib/records/unique";
import {
  badRequest,
  notFound,
  ok,
  withErrorHandling,
  zodErrors,
} from "@/lib/api/respond";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

interface RejectedEntry {
  /** Index of the entry in the uploaded file. */
  index: number;
  /** The original entry as uploaded, so the user can fix and re-import it. */
  entry: Record<string, unknown>;
  reasons: string[];
}

/**
 * POST /api/schemas/:id/entries/import — bulk import with per-entry semantics:
 * an invalid entry (missing required field, bad type, unknown enum value) is
 * rejected WITHOUT failing the import; for fields marked unique, the first
 * occurrence in the file wins and later duplicates — or values that already
 * exist in stored entries — are rejected. Everything valid is inserted.
 */
export async function POST(req: NextRequest, { params }: Params) {
  return withErrorHandling(async () => {
    const auth = await requireSession();
    if ("response" in auth) return auth.response;
    const { id } = await params;

    const body = await req.json().catch(() => null);
    const parsed = importEntriesInput.safeParse(body);
    if (!parsed.success) {
      return badRequest("Validation failed", { fields: zodErrors(parsed.error) });
    }

    await connectDB();
    const owned = await loadOwnedSchema(id, auth.session.userId);
    if (!owned) return notFound("Schema not found");
    const schemaId = String(owned.schema._id);
    const userId = auth.session.userId;

    const rejected = new Map<number, RejectedEntry>();
    function reject(index: number, entry: Record<string, unknown>, reason: string) {
      const existing = rejected.get(index);
      if (existing) existing.reasons.push(reason);
      else rejected.set(index, { index, entry, reasons: [reason] });
    }

    // --- Field-level validation, entry by entry ---
    const valid: { index: number; data: Record<string, unknown> }[] = [];
    parsed.data.entries.forEach((entry, index) => {
      const result = validateRecordData(owned.fields, entry);
      if (!result.ok) {
        for (const [field, message] of Object.entries(result.errors!)) {
          reject(index, entry, field === "_root" ? message : `${field} ${message}`);
        }
      } else {
        valid.push({ index, data: result.value! });
      }
    });

    // --- Uniqueness: first occurrence in the file wins; stored values block all ---
    const conflicts = await findUniqueConflicts({
      schemaId,
      userId,
      fields: owned.fields,
      candidates: valid.map((v) => ({ data: v.data })),
    });
    const conflictedCandidates = new Set<number>();
    for (const conflict of conflicts) {
      conflictedCandidates.add(conflict.index);
      const item = valid[conflict.index];
      reject(
        item.index,
        parsed.data.entries[item.index],
        conflict.source === "batch"
          ? `duplicate value for unique field "${conflict.field}" — an earlier entry in the file already uses it`
          : `value for unique field "${conflict.field}" already exists in your stored entries`
      );
    }

    const accepted = valid.filter((_, i) => !conflictedCandidates.has(i));

    if (accepted.length > 0) {
      await RecordModel.insertMany(
        accepted.map((a) => ({ userId, schemaId, data: a.data }))
      );
    }

    return ok({
      total: parsed.data.entries.length,
      imported: accepted.length,
      rejected: [...rejected.values()].sort((a, b) => a.index - b.index),
    });
  });
}
