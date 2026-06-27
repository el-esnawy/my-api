import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

/**
 * A Record is one stored document for an endpoint. `data` is schema-validated
 * application data (shape defined by the endpoint's DataSchema). Every record
 * carries its owning `userId` so all queries can be scoped per-tenant.
 */
const recordSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    endpointId: { type: Schema.Types.ObjectId, ref: "Endpoint", required: true },
    data: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Primary access pattern: list/find records for one endpoint owned by one user.
recordSchema.index({ endpointId: 1, userId: 1, createdAt: -1 });

export type RecordDoc = InferSchemaType<typeof recordSchema> & {
  _id: import("mongoose").Types.ObjectId;
};

export const RecordModel =
  (models.Record as Model<RecordDoc>) ||
  model<RecordDoc>("Record", recordSchema);
