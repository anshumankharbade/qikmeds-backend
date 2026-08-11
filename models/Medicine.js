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
    // Cached AI-generated explanation (array of bullet-point strings).
    // Generated once on first request and reused after that instead of
    // calling the LLM API again - see assistantController.js.
    aiExplanation: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Medicine", medicineSchema);
