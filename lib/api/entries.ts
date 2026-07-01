import { isValidObjectId } from "mongoose";
import { DataSchema, type DataSchemaDoc } from "@/lib/models/DataSchema";
import type { SchemaFieldLike } from "@/lib/records/validate";

/**
 * Shared plumbing for the dashboard entries routes: resolve a schema by id
 * strictly within the signed-in user's tenancy and normalize its fields.
 */
export async function loadOwnedSchema(
  schemaId: string,
  userId: string
): Promise<{ schema: DataSchemaDoc; fields: SchemaFieldLike[] } | null> {
  if (!isValidObjectId(schemaId)) return null;
  const schema = await DataSchema.findOne({ _id: schemaId, userId });
  if (!schema) return null;
  return {
    schema,
    fields: schema.fields.map((f: any) => ({
      name: f.name,
      type: f.type,
      required: !!f.required,
      unique: !!f.unique,
      enumValues: f.enumValues ?? null,
    })),
  };
}
