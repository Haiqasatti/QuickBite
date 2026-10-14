import { Router, type Request, type Response } from "express";
import { getMe, login, register } from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);

// TEMPORARY: only for testing role authorization. Remove once real admin routes exist.
router.get("/admin-check", authenticate, authorizeRoles("ADMIN"), (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "Admin access granted" });
});

export default router;