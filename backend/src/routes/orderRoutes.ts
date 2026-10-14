import { Router } from "express";
import {
  createOrder,
  listAllOrders,
  listMyOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = Router();

router.post("/", authenticate, createOrder);
router.get("/my", authenticate, listMyOrders);
router.get("/", authenticate, authorizeRoles("ADMIN"), listAllOrders);
router.patch("/:id/status", authenticate, authorizeRoles("ADMIN"), updateOrderStatus);

export default router;