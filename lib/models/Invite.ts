import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

export const INVITE_ROLES = ["admin", "member"] as const;
export type InviteRole = (typeof INVITE_ROLES)[number];

export const INVITE_STATUSES = ["pending", "accepted", "revoked"] as const;
export type InviteStatus = (typeof INVITE_STATUSES)[number];

/**
 * An Invite lets an org owner/admin bring a new member in by email. Only
 * `tokenHash` is stored (sha256, same pattern as AccessToken) — the plaintext
 * lives in the emailed link and is never persisted.
 */
const inviteSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: INVITE_ROLES, default: "member", required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true, unique: true },
    status: { type: String, enum: INVITE_STATUSES, default: "pending", required: true },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date },
    acceptedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

inviteSchema.index({ organizationId: 1, email: 1, status: 1 });

export type InviteDoc = InferSchemaType<typeof inviteSchema> & {
  _id: import("mongoose").Types.ObjectId;
};

export const Invite =
  (models.Invite as Model<InviteDoc>) || model<InviteDoc>("Invite", inviteSchema);
