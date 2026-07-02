import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

export const PLANS = ["hobby", "pro", "enterprise"] as const;
export type PlanName = (typeof PLANS)[number];

/**
 * An Organization is the tenant boundary: it owns schemas, endpoints, tokens,
 * and records. Users join an organization through a Membership.
 */
const organizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    plan: { type: String, enum: PLANS, default: "hobby", required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export type OrganizationDoc = InferSchemaType<typeof organizationSchema> & {
  _id: import("mongoose").Types.ObjectId;
};

export const Organization =
  (models.Organization as Model<OrganizationDoc>) ||
  model<OrganizationDoc>("Organization", organizationSchema);
