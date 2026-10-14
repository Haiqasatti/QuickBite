import type { Request, Response } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { Category } from "../models/Category.js";
import { Food, type FoodDocument } from "../models/Food.js";
import { Order } from "../models/Order.js";
import { Review } from "../models/Review.js";
import { isValidObjectId, sendServerError, sendValidationError } from "../utils/http.js";
import { isValidImageSource } from "../utils/imageSource.js";

const objectIdSchema = z.string().refine(isValidObjectId, "Invalid id format");

const createFoodSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  description: z.string().trim().max(1000).optional(),
  price: z
    .number({ message: "Price must be a number" })
    .positive("Price must be greater than zero")
    .max(1_000_000, "Price is too large"),
  image: z
    .string()
    .trim()
    .max(500)
    .refine(isValidImageSource, "Image must be an http(s) URL or a local /images/ path")
    .optional(),
  categoryId: objectIdSchema,
  isAvailable: z.boolean().optional(),
});

const updateFoodSchema = createFoodSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});

const listFoodQuerySchema = z.object({
  categoryId: objectIdSchema.optional(),
});

interface FoodResponse {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  categoryId: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toFoodResponse(food: FoodDocument): FoodResponse {
  return {
    id: food._id.toString(),
    name: food.name,
    description: food.description,
    price: food.price,
    image: food.image,
    categoryId: food.categoryId.toString(),
    isAvailable: food.isAvailable,
    createdAt: food.createdAt,
    updatedAt: food.updatedAt,
  };
}

function sendInvalidId(res: Response): void {
  res.status(400).json({ success: false, message: "Invalid food id" });
}

function sendFoodNotFound(res: Response): void {
  res.status(404).json({ success: false, message: "Food item not found" });
}

function sendCategoryNotFound(res: Response): void {
  res.status(404).json({ success: false, message: "Category not found" });
}

async function categoryExists(categoryId: string): Promise<boolean> {
  const found = await Category.exists({ _id: new Types.ObjectId(categoryId) });
  return found !== null;
}

export async function listFoods(req: Request, res: Response): Promise<void> {
  const query = listFoodQuerySchema.safeParse(req.query);
  if (!query.success) {
    sendValidationError(res, query.error);
    return;
  }

  try {
    const filter: { isAvailable: boolean; categoryId?: Types.ObjectId } = { isAvailable: true };
    if (query.data.categoryId !== undefined) {
      filter.categoryId = new Types.ObjectId(query.data.categoryId);
    }

    const foods = await Food.find(filter).sort({ name: 1 });

    res.status(200).json({
      success: true,
      message: "Foods fetched successfully",
      data: { foods: foods.map(toFoodResponse), count: foods.length },
    });
  } catch (error) {
    sendServerError(res, "listFoods error", error);
  }
}

export async function getFood(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  if (id === undefined || id === "") {
    res.status(400).json({ success: false, message: "ID is required" });
    return;
  }
  if (typeof id !== "string") {
    sendInvalidId(res);
    return;
  }

  if (!isValidObjectId(id)) {
    sendInvalidId(res);
    return;
  }

  try {
    const food = await Food.findById(id);
    if (!food) {
      sendFoodNotFound(res);
      return;
    }

    res.status(200).json({
      success: true,
      message: "Food fetched successfully",
      data: { food: toFoodResponse(food) },
    });
  } catch (error) {
    sendServerError(res, "getFood error", error);
  }
}

export async function createFood(req: Request, res: Response): Promise<void> {
  const parsed = createFoodSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  try {
    if (!(await categoryExists(parsed.data.categoryId))) {
      sendCategoryNotFound(res);
      return;
    }

    const food = new Food(parsed.data);
    await food.save();

    res.status(201).json({
      success: true,
      message: "Food created successfully",
      data: { food: toFoodResponse(food) },
    });
  } catch (error) {
    sendServerError(res, "createFood error", error);
  }
}

export async function updateFood(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  if (id === undefined || id === "") {
    res.status(400).json({ success: false, message: "ID is required" });
    return;
  }
  if (typeof id !== "string") {
    sendInvalidId(res);
    return;
  }

  if (!isValidObjectId(id)) {
    sendInvalidId(res);
    return;
  }

  const parsed = updateFoodSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  try {
    const food = await Food.findById(id);
    if (!food) {
      sendFoodNotFound(res);
      return;
    }

    if (parsed.data.categoryId !== undefined && !(await categoryExists(parsed.data.categoryId))) {
      sendCategoryNotFound(res);
      return;
    }

    food.set(parsed.data);
    await food.save();

    res.status(200).json({
      success: true,
      message: "Food updated successfully",
      data: { food: toFoodResponse(food) },
    });
  } catch (error) {
    sendServerError(res, "updateFood error", error);
  }
}

export async function deleteFood(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  if (id === undefined || id === "") {
    res.status(400).json({ success: false, message: "ID is required" });
    return;
  }
  if (typeof id !== "string") {
    sendInvalidId(res);
    return;
  }

  if (!isValidObjectId(id)) {
    sendInvalidId(res);
    return;
  }

  try {
    const food = await Food.findById(id);
    if (!food) {
      sendFoodNotFound(res);
      return;
    }

    // Integrity guard: only reads the Order/Review collections, no order or review logic.
    const foodObjectId = new Types.ObjectId(id);
    const [orderRef, reviewRef] = await Promise.all([
      Order.exists({ "items.foodId": foodObjectId }),
      Review.exists({ foodId: foodObjectId }),
    ]);
    if (orderRef !== null || reviewRef !== null) {
      res.status(409).json({
        success: false,
        message:
          "This food item is referenced by existing orders or reviews and cannot be deleted. Mark it unavailable instead (PUT with isAvailable: false).",
      });
      return;
    }

    await food.deleteOne();

    res.status(200).json({
      success: true,
      message: "Food deleted successfully",
      data: { id },
    });
  } catch (error) {
    sendServerError(res, "deleteFood error", error);
  }
}

export async function listAllFoods(_req: Request, res: Response): Promise<void> {
  try {
    const foods = await Food.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      message: "Foods fetched successfully",
      data: { foods: foods.map(toFoodResponse), count: foods.length },
    });
  } catch (error) {
    sendServerError(res, "listAllFoods error", error);
  }
}