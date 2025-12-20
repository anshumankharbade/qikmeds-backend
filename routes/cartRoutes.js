// routes/cartRoutes.js
import express from "express";
import {
  getCart,
  updateCart,
  clearCart,
} from "../controllers/cartController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Cart routes
router.get("/", authMiddleware, getCart);
router.post("/", authMiddleware, updateCart);
router.delete("/", authMiddleware, clearCart);
router.get("/test", authMiddleware, (req, res) => {
  res.json({
    message: "Cart API is working",
    userId: req.user.id,
    userName: req.user.name,
  });
});

export default router;
