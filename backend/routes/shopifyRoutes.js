import express from "express";
import { ShopifyService } from "../services/shopifyService.js";
import { Tenant } from "../models/index.js";

const router = express.Router();

// Main sync endpoint
router.get("/sync/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;

    const shopifyService = new ShopifyService();
    const results = await shopifyService.syncAll(tenantId);

    res.json({
      success: true,
      message: "Real Shopify data synced successfully",
      synced: results,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      success: false,
    });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "Shopify integration ready",
    timestamp: new Date().toISOString(),
  });
});

export default router;
