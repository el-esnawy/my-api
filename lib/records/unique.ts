import { RecordModel } from "@/lib/models/Record";
import type { SchemaFieldLike } from "./validate";

/**
 * Uniqueness enforcement for schema fields marked `unique`. A value conflicts
 * when another record of the same schema (same tenant) already holds it —
 * excluding records the caller is about to delete or is currently updating.
 */

export interface UniqueCandidate {
  /** Cleaned, validated data about to be written. */
  data: Record<string, unknown>;
  /** For updates: the record's own id, excluded from conflict checks. */
  excludeId?: string;
}

export interface UniqueConflict {
  /** Index into the candidates array. */
  index: number;
  field: string;
  value: unknown;
  /** "db" = clashes with a stored record; "batch" = clashes with an earlier candidate. */
  source: "db" | "batch";
}

function hasValue(v: unknown): boolean {
  return v !== undefined && v !== null;
}

/**
 * Check candidates against stored records AND against each other (earlier
 * candidates win). Returns every conflict found; callers decide whether to
 * fail the whole batch (save) or skip individual items (import).
 */
export async function findUniqueConflicts({
  schemaId,
  userId,
  fields,
  candidates,
  extraExcludeIds = [],
}: {
  schemaId: string;
  userId: string;
  fields: SchemaFieldLike[];
  candidates: UniqueCandidate[];
  /** Record ids being deleted in the same operation — their values are freed up. */
  extraExcludeIds?: string[];
}): Promise<UniqueConflict[]> {
  const uniqueFields = fields.filter((f) => f.unique).map((f) => f.name);
  if (uniqueFields.length === 0 || candidates.length === 0) return [];

  const conflicts: UniqueConflict[] = [];

  // 1) Within the candidate set itself: first occurrence wins.
  const seen = new Map<string, Set<unknown>>();
  for (const field of uniqueFields) seen.set(field, new Set());
  for (let i = 0; i < candidates.length; i++) {
    for (const field of uniqueFields) {
      const value = candidates[i].data[field];
      if (!hasValue(value)) continue;
      const set = seen.get(field)!;
      if (set.has(value)) {
        conflicts.push({ index: i, field, value, source: "batch" });
      } else {
        set.add(value);
      }
    }
  }

  // 2) Against the database, one query for all fields/values at once.
  const or: Record<string, unknown>[] = [];
  for (const field of uniqueFields) {
    const values = [...seen.get(field)!];
    if (values.length > 0) or.push({ [`data.${field}`]: { $in: values } });
  }
  if (or.length === 0) return conflicts;

  const excludeIds = [
    ...extraExcludeIds,
    ...candidates.map((c) => c.excludeId).filter((id): id is string => !!id),
  ];

  const existing = await RecordModel.find({
    userId,
    schemaId,
    $or: or,
    ...(excludeIds.length > 0 ? { _id: { $nin: excludeIds } } : {}),
  }).select("data");

  if (existing.length === 0) return conflicts;

  // Map stored values per field for fast lookup.
  const stored = new Map<string, Set<unknown>>();
  for (const field of uniqueFields) stored.set(field, new Set());
  for (const rec of existing) {
    const data = (rec.data ?? {}) as Record<string, unknown>;
    for (const field of uniqueFields) {
      if (hasValue(data[field])) stored.get(field)!.add(data[field]);
    }
  }

  for (let i = 0; i < candidates.length; i++) {
    for (const field of uniqueFields) {
      const value = candidates[i].data[field];
      if (!hasValue(value)) continue;
      if (stored.get(field)!.has(value)) {
        conflicts.push({ index: i, field, value, source: "db" });
      }
    }
  }

  return conflicts;
}
