import { Schema, model, type HydratedDocument } from "mongoose";

export interface ICategory {
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CategoryDocument = HydratedDocument<ICategory>;

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500 },
    image: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Category = model<ICategory>("Category", categorySchema);