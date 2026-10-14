import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { UserRole } from "../models/User.js";

/** Use after `authenticate`. Example: router.get("/x", authenticate, authorizeRoles("ADMIN"), handler) */
export function authorizeRoles(...allowedRoles: UserRole[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(req.auth.role)) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
      return;
    }

    next();
  };
}