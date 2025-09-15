import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { sequelize } from "./config/database.js";
import { setupAssociations } from "./models/index.js";
import shopifyRoutes from "./routes/shopifyRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import { Tenant, Product } from "./models/index.js";

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

//Health Check Route
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

//API Routes
app.use("/api/shopify", shopifyRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/webhooks", webhookRoutes);

// Additional tenant routes
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

// // Debug endpoint: get products for a tenant
// app.get("/api/debug/products/:tenantId", async (req, res) => {
//   try {
//     const { tenantId } = req.params;
//     const products = await Product.findAll({
//       where: { tenantId },
//       raw: true,
//     });
//     res.json({
//       count: products.length,
//       products,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });
app.get("/api/customers/:tenantId", async (req, res) => {
  try {
    const { Customer } = await import("./models/index.js");
    const customers = await Customer.findAll({
      where: { tenantId: req.params.tenantId },
    });
    res.json(customers);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch customers", message: error.message });
  }
});

app.get("/api/products/:tenantId", async (req, res) => {
  try {
    const { Product } = await import("./models/index.js");
    const products = await Product.findAll({
      where: { tenantId: req.params.tenantId },
    });
    res.json(products);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch products", message: error.message });
  }
});

app.delete("/api/tenants/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const count = await Tenant.destroy({ where: { id: tenantId } });
    res.json({ deleted: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

//Global Error Handler
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
    console.log("Database connected successfully");

    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync();
      console.log("Database synchronized");
    }

    // Get the first tenant for logging purposes
    const firstTenant = await Tenant.findOne({
      order: [["createdAt", "ASC"]],
    });

    // Start the server
    app.listen(PORT, () => {});
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1);
  }
};

startServer();
