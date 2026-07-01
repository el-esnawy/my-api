import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

export const HTTP_METHODS = [
  "GET_MANY",
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "PUT_MANY",
  "PATCH_MANY",
] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

/**
 * An Endpoint exposes a DataSchema as a REST resource. `methods` controls which
 * operations are allowed; `readableFields` controls what read methods return;
 * `writableFields` controls what write methods accept ("choose what to get and
 * what to mutate").
 */
const endpointSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    schemaId: { type: Schema.Types.ObjectId, ref: "DataSchema", required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    methods: {
      type: [{ type: String, enum: HTTP_METHODS }],
      default: ["GET_MANY", "GET", "POST", "PUT", "PATCH", "DELETE", "PUT_MANY", "PATCH_MANY"],
    },
    methodsVersion: { type: Number },
    readableFields: { type: [String], default: [] },
    writableFields: { type: [String], default: [] },
  },
  { timestamps: true }
);

endpointSchema.index({ userId: 1, slug: 1 }, { unique: true });

export type EndpointDoc = InferSchemaType<typeof endpointSchema> & {
  _id: import("mongoose").Types.ObjectId;
};

export const Endpoint =
  (models.Endpoint as Model<EndpointDoc>) ||
  model<EndpointDoc>("Endpoint", endpointSchema);
