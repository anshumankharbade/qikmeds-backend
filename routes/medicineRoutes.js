import express from "express";
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
import { authMiddleware, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllMedicines);
router.get("/seed", seedMedicines);
router.get("/:id", getMedicineById);
router.get("/categories", getMedicineCategories);

// Admin only routes
router.post("/", authMiddleware, isAdmin, createMedicine);
router.put("/:id", authMiddleware, isAdmin, updateMedicine);
router.delete("/:id", authMiddleware, isAdmin, deleteMedicine);

// Stock management routes
router.get("/admin/low-stock", authMiddleware, isAdmin, getLowStockMedicines);
router.patch("/:id/stock", authMiddleware, isAdmin, updateStock);
router.post("/bulk-stock", authMiddleware, isAdmin, bulkUpdateStock);

export default router;
