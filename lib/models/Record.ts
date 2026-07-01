import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

/**
 * A Record ("entry" in the dashboard) is one stored document of user data.
 * Records are owned by a DataSchema — endpoints are projections over the
 * schema's data pool, so two endpoints backed by the same schema read and
 * write the same records. `endpointId` is kept as provenance (which endpoint
 * created the record via the public API; null for dashboard-created entries).
 * Every record carries its owning `userId` so all queries stay per-tenant.
 */
const recordSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    schemaId: { type: Schema.Types.ObjectId, ref: "DataSchema", required: true },
    endpointId: { type: Schema.Types.ObjectId, ref: "Endpoint" },
    data: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Primary access pattern: list/find records for one schema owned by one user.
recordSchema.index({ schemaId: 1, userId: 1, createdAt: -1 });

export type RecordDoc = InferSchemaType<typeof recordSchema> & {
  _id: import("mongoose").Types.ObjectId;
};

export const RecordModel =
  (models.Record as Model<RecordDoc>) ||
  model<RecordDoc>("Record", recordSchema);
