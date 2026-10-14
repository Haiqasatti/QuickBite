import { Router } from "express";
import {
  createFood,
  deleteFood,
  getFood,
  listAllFoods,
  listFoods,
  updateFood,
} from "../controllers/foodController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.get("/", listFoods);
router.get("/admin/all", authenticate, authorizeRoles("ADMIN"), listAllFoods);
router.get("/:id", getFood);

router.post("/", authenticate, authorizeRoles("ADMIN"), createFood);
router.put("/:id", authenticate, authorizeRoles("ADMIN"), updateFood);
router.delete("/:id", authenticate, authorizeRoles("ADMIN"), deleteFood);

export default router;