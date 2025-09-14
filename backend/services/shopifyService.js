import { Customer, Product, Order } from "../models/index.js";

export class ShopifyService {
  constructor() {
    this.baseUrl = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-07`;
    this.accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  }

  async fetchShopify(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        "X-Shopify-Access-Token": this.accessToken,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async syncAll(tenantId) {
    try {
      const [customers, products, orders] = await Promise.all([
        this.syncCustomers(tenantId),
        this.syncProducts(tenantId),
        this.syncOrders(tenantId),
      ]);

      return { customers, products, orders };
    } catch (error) {
      console.error("Sync failed:", error);
      throw error;
    }
  }

  async syncCustomers(tenantId) {
    const data = await this.fetchShopify("/customers.json");

    for (const customer of data.customers) {
      await Customer.upsert({
        tenantId,
        shopifyCustomerId: customer.id.toString(),
        firstName: customer.first_name,
        lastName: customer.last_name,
        email: customer.email,
        totalSpent: parseFloat(customer.total_spent || 0),
        ordersCount: customer.orders_count || 0,
      });
    }

    return data.customers.length;
  }

  async syncProducts(tenantId) {
    const data = await this.fetchShopify("/products.json");

    for (const product of data.products) {
      const variant = product.variants[0];
      await Product.upsert({
        tenantId,
        shopifyProductId: product.id.toString(),
        title: product.title,
        description: product.body_html,
        price: parseFloat(variant.price),
        inventory: variant.inventory_quantity || 0,
      });
    }

    return data.products.length;
  }

  async syncOrders(tenantId) {
    const data = await this.fetchShopify("/orders.json");

    for (const order of data.orders) {
      const customer = await Customer.findOne({
        where: {
          tenantId,
          shopifyCustomerId: order.customer?.id?.toString(),
        },
      });

      if (customer) {
        await Order.upsert({
          tenantId,
          customerId: customer.id,
          shopifyOrderId: order.id.toString(),
          orderNumber: order.order_number?.toString(),
          totalAmount: parseFloat(order.total_price),
          status: "confirmed",
          orderDate: new Date(order.created_at),
        });
      }
    }

    return data.orders.length;
  }
}