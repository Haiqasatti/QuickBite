import type { Request, Response } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { Category, type CategoryDocument } from "../models/Category.js";
import { Food } from "../models/Food.js";
import {
  isDuplicateKeyError,
  isValidObjectId,
  sendServerError,
  sendValidationError,
} from "../utils/http.js";
import { isValidImageSource } from "../utils/imageSource.js";

const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  description: z.string().trim().max(500).optional(),
  image: z
    .string()
    .trim()
    .max(500)
    .refine(isValidImageSource, "Image must be an http(s) URL or a local /images/ path")
    .optional(),
  isActive: z.boolean().optional(),
});

const updateCategorySchema = createCategorySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

interface CategoryResponse {
  id: string;
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toCategoryResponse(category: CategoryDocument): CategoryResponse {
  return {
    id: category._id.toString(),
    name: category.name,
    description: category.description,
    image: category.image,
    isActive: category.isActive,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

function sendInvalidId(res: Response): void {
  res.status(400).json({ success: false, message: "Invalid category id" });
}

function sendNotFound(res: Response): void {
  res.status(404).json({ success: false, message: "Category not found" });
}

function sendDuplicateName(res: Response): void {
  res.status(409).json({ success: false, message: "A category with this name already exists" });
}

/** Case-insensitive name lookup, optionally excluding one category id. */
async function findByName(name: string, excludeId?: string): Promise<boolean> {
  const filter =
    excludeId === undefined
      ? { name }
      : { name, _id: { $ne: new Types.ObjectId(excludeId) } };

  const match = await Category.findOne(filter)
    .collation({ locale: "en", strength: 2 })
    .select("_id")
    .lean();

  return match !== null;
}

export async function listCategories(_req: Request, res: Response): Promise<void> {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: { categories: categories.map(toCategoryResponse), count: categories.length },
    });
  } catch (error) {
    sendServerError(res, "listCategories error", error);
  }
}

export async function getCategory(req: Request, res: Response): Promise<void> {
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
    const category = await Category.findById(id);
    if (!category) {
      sendNotFound(res);
      return;
    }

    res.status(200).json({
      success: true,
      message: "Category fetched successfully",
      data: { category: toCategoryResponse(category) },
    });
  } catch (error) {
    sendServerError(res, "getCategory error", error);
  }
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  try {
    if (await findByName(parsed.data.name)) {
      sendDuplicateName(res);
      return;
    }

    const category = new Category(parsed.data);
    await category.save();

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: { category: toCategoryResponse(category) },
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      sendDuplicateName(res);
      return;
    }
    sendServerError(res, "createCategory error", error);
  }
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
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

  const parsed = updateCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  try {
    const category = await Category.findById(id);
    if (!category) {
      sendNotFound(res);
      return;
    }

    if (parsed.data.name !== undefined && (await findByName(parsed.data.name, id))) {
      sendDuplicateName(res);
      return;
    }

    category.set(parsed.data);
    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: { category: toCategoryResponse(category) },
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      sendDuplicateName(res);
      return;
    }
    sendServerError(res, "updateCategory error", error);
  }
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
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
    const category = await Category.findById(id);
    if (!category) {
      sendNotFound(res);
      return;
    }

    const foodCount = await Food.countDocuments({ categoryId: new Types.ObjectId(id) });
    if (foodCount > 0) {
      res.status(409).json({
        success: false,
        message: `Cannot delete category: ${foodCount} food item(s) still belong to it. Reassign or delete them first.`,
      });
      return;
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: { id },
    });
  } catch (error) {
    sendServerError(res, "deleteCategory error", error);
  }
}

export async function listAllCategories(_req: Request, res: Response): Promise<void> {
  try {
    const categories = await Category.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: { categories: categories.map(toCategoryResponse), count: categories.length },
    });
  } catch (error) {
    sendServerError(res, "listAllCategories error", error);
  }
}