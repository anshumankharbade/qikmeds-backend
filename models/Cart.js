import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1, default: 1 },
    image: { type: String, default: "" },
    dosage: { type: String, default: "" },
    manufacturer: { type: String, default: "" },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

cartSchema.index({ updatedAt: 1 });

// Virtual field to calculate total price
cartSchema.virtual("totalPrice").get(function () {
  return this.items.reduce((total, item) => total + item.price * item.qty, 0);
});

cartSchema.set("toJSON", { virtuals: true });
cartSchema.set("toObject", { virtuals: true });

export default mongoose.model("Cart", cartSchema);
