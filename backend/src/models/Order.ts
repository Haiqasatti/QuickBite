import { Schema, model, type HydratedDocument, type Types } from "mongoose";

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["COD"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface IOrderItem {
  foodId: Types.ObjectId;
  name: string; // snapshot
  unitPrice: number; // snapshot
  quantity: number;
}

export interface IOrder {
  userId: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderDocument = HydratedDocument<IOrder>;

const orderItemSchema = new Schema<IOrderItem>(
  {
    foodId: { type: Schema.Types.ObjectId, ref: "Food", required: true },
    name: { type: String, required: true, trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be an integer",
      },
    },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: IOrderItem[]): boolean => items.length > 0,
        message: "Order must contain at least one item",
      },
    },
    totalAmount: { type: Number, required: true, min: 0 },
    deliveryAddress: { type: String, required: true, trim: true, maxlength: 250 },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: "COD", required: true },
    status: { type: String, enum: ORDER_STATUSES, default: "PENDING", required: true },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

export const Order = model<IOrder>("Order", orderSchema);