import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof userSchema> & {
  _id: import("mongoose").Types.ObjectId;
};

export const User =
  (models.User as Model<UserDoc>) || model<UserDoc>("User", userSchema);
