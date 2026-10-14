import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getCategory,
  listAllCategories,
  listCategories,
  updateCategory,
} from "../controllers/categoryController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.get("/", listCategories);
router.get("/admin/all", authenticate, authorizeRoles("ADMIN"), listAllCategories);
router.get("/:id", getCategory);

router.post("/", authenticate, authorizeRoles("ADMIN"), createCategory);
router.put("/:id", authenticate, authorizeRoles("ADMIN"), updateCategory);
router.delete("/:id", authenticate, authorizeRoles("ADMIN"), deleteCategory);

export default router;