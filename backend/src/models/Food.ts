import { Schema, model, type HydratedDocument, type Types } from "mongoose";

export interface IFood {
  name: string;
  description?: string;
  price: number;
  image?: string;
  categoryId: Types.ObjectId;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type FoodDocument = HydratedDocument<IFood>;

const foodSchema = new Schema<IFood>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    price: {
      type: Number,
      required: true,
      validate: {
        validator: (value: number): boolean => Number.isFinite(value) && value > 0,
        message: "Price must be a positive number",
      },
    },
    image: { type: String, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

foodSchema.index({ categoryId: 1, isAvailable: 1 });
foodSchema.index({ name: 1 });

export const Food = model<IFood>("Food", foodSchema);