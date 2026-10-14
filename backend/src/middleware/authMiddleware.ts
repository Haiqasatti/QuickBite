import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken, type AuthTokenPayload } from "../utils/jwt.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }

  let payload: AuthTokenPayload | null;
  try {
    payload = verifyAuthToken(token);
  } catch (error) {
    console.error("Token verification setup error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
    return;
  }

  if (!payload) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
    return;
  }

  req.auth = payload;
  next();
}