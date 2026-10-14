import { Schema, model, type HydratedDocument, type Types } from "mongoose";

export interface IReview {
  userId: Types.ObjectId;
  foodId: Types.ObjectId;
  orderId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ReviewDocument = HydratedDocument<IReview>;

const reviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    foodId: { type: Schema.Types.ObjectId, ref: "Food", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Rating must be an integer between 1 and 5",
      },
    },
    comment: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

// One review per user per food per order
reviewSchema.index({ userId: 1, orderId: 1, foodId: 1 }, { unique: true });
reviewSchema.index({ foodId: 1, createdAt: -1 });

export const Review = model<IReview>("Review", reviewSchema);