import Medicine from "../models/Medicine.js";

// function to get all medicines with search and filter

export const getAllMedicines = async (req, res) => {
  try {
    const { q, category } = req.query;
    let query = {};

    // Search by name, description, or manufacturer
    if (q && q.trim() !== "") {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { manufacturer: { $regex: q, $options: "i" } },
      ];
    }

    // Filter by category
    if (category && category !== "All") {
      query.category = category;
    }

    const medicines = await Medicine.find(query)
      .select("name price dosage manufacturer description image category stock")
      .lean();

    const medicinesWithIds = medicines.map((med) => ({
      ...med,
      _id: med._id.toString(),
    }));

    res.json(medicinesWithIds);
  } catch (err) {
    console.error("Get medicines error:", err);
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

export const getMedicineById = async (req, res) => {
  try {
    const med = await Medicine.findById(req.params.id);
    if (!med) return res.status(404).json({ message: "Medicine not found" });
    res.json(med);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getMedicineCategories = async (req, res) => {
  try {
    const categories = await Medicine.distinct("category");
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Create new medicine (admin only)
export const createMedicine = async (req, res) => {
  try {

    const medicine = new Medicine(req.body);
    await medicine.save();
    res.status(201).json(medicine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update medicine (admin only)
export const updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    res.json(medicine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete medicine (admin only)
export const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    res.json({ message: "Medicine deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const seedMedicines = async (req, res) => {
  try {
    await Medicine.deleteMany({});

    const sampleMeds = [
      {
        name: "Paracetamol",
        price: 50,
        dosage: "500mg",
        expiryDate: new Date("2026-01-01"),
        manufacturer: "Medico",
        description: "Pain killer",
        image:
          "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=300&fit=crop&auto=format",
        category: "Pain Relief",
        stock: 100,
      },
      {
        name: "Ibuprofen",
        price: 80,
        dosage: "400mg",
        expiryDate: new Date("2025-06-01"),
        manufacturer: "PharmaCorp",
        description: "Anti-inflammatory",
        image:
          "https://images.unsplash.com/photo-1555644368-2a4b4bf90d7b?w=400&h=300&fit=crop&auto=format",
        category: "Anti-inflammatory",
        stock: 50,
      },
    ];

    const meds = await Medicine.insertMany(sampleMeds);

    res.json({
      message: "Sample medicines seeded successfully",
      count: meds.length,
      medicines: meds,
    });
  } catch (err) {
    console.error("Seed error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// 2. NEW Stock management functions (ADD THESE ONCE)
export const getLowStockMedicines = async (req, res) => {
  try {

    const lowStockMedicines = await Medicine.find({ stock: { $lt: 20 } });
    res.json(lowStockMedicines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStock = async (req, res) => {
  try {

    const { stock } = req.body;

    if (typeof stock !== "number" || stock < 0) {
      return res.status(400).json({ message: "Invalid stock value" });
    }

    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      { stock },
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    res.json({
      message: "Stock updated successfully",
      medicine,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const bulkUpdateStock = async (req, res) => {
  try {

    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      return res.status(400).json({ message: "Updates must be an array" });
    }

    const results = [];

    for (const update of updates) {
      const medicine = await Medicine.findByIdAndUpdate(
        update.medicineId,
        { stock: update.stock },
        { new: true }
      );

      if (medicine) {
        results.push({
          medicineId: update.medicineId,
          success: true,
          newStock: medicine.stock,
        });
      } else {
        results.push({
          medicineId: update.medicineId,
          success: false,
          error: "Medicine not found",
        });
      }
    }

    res.json({
      message: "Bulk stock update completed",
      results,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
