import type { FieldType } from "@/lib/models/DataSchema";
import type { ApiTranslator } from "@/lib/api/respond";

export interface SchemaFieldLike {
  name: string;
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  enumValues?: string[] | null;
}

export interface ValidateOptions {
  /** Only validate provided fields (used for PATCH). Required-field checks are skipped. */
  partial?: boolean;
  /** If set, only these field names may be written; others are rejected. */
  writableFields?: string[];
  /** Request-specific translator for user-facing validation messages. */
  t?: ApiTranslator;
}

export interface ValidateResult {
  ok: boolean;
  value?: Record<string, unknown>;
  errors?: Record<string, string>;
}

/**
 * Validate & coerce an incoming record payload against a schema's fields.
 * Unknown fields are dropped. Returns a cleaned object with coerced types.
 */
export function validateRecordData(
  fields: SchemaFieldLike[],
  input: unknown,
  options: ValidateOptions = {}
): ValidateResult {
  const { partial = false, writableFields } = options;
  const t = options.t ?? ((key: string, values?: Record<string, unknown>) => {
    if (key === "validation.record.oneOf") return `must be one of: ${values?.values ?? ""}`;
    const fallback: Record<string, string> = {
      "validation.record.bodyObject": "Body must be a JSON object",
      "validation.record.required": "is required",
      "validation.record.string": "must be a string",
      "validation.record.number": "must be a number",
      "validation.record.boolean": "must be a boolean",
      "validation.record.date": "must be a valid date",
      "validation.record.unsupported": "unsupported type",
    };
    return fallback[key] ?? key;
  });

  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, errors: { _root: t("validation.record.bodyObject") } };
  }

  const raw = input as Record<string, unknown>;
  const writableSet =
    writableFields && writableFields.length > 0 ? new Set(writableFields) : null;

  const errors: Record<string, string> = {};
  const value: Record<string, unknown> = {};

  for (const field of fields) {
    // Skip fields not allowed to be written for this endpoint.
    if (writableSet && !writableSet.has(field.name)) continue;

    const present = Object.prototype.hasOwnProperty.call(raw, field.name);

    if (!present) {
      if (!partial && field.required) {
        errors[field.name] = t("validation.record.required");
      }
      continue;
    }

    const rawValue = raw[field.name];

    // Allow explicit null to clear an optional field.
    if (rawValue === null) {
      if (field.required && !partial) errors[field.name] = t("validation.record.required");
      else value[field.name] = null;
      continue;
    }

    const coerced = coerce(field.type, rawValue, t);
    if (coerced.error) {
      errors[field.name] = coerced.error;
      continue;
    }

    if (field.enumValues && field.enumValues.length > 0) {
      if (!field.enumValues.includes(String(coerced.value))) {
        errors[field.name] = t("validation.record.oneOf", {
          values: field.enumValues.join(", "),
        });
        continue;
      }
    }

    value[field.name] = coerced.value;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value };
}

function coerce(
  type: FieldType,
  raw: unknown,
  t: ApiTranslator
): { value?: unknown; error?: string } {
  switch (type) {
    case "string":
      if (typeof raw === "string") return { value: raw };
      if (typeof raw === "number" || typeof raw === "boolean")
        return { value: String(raw) };
      return { error: t("validation.record.string") };

    case "number": {
      if (typeof raw === "number" && Number.isFinite(raw)) return { value: raw };
      if (typeof raw === "string" && raw.trim() !== "") {
        const n = Number(raw);
        if (Number.isFinite(n)) return { value: n };
      }
      return { error: t("validation.record.number") };
    }

    case "boolean":
      if (typeof raw === "boolean") return { value: raw };
      if (raw === "true") return { value: true };
      if (raw === "false") return { value: false };
      return { error: t("validation.record.boolean") };

    case "date": {
      if (raw instanceof Date && !isNaN(raw.getTime())) return { value: raw };
      if (typeof raw === "string" || typeof raw === "number") {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) return { value: d };
      }
      return { error: t("validation.record.date") };
    }

    default:
      return { error: t("validation.record.unsupported") };
  }
}

/**
 * Coerce a single query-string value to a scalar for filtering. Returns
 * undefined if the value can't be coerced to the field type.
 */
export function coerceScalar(type: FieldType, raw: string): unknown {
  const result = coerce(type, raw, ((key: string) => key) as ApiTranslator);
  return result.error ? undefined : result.value;
}

/** Reduce a stored data object to only the readable fields (for GET responses). */
export function projectReadable(
  data: Record<string, unknown> | null | undefined,
  readableFields: string[]
): Record<string, unknown> {
  if (!data) return {};
  if (!readableFields || readableFields.length === 0) return { ...data };
  const out: Record<string, unknown> = {};
  for (const key of readableFields) {
    if (Object.prototype.hasOwnProperty.call(data, key)) out[key] = data[key];
  }
  return out;
}
