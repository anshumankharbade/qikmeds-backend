import express from "express";
import rateLimit from "express-rate-limit";
import {
  getAllMedicines,
  getMedicineById,
  seedMedicines,
  getMedicineCategories,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getLowStockMedicines,
  updateStock,
  bulkUpdateStock,
} from "../controllers/medicineController.js";
import { explainMedicine } from "../controllers/assistantController.js";
import { authMiddleware, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Each miss on the AI-explain route is a real, billed LLM API call (a cache
// hit costs nothing), so it gets its own stricter limiter on top of the
// global one in server.js - and unlike that one, this stays on in every
// environment, since local testing can rack up API cost too.
const explainLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many AI explanation requests, please try again later.",
});

// Public routes
router.get("/", getAllMedicines);
router.get("/seed", seedMedicines);
router.get("/:id", getMedicineById);
router.get("/categories", getMedicineCategories);
router.get("/:id/explain", explainLimiter, explainMedicine);

// Admin only routes
router.post("/", authMiddleware, isAdmin, createMedicine);
router.put("/:id", authMiddleware, isAdmin, updateMedicine);
router.delete("/:id", authMiddleware, isAdmin, deleteMedicine);

// Stock management routes
router.get("/admin/low-stock", authMiddleware, isAdmin, getLowStockMedicines);
router.patch("/:id/stock", authMiddleware, isAdmin, updateStock);
router.post("/bulk-stock", authMiddleware, isAdmin, bulkUpdateStock);

export default router;
