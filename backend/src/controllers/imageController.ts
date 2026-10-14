import type { Request, Response } from "express";
import { z } from "zod";
import { ImageInputError, importImageFromUrl, saveUploadedImage } from "../services/imageStorage.js";

const importImageSchema = z.object({
  url: z.string().trim().min(1, "Paste a direct image URL."),
});

function sendImageError(res: Response, error: unknown): void {
  if (error instanceof ImageInputError) {
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }
  console.error("Image operation failed:", error);
  res.status(500).json({ success: false, message: "The image could not be stored. Please try again." });
}

export async function uploadImage(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ success: false, message: "Choose a JPG, PNG, or WebP image to upload." });
    return;
  }

  try {
    const path = await saveUploadedImage(req.file.buffer, req.file.mimetype);
    res.status(201).json({ success: true, message: "Image uploaded successfully", data: { image: { path } } });
  } catch (error) {
    sendImageError(res, error);
  }
}

export async function importImage(req: Request, res: Response): Promise<void> {
  const parsed = importImageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? "Enter a direct image URL." });
    return;
  }

  try {
    const path = await importImageFromUrl(parsed.data.url);
    res.status(201).json({ success: true, message: "Image imported successfully", data: { image: { path } } });
  } catch (error) {
    sendImageError(res, error);
  }
}