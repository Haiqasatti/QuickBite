import jwt from "jsonwebtoken";
import { USER_ROLES, type UserRole } from "../models/User.js";

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return secret;
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

export function signAuthToken({ userId, role }: AuthTokenPayload): string {
  return jwt.sign({ role }, getJwtSecret(), {
    subject: userId,
    expiresIn: TOKEN_TTL_SECONDS,
    algorithm: "HS256",
  });
}

/** Returns the payload for a valid token, or null for an invalid/expired one. */
export function verifyAuthToken(token: string): AuthTokenPayload | null {
  const secret = getJwtSecret(); // a missing secret is a server error, not a 401

  try {
    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });
    if (typeof decoded === "string") return null;

    const { sub, role } = decoded as Record<string, unknown>;
    if (typeof sub !== "string" || !isUserRole(role)) return null;

    return { userId: sub, role };
  } catch {
    return null;
  }
}