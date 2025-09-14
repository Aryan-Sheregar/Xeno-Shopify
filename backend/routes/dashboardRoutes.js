import express from "express";
import { Customer, Order, Product } from "../models/index.js";

const router = express.Router();

router.get("/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;

    const [totalCustomers, totalOrders, totalProducts, totalRevenue] =
      await Promise.all([
        Customer.count({ where: { tenantId } }),
        Order.count({ where: { tenantId } }),
        Product.count({ where: { tenantId } }),
        Order.sum("totalAmount", { where: { tenantId } }),
      ]);

    // Top 5 customers by spend
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

    // Recent orders
    const recentOrders = await Order.findAll({
      where: { tenantId },
      include: [{ model: Customer,as:'customer', attributes: ["firstName", "lastName"] }],
      order: [["orderDate", "DESC"]],
      limit: 10,
    });

    res.json({
      tenantId,
      totalCustomers,
      totalOrders,
      totalProducts,
      totalRevenue: totalRevenue || 0,
      topCustomers,
      recentOrders,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
