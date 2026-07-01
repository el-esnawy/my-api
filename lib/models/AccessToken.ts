import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

/**
 * A grant ties a token to a single endpoint with read/write permissions. A token
 * can only reach endpoints it has an explicit grant for — and only endpoints
 * owned by the same user (enforced at request time).
 */
const grantSchema = new Schema(
  {
    endpointId: { type: Schema.Types.ObjectId, ref: "Endpoint", required: true },
    read: { type: Boolean, default: true },
    write: { type: Boolean, default: false },
  },
  { _id: false }
);

const accessTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    // sha256 of the plaintext token — used to authenticate public API requests.
    tokenHash: { type: String, required: true, unique: true },
    tokenPrefix: { type: String, required: true },
    // AES-256-GCM ciphertext of the plaintext token, so the owner can reveal it
    // again later. `select: false` keeps it out of default queries — only the
    // reveal route explicitly selects it.
    tokenEncrypted: { type: String, required: true, select: false },
    grants: { type: [grantSchema], default: [] },
    lastUsedAt: { type: Date },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type GrantDoc = InferSchemaType<typeof grantSchema>;
export type AccessTokenDoc = InferSchemaType<typeof accessTokenSchema> & {
  _id: import("mongoose").Types.ObjectId;
};

export const AccessToken =
  (models.AccessToken as Model<AccessTokenDoc>) ||
  model<AccessTokenDoc>("AccessToken", accessTokenSchema);
