import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User, type UserDocument } from "../models/User.js";
import { signAuthToken } from "../utils/jwt.js";

const BCRYPT_ROUNDS = 12;

// Unknown keys (e.g. "role") are stripped by Zod, so public registration can never set ADMIN.
const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().toLowerCase().email("Invalid email address").max(254),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
  address: z.string().trim().max(250).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    address: user.address,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function isDuplicateKeyError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === 11000;
}

function sendServerError(res: Response, context: string, error: unknown): void {
  console.error(`${context}:`, error);
  res.status(500).json({ success: false, message: "Internal server error" });
}

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.issues.map((issue) => ({
        field: issue.path.map(String).join("."),
        message: issue.message,
      })),
    });
    return;
  }

  const { name, email, password, address } = parsed.data;

  try {
    const existing = await User.findOne({ email }).lean();
    if (existing) {
      res.status(409).json({ success: false, message: "Email is already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = new User({ name, email, passwordHash, role: "CUSTOMER", address });
    await user.save();

    const token = signAuthToken({ userId: user._id.toString(), role: user.role });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: { user: toPublicUser(user), token },
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      res.status(409).json({ success: false, message: "Email is already registered" });
      return;
    }
    sendServerError(res, "Register error", error);
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: parsed.error.issues.map((issue) => ({
        field: issue.path.map(String).join("."),
        message: issue.message,
      })),
    });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const user = await User.findOne({ email }).select("+passwordHash");
    const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;

    if (!user || !passwordMatches) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    const token = signAuthToken({ userId: user._id.toString(), role: user.role });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user: toPublicUser(user), token },
    });
  } catch (error) {
    sendServerError(res, "Login error", error);
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  try {
    const user = await User.findById(req.auth.userId);
    if (!user) {
      res.status(401).json({ success: false, message: "User no longer exists" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: { user: toPublicUser(user) },
    });
  } catch (error) {
    sendServerError(res, "GetMe error", error);
  }
}