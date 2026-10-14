import type { Response } from "express";
import type { ZodError } from "zod";

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

/** Strict 24-hex check (mongoose's own isValid also accepts any 12-character string). */
export function isValidObjectId(value: string): boolean {
  return OBJECT_ID_REGEX.test(value);
}

export function isDuplicateKeyError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === 11000;
}

export function sendValidationError(res: Response, error: ZodError): void {
  res.status(400).json({
    success: false,
    message: "Validation failed",
    errors: error.issues.map((issue) => ({
      field: issue.path.map(String).join("."),
      message: issue.message,
    })),
  });
}

export function sendServerError(res: Response, context: string, error: unknown): void {
  console.error(`${context}:`, error);
  res.status(500).json({ success: false, message: "Internal server error" });
}