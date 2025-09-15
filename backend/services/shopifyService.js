import fetch from "node-fetch";
import { Customer, Product, Order } from "../models/index.js";

export class ShopifyService {
  constructor() {
    this.baseUrl = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-07`;
    this.accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  }

  async syncCustomers(tenantId) {
    try {
      const response = await fetch(`${this.baseUrl}/customers.json`, {
        headers: {
          "X-Shopify-Access-Token": this.accessToken,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status}`);
      }

      const data = await response.json();
      let syncedCount = 0;

      for (const customer of data.customers) {
        const [customerRecord, created] = await Customer.upsert({
          tenantId,
          shopifyCustomerId: customer.id.toString(),
          firstName: customer.first_name || "",
          lastName: customer.last_name || "",
          email: customer.email || "",
          phone: customer.phone || "",
          totalSpent: parseFloat(customer.total_spent || 0),
          ordersCount: customer.orders_count || 0,
        });
        syncedCount++;
      }
      return syncedCount;
    } catch (error) {
      console.error("Error syncing customers:", error);
      throw error;
    }
  }

  async syncProducts(tenantId) {
    try {
      const response = await fetch(`${this.baseUrl}/products.json`, {
        headers: {
          "X-Shopify-Access-Token": this.accessToken,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status}`);
      }

      const data = await response.json();
      let syncedCount = 0;

      for (const product of data.products) {
        const variant = product.variants[0];

        const [productRecord, created] = await Product.upsert({
          tenantId,
          shopifyProductId: product.id.toString(),
          title: product.title,
          description: product.body_html || "",
          price: parseFloat(variant.price),
          inventory: variant.inventory_quantity || 0,
        });
        syncedCount++;
      }
      return syncedCount;
    } catch (error) {
      console.error("Error syncing products:", error);
      throw error;
    }
  }

  async syncOrders(tenantId) {
    try {
      const response = await fetch(`${this.baseUrl}/orders.json`, {
        headers: {
          "X-Shopify-Access-Token": this.accessToken,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status}`);
      }

      const data = await response.json();
      let syncedCount = 0;

      for (const order of data.orders) {
        // Find matching customer
        const customer = await Customer.findOne({
          where: {
            tenantId,
            shopifyCustomerId: order.customer?.id?.toString(),
          },
        });

        if (customer) {
          const [orderRecord, created] = await Order.upsert({
            tenantId,
            customerId: customer.id,
            shopifyOrderId: order.id.toString(),
            orderNumber: order.order_number?.toString(),
            totalAmount: parseFloat(order.total_price),
            status: order.fulfillment_status || "pending",
            orderDate: new Date(order.created_at),
          });
          syncedCount++;
        } else {
          console.log(`No customer found for order #${order.order_number}`);
        }
      }
      return syncedCount;
    } catch (error) {
      console.error("Error syncing orders:", error);
      throw error;
    }
  }

  async syncAll(tenantId) {
    try {
      const results = {};

      // Sync in order: customers first, then products, then orders
      results.customers = await this.syncCustomers(tenantId);
      results.products = await this.syncProducts(tenantId);
      results.orders = await this.syncOrders(tenantId);
      return results;
    } catch (error) {
      console.error("Full sync failed:", error);
      throw error;
    }
  }
}
