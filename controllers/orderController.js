import Order from "../models/Order.js";
import Medicine from "../models/Medicine.js";

export const placeOrder = async (req, res) => {
  try {
    const { cart, shippingInfo } = req.body;
    const userId = req.user.id;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({
        message: "Cart cannot be empty",
      });
    }

    // Validate each item has required fields
    for (const item of cart) {
      if (!item._id || !item.name || !item.price || !item.qty) {
        return res.status(400).json({
          message: "Invalid cart item structure",
          item: item,
        });
      }
    }

    // Validate stock availability
    const stockValidation = [];
    for (const item of cart) {
      const medicine = await Medicine.findById(item._id);

      if (!medicine) {
        return res.status(400).json({
          message: `Medicine "${item.name}" not found`,
        });
      }

      if (medicine.stock < item.qty) {
        stockValidation.push({
          name: item.name,
          requested: item.qty,
          available: medicine.stock,
          insufficient: true,
        });
      }
    }

    // If any items have insufficient stock
    if (stockValidation.length > 0) {
      return res.status(400).json({
        message: "Insufficient stock for some items",
        stockIssues: stockValidation,
      });
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    const order = new Order({
      user: userId,
      items: cart,
      total,
      shippingAddress: shippingInfo,
      status: "Pending",
    });

    // Update medicine stock after order
    for (const item of cart) {
      await Medicine.findByIdAndUpdate(item._id, {
        $inc: { stock: -item.qty },
      });
    }

    await order.save();

    res.status(201).json({
      message: "Order placed successfully",
      order,
      stockReduced: true,
    });
  } catch (error) {
    console.error("Order error:", error);
    res.status(500).json({
      message: "Failed to place order",
      error: error.message,
    });
  }
};

export const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ user: userId }).sort({ date: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders", error });
  }
};

// Get all orders (Admin only)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ date: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// Update order status (Admin only)
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
        validStatuses,
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // If changing from cancelled to another status, restore stock
    if (order.status === "Cancelled" && status !== "Cancelled") {
    }

    // If changing to cancelled, restore stock
    if (status === "Cancelled" && order.status !== "Cancelled") {
      for (const item of order.items) {
        await Medicine.findByIdAndUpdate(item._id, {
          $inc: { stock: item.qty },
        });
      }
    }

    // Update order status
    order.status = status;
    await order.save();

    res.json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({
      message: "Failed to update order status",
      error: error.message,
    });
  }
};
// Cancel order (User only)
export const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      user: userId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "Cancelled") {
      return res.status(400).json({ message: "Order already cancelled" });
    }

    // restore stock, Return items to inventory
    for (const item of order.items) {
      await Medicine.findByIdAndUpdate(item._id, { $inc: { stock: item.qty } });
    }

    order.status = "Cancelled";
    await order.save();

    res.json({
      message: "Order cancelled successfully",
      order,
      stockRestored: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to cancel order",
      error: error.message,
    });
  }
};
