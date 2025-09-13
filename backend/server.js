import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { sequelize } from "./config/database.js";
import {
  setupAssociations,
  Tenant,
  Customer,
  Order,
  Product,
} from "./models/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// Setup database associations
setupAssociations();

// Routes
app.get("/api/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: "Server is running",
      database: "Connected",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    res.status(500).json({
      status: "Server is running",
      database: "Disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get all tenants
app.get("/api/tenants", async (req, res) => {
  try {
    const tenants = await Tenant.findAll({
      where: { isActive: true },
      attributes: ["id", "name", "shopifyDomain", "isActive", "createdAt"],
    });
    res.json(tenants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard data for a specific tenant
app.get("/api/dashboard/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Get total customers
    const totalCustomers = await Customer.count({
      where: { tenantId },
    });

    // Get total orders and revenue
    const orderStats = await Order.findAll({
      where: { tenantId },
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("id")), "totalOrders"],
        [sequelize.fn("SUM", sequelize.col("totalAmount")), "totalRevenue"],
      ],
      raw: true,
    });

    // Get top 5 customers by spend
    const topCustomers = await Customer.findAll({
      where: { tenantId },
      order: [["totalSpent", "DESC"]],
      limit: 5,
      attributes: ["firstName", "lastName", "email", "totalSpent"],
    });

    // Get recent orders
    const recentOrders = await Order.findAll({
      where: { tenantId },
      include: [
        {
          model: Customer,
          as: "customer",
          attributes: ["firstName", "lastName"],
        },
      ],
      order: [["orderDate", "DESC"]],
      limit: 10,
      attributes: ["id", "orderNumber", "totalAmount", "orderDate", "status"],
    });

    res.json({
      tenantId,
      totalCustomers,
      totalOrders: parseInt(orderStats[0].totalOrders) || 0,
      totalRevenue: parseFloat(orderStats[0].totalRevenue) || 0,
      topCustomers,
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new tenant
app.post("/api/tenants", async (req, res) => {
  try {
    const { name, shopifyDomain } = req.body;
    const tenant = await Tenant.create({
      name,
      shopifyDomain,
    });
    res.status(201).json(tenant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");

    // Sync database (be careful in production)
    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync({ alter: true });
      console.log("📊 Database synchronized");
    }

    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on http://localhost:${PORT}`);
      console.log(`📊 API Health Check: http://localhost:${PORT}/api/health`);
      console.log(`📈 Dashboard API: http://localhost:${PORT}/api/dashboard/1`);
    });
  } catch (error) {
    console.error("❌ Unable to start server:", error);
  }
};

startServer();
