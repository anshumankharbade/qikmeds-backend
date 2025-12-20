import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    dosage: String,
    expiryDate: Date,
    manufacturer: String,
    description: String,
    image: { type: String, default: "" },
    category: {
      type: String,
      default: "General",
      enum: [
        "Pain Relief",
        "Antibiotic",
        "Vitamin",
        "Anti-inflammatory",
        "Anti-allergy",
        "Heart Care",
        "General",
      ],
    },
    stock: {
      type: Number,
      default: 100,
      min: 0,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Medicine", medicineSchema);
