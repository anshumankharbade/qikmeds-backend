import mongoose from "mongoose";
import Cart from "../models/Cart.js";

// function to get cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    const transformedItems = cart.items.map((item) => {
      // Create an object that works for both frontend and backend
      return {
        _id: item.productId,
        productId: item.productId,
        name: item.name,
        price: item.price,
        qty: item.qty,
        image: item.image || "",
        dosage: item.dosage || "",
        manufacturer: item.manufacturer || "",
      };
    });

    res.json({
      success: true,
      items: transformedItems,
      cartId: cart._id,
      updatedAt: cart.updatedAt,
      itemCount: transformedItems.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch cart" });
  }
};

// function to update cart
export const updateCart = async (req, res) => {
  try {
    const { items = [] } = req.body;

    // Convert to ObjectId
    const userId = req.user.id;

    // Prepare items with defaults
    const cartItems = items.map((item) => ({
      productId: item._id || item.productId || "",
      name: item.name || "",
      price: item.price || 0,
      qty: item.qty || 1,
      image: item.image || "",
      dosage: item.dosage || "",
      manufacturer: item.manufacturer || "",
    }));

    // Update cart
    const cart = await Cart.findOneAndUpdate(
      { user: userId },
      {
        items: cartItems,
        updatedAt: new Date(),
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.json({
      success: true,
      message: "Cart updated successfully",
      cartId: cart._id,
      items: cart.items,
      itemCount: cart.items.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update cart",
      error: error.message,
    });
  }
};

// function to clear cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOneAndUpdate(
      { user: userId },
      {
        items: [],
        updatedAt: new Date(),
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Cart cleared successfully",
      cartId: cart._id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to clear cart",
      error: error.message,
    });
  }
};
