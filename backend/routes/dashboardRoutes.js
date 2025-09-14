import express from "express";
import { Customer, Order, Product } from "../models/index.js";
import { sequelize } from "../config/database.js";
import { Op } from "sequelize";

const router = express.Router();

// Get comprehensive dashboard data
router.get("/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    // Get total customers
    const totalCustomers = await Customer.count({ where: { tenantId } });

    // Get total products
    const totalProducts = await Product.count({ where: { tenantId } });

    // Get order statistics
    const orderStats = await Order.findAll({
      where: { tenantId },
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("id")), "totalOrders"],
        [sequelize.fn("SUM", sequelize.col("totalAmount")), "totalRevenue"],
        [sequelize.fn("AVG", sequelize.col("totalAmount")), "avgOrderValue"],
      ],
      raw: true,
    });

    // Get top 5 customers by spend
    const topCustomers = await Customer.findAll({
      where: { tenantId },
      order: [["totalSpent", "DESC"]],
      limit: 5,
      attributes: [
        "firstName",
        "lastName",
        "email",
        "totalSpent",
        "ordersCount",
      ],
    });

    // Get recent orders (only if Customer association is set up)
    let recentOrders = [];
    try {
      recentOrders = await Order.findAll({
        where: { tenantId },
        order: [["orderDate", "DESC"]],
        limit: 10,
        attributes: ["id", "orderNumber", "totalAmount", "orderDate", "status"],
      });
    } catch (err) {
      console.warn("Could not fetch recent orders:", err.message);
    }

    // Get product inventory info
    const productStats = await Product.findAll({
      where: { tenantId },
      attributes: [
        [sequelize.fn("SUM", sequelize.col("inventory")), "totalInventory"],
        [sequelize.fn("AVG", sequelize.col("price")), "avgPrice"],
      ],
      raw: true,
    });

    // Get revenue by date (last 30 days) - with safe date filtering
    let revenueByDate = [];
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      revenueByDate = await Order.findAll({
        where: {
          tenantId,
          orderDate: { [Op.gte]: thirtyDaysAgo },
        },
        attributes: [
          [sequelize.fn("DATE", sequelize.col("orderDate")), "date"],
          [sequelize.fn("SUM", sequelize.col("totalAmount")), "revenue"],
          [sequelize.fn("COUNT", sequelize.col("id")), "orders"],
        ],
        group: [sequelize.fn("DATE", sequelize.col("orderDate"))],
        order: [[sequelize.fn("DATE", sequelize.col("orderDate")), "ASC"]],
        raw: true,
      });
    } catch (err) {
      console.warn("Could not fetch revenue by date:", err.message);
    }

    const dashboardData = {
      tenantId,
      summary: {
        totalCustomers,
        totalProducts,
        totalOrders: parseInt(orderStats[0]?.totalOrders) || 0,
        totalRevenue: parseFloat(orderStats[0]?.totalRevenue) || 0,
        avgOrderValue: parseFloat(orderStats[0]?.avgOrderValue) || 0,
        totalInventory: parseInt(productStats[0]?.totalInventory) || 0,
        avgProductPrice: parseFloat(productStats[0]?.avgPrice) || 0,
      },
      topCustomers,
      recentOrders,
      revenueByDate,
      generatedAt: new Date().toISOString(),
    };
    res.json(dashboardData);
  } catch (error) {
    console.error("Dashboard API error:", error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Get customer analytics
router.get("/:tenantId/customers", async (req, res) => {
  try {
    const { tenantId } = req.params;

    const customers = await Customer.findAll({
      where: { tenantId },
      order: [["totalSpent", "DESC"]],
      attributes: [
        "id",
        "firstName",
        "lastName",
        "email",
        "totalSpent",
        "ordersCount",
      ],
    });

    res.json({ customers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get product analytics
router.get("/:tenantId/products", async (req, res) => {
  try {
    const { tenantId } = req.params;

    const products = await Product.findAll({
      where: { tenantId },
      order: [["price", "DESC"]],
      attributes: ["id", "title", "price", "inventory"],
    });

    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
