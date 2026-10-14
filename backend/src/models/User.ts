import { Schema, model, type HydratedDocument } from "mongoose";

export const USER_ROLES = ["CUSTOMER", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    // select: false => never loaded unless explicitly requested with .select("+passwordHash")
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: "CUSTOMER", required: true },
    address: { type: String, trim: true, maxlength: 250 },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);