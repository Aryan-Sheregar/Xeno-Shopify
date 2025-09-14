import express from "express";
import { ShopifyService } from "../services/shopifyService.js";
import { Tenant } from "../models/index.js";

const router = express.Router();

// Shopify webhook handler
router.post("/shopify", async (req, res) => {
  try {
    const topic = req.get("X-Shopify-Topic");
    const shop = req.get("X-Shopify-Shop-Domain");

    // Find tenant by shop domain
    const tenant = await Tenant.findOne({
      where: { shopifyDomain: shop },
    });

    if (!tenant) {
      console.log(`No tenant found for shop: ${shop}`);
      return res.status(404).json({ error: "Tenant not found" });
    }

    const shopifyService = new ShopifyService();

    // Process webhook based on topic
    switch (topic) {
      case "customers/create":
      case "customers/update":
        await shopifyService.syncCustomers(tenant.id);
        break;

      case "orders/create":
      case "orders/updated":
        await shopifyService.syncOrders(tenant.id);
        break;

      case "products/create":
      case "products/update":
        await shopifyService.syncProducts(tenant.id);
        break;

      default:
        console.log(`Unhandled webhook topic: ${topic}`);
    }

    res.status(200).json({
      success: true,
      message: `Webhook ${topic} processed successfully`,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
