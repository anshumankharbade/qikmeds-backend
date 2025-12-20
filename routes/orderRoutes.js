import express from "express";
import {
  placeOrder,
  getOrders,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";
import authMiddleware, { isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, placeOrder);
router.get("/", authMiddleware, getOrders);
router.patch("/:orderId/cancel", authMiddleware, cancelOrder);

router.get("/admin/all", authMiddleware, isAdmin, getAllOrders);
router.patch(
  "/admin/:orderId/status",
  authMiddleware,
  isAdmin,
  updateOrderStatus
);

export default router;
