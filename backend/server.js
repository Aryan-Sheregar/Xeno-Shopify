import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { sequelize } from "./config/database.js";
import { setupAssociations } from "./models/index.js";
import shopifyRoutes from "./routes/shopifyRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Basic Middleware (BEFORE routes)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Tenant-ID"],
  })
);

// Setup database associations
setupAssociations();

// 2. Health Check Route (Simple endpoint first)
app.get("/api/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: "Server is running",
      database: "Connected",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      port: PORT,
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({
      status: "Server is running",
      database: "Disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// 3. API Routes (AFTER middleware, BEFORE error handlers)
app.use("/api/shopify", shopifyRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 4. Additional routes that were in server.js - move these to separate route files later
import { Tenant } from "./models/index.js";

// Get all tenants
app.get("/api/tenants", async (req, res) => {
  try {
    const tenants = await Tenant.findAll({
      where: { isActive: true },
      attributes: ["id", "name", "shopifyDomain", "isActive", "createdAt"],
      order: [["createdAt", "DESC"]],
    });
    res.json(tenants);
  } catch (error) {
    console.error("Error fetching tenants:", error);
    res.status(500).json({
      error: "Failed to fetch tenants",
      message: error.message,
    });
  }
});

// Create a new tenant
app.post("/api/tenants", async (req, res) => {
  try {
    const { name, shopifyDomain } = req.body;

    if (!name || !shopifyDomain) {
      return res.status(400).json({
        error: "Name and shopifyDomain are required",
      });
    }

    const tenant = await Tenant.create({
      name,
      shopifyDomain,
      isActive: true,
    });

    res.status(201).json(tenant);
  } catch (error) {
    console.error("Error creating tenant:", error);
    res.status(400).json({
      error: "Failed to create tenant",
      message: error.message,
    });
  }
});

// 5. Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// 6. Global Error Handler (MUST be last)
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
    timestamp: new Date().toISOString(),
  });
});

// Server Startup Function
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");

    // Sync database models (be careful in production)
    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync({ alter: true });
      console.log("📊 Database synchronized");

      // Seed a default tenant if none exists
      const tenantCount = await Tenant.count();
    }

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on http://localhost:${PORT}`);
      console.log(`📊 API Health Check: http://localhost:${PORT}/api/health`);
      console.log(`👥 Tenants API: http://localhost:${PORT}/api/tenants`);
      console.log(`📈 Dashboard API: http://localhost:${PORT}/api/dashboard/1`);
      console.log(
        `🔄 Shopify Sync: POST http://localhost:${PORT}/api/shopify/sync/1`
      );
    });
  } catch (error) {
    console.error("❌ Unable to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown handling
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await sequelize.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  await sequelize.close();
  process.exit(0);
});

// Start the server
startServer();
