import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

export const ORG_ROLES = ["owner", "admin", "member"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

/**
 * A Membership ties a User to an Organization with a role. v1 assumes a user
 * has exactly one membership (enforced in application code, not a DB
 * constraint, so multi-org can be added later without a schema change).
 */
const membershipSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ORG_ROLES, default: "member", required: true },
  },
  { timestamps: true }
);

membershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

export type MembershipDoc = InferSchemaType<typeof membershipSchema> & {
  _id: import("mongoose").Types.ObjectId;
};

export const Membership =
  (models.Membership as Model<MembershipDoc>) ||
  model<MembershipDoc>("Membership", membershipSchema);
