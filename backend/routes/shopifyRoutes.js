import express from "express";
import { ShopifyService } from "../services/shopifyService.js";

const router = express.Router();

// Sync all Shopify data for a tenant
router.post("/sync/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;

    const shopifyService = new ShopifyService();
    const syncedData = await shopifyService.syncAll(tenantId);

    res.json({
      success: true,
      message: "Shopify data synced successfully",
      synced: syncedData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Shopify sync error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Sync specific data type
router.post("/sync/:tenantId/:dataType", async (req, res) => {
  try {
    const { tenantId, dataType } = req.params;
    const shopifyService = new ShopifyService();

    let result;
    switch (dataType) {
      case "customers":
        result = await shopifyService.syncCustomers(tenantId);
        break;
      case "products":
        result = await shopifyService.syncProducts(tenantId);
        break;
      case "orders":
        result = await shopifyService.syncOrders(tenantId);
        break;
      default:
        return res.status(400).json({
          error: "Invalid data type. Use: customers, products, or orders",
        });
    }

    res.json({
      success: true,
      message: `${dataType} synced successfully`,
      count: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Shopify ${req.params.dataType} sync error:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Health check for Shopify integration
router.get("/health", async (req, res) => {
  try {
    const shopifyService = new ShopifyService();
    const testResponse = await fetch(`${shopifyService.baseUrl}/shop.json`);

    if (testResponse.ok) {
      const shopData = await testResponse.json();
      res.json({
        status: "Shopify integration healthy",
        shop: shopData.shop.name,
        domain: shopData.shop.myshopify_domain,
        timestamp: new Date().toISOString(),
      });
    } else {
      throw new Error(`Shopify API returned ${testResponse.status}`);
    }
  } catch (error) {
    res.status(500).json({
      status: "Shopify integration unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
