import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

export const FIELD_TYPES = ["string", "number", "boolean", "date", "enum"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

const fieldSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: FIELD_TYPES, required: true },
    required: { type: Boolean, default: false },
    unique: { type: Boolean, default: false },
    enumValues: { type: [String], default: undefined },
  },
  { _id: false }
);

/**
 * A DataSchema is a user-defined "data type": a named collection of typed
 * fields. Endpoints reference a DataSchema to validate the records they store.
 */
const dataSchemaSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    fields: { type: [fieldSchema], default: [] },
  },
  { timestamps: true }
);

// Slugs are unique per organization (not globally) — the tenant owns its namespace.
dataSchemaSchema.index({ organizationId: 1, slug: 1 }, { unique: true });

export type FieldDoc = InferSchemaType<typeof fieldSchema>;
export type DataSchemaDoc = InferSchemaType<typeof dataSchemaSchema> & {
  _id: import("mongoose").Types.ObjectId;
};

export const DataSchema =
  (models.DataSchema as Model<DataSchemaDoc>) ||
  model<DataSchemaDoc>("DataSchema", dataSchemaSchema);
