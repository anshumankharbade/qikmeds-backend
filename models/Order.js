import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      _id: String,
      name: String,
      price: Number,
      qty: Number,
      image: String,
      dosage: String,
      manufacturer: String,
    },
  ],
  total: Number,
  shippingAddress: {
    fullName: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
  },
  status: {
    type: String,
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
    default: "Pending",
  },
  date: { type: Date, default: Date.now },
});

export default mongoose.model("Order", orderSchema);
