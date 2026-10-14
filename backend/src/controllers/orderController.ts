import type { Request, Response } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { Food, type FoodDocument } from "../models/Food.js";
import {
  Order,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  type IOrderItem,
  type OrderDocument,
} from "../models/Order.js";
import { User } from "../models/User.js";
import { isValidObjectId, sendServerError, sendValidationError } from "../utils/http.js";

const MAX_LINE_QUANTITY = 20;
const MAX_DISTINCT_ITEMS = 50;
const TERMINAL_STATUSES: readonly string[] = ["DELIVERED", "CANCELLED"];

const objectIdSchema = z.string().refine(isValidObjectId, "Invalid id format");

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        foodId: objectIdSchema,
        quantity: z
          .number()
          .int("Quantity must be a whole number")
          .min(1, "Quantity must be at least 1")
          .max(MAX_LINE_QUANTITY, `Quantity cannot exceed ${MAX_LINE_QUANTITY} per item`),
      })
    )
    .min(1, "Your cart is empty")
    .max(MAX_DISTINCT_ITEMS, "Too many items in one order"),
  deliveryAddress: z
    .string()
    .trim()
    .min(5, "Delivery address must be at least 5 characters")
    .max(250),
  paymentMethod: z.enum(PAYMENT_METHODS).default("COD"),
});

const updateStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

interface CustomerSummary {
  name: string;
  email: string;
}

interface OrderItemResponse {
  foodId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

interface OrderResponse {
  id: string;
  userId: string;
  items: OrderItemResponse[];
  totalAmount: number;
  deliveryAddress: string;
  paymentMethod: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  customer?: CustomerSummary;
}

function toOrderResponse(order: OrderDocument, customer?: CustomerSummary): OrderResponse {
  return {
    id: order._id.toString(),
    userId: order.userId.toString(),
    items: order.items.map((item) => ({
      foodId: item.foodId.toString(),
      name: item.name,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: (Math.round(item.unitPrice * 100) * item.quantity) / 100,
    })),
    totalAmount: order.totalAmount,
    deliveryAddress: order.deliveryAddress,
    paymentMethod: order.paymentMethod,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    ...(customer ? { customer } : {}),
  };
}

export async function createOrder(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const { items, deliveryAddress, paymentMethod } = parsed.data;

  // Merge duplicate food ids so the same dish cannot appear twice.
  const quantities = new Map<string, number>();
  for (const item of items) {
    quantities.set(item.foodId, (quantities.get(item.foodId) ?? 0) + item.quantity);
  }
  for (const quantity of quantities.values()) {
    if (quantity > MAX_LINE_QUANTITY) {
      res.status(400).json({
        success: false,
        message: `Quantity cannot exceed ${MAX_LINE_QUANTITY} per item`,
      });
      return;
    }
  }

  try {
    const objectIds = [...quantities.keys()].map((id) => new Types.ObjectId(id));
    const foods = await Food.find({ _id: { $in: objectIds } });
    const foodById = new Map<string, FoodDocument>(
      foods.map((food): [string, FoodDocument] => [food._id.toString(), food])
    );

    const orderItems: IOrderItem[] = [];
    let totalCents = 0;

    for (const [foodId, quantity] of quantities) {
      const food = foodById.get(foodId);
      if (!food) {
        res.status(404).json({
          success: false,
          message: "One or more items no longer exist. Please review your cart.",
        });
        return;
      }
      if (!food.isAvailable) {
        res.status(409).json({
          success: false,
          message: `${food.name} is currently unavailable. Remove it from your cart to continue.`,
        });
        return;
      }

      // Price always comes from the database, never from the client.
      orderItems.push({ foodId: food._id, name: food.name, unitPrice: food.price, quantity });
      totalCents += Math.round(food.price * 100) * quantity;
    }

    const order = new Order({
      userId: new Types.ObjectId(req.auth.userId),
      items: orderItems,
      totalAmount: totalCents / 100,
      deliveryAddress,
      paymentMethod,
      status: "PENDING",
    });
    await order.save();

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: { order: toOrderResponse(order) },
    });
  } catch (error) {
    sendServerError(res, "createOrder error", error);
  }
}

export async function listMyOrders(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  try {
    const orders = await Order.find({ userId: new Types.ObjectId(req.auth.userId) })
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: { orders: orders.map((order) => toOrderResponse(order)), count: orders.length },
    });
  } catch (error) {
    sendServerError(res, "listMyOrders error", error);
  }
}

export async function listAllOrders(_req: Request, res: Response): Promise<void> {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(200);

    const userIds = [...new Set(orders.map((order) => order.userId.toString()))].map(
      (id) => new Types.ObjectId(id)
    );
    const users = await User.find({ _id: { $in: userIds } }).select("name email");
    const customerById = new Map<string, CustomerSummary>(
      users.map((user): [string, CustomerSummary] => [
        user._id.toString(),
        { name: user.name, email: user.email },
      ])
    );

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: {
        orders: orders.map((order) =>
          toOrderResponse(order, customerById.get(order.userId.toString()))
        ),
        count: orders.length,
      },
    });
  } catch (error) {
    sendServerError(res, "listAllOrders error", error);
  }
}

export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  if (id === undefined || id === "") {
    res.status(400).json({ success: false, message: "ID is required" });
    return;
  }
  if (typeof id !== "string" || !isValidObjectId(id)) {
    res.status(400).json({ success: false, message: "Invalid order id" });
    return;
  }

  const parsed = updateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  try {
    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    if (TERMINAL_STATUSES.includes(order.status) && order.status !== parsed.data.status) {
      res.status(409).json({
        success: false,
        message: `This order is already ${order.status.toLowerCase()} and can no longer be changed`,
      });
      return;
    }

    order.status = parsed.data.status;
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status updated",
      data: { order: toOrderResponse(order) },
    });
  } catch (error) {
    sendServerError(res, "updateOrderStatus error", error);
  }
}