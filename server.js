import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import medicineRoutes from "./routes/medicineRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

dotenv.config();
const app = express();

// Allow all origins to fix CORS
app.use(cors({
  origin: "/",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));

// Handle preflight OPTIONS requests
app.options('*', cors());

app.use(express.json());

if (process.env.NODE_ENV === "production") {
  app.use(helmet());
  app.use(compression());
  app.set("trust proxy", 1);
}

// Health check endpoint 
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
  });
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "API is running",
    routes: ["/api/auth", "/api/medicines", "/api/orders", "/api/cart"]
  });
});

// Apply rate limiting
if (process.env.NODE_ENV === "production") {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later.",
  });
  app.use("/api/", limiter);
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);

// Database connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
