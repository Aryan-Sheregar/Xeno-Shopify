export class ShopifyService {
  constructor() {
    this.baseUrl = `https://${process.env.SHOPIFY_API_KEY}:${process.env.SHOPIFY_ACCESS_TOKEN}@${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-07`;
  }

  async syncProducts(tenantId) {
    try {
      console.log(`🔄 Syncing products for tenant ${tenantId}...`);

      const response = await fetch(`${this.baseUrl}/products.json`);
      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`📦 Found ${data.products.length} products from Shopify`);

      let syncedCount = 0;

      for (const shopifyProduct of data.products) {
        const variant = shopifyProduct.variants[0]; // Use first variant

        const [product, created] = await Product.upsert({
          tenantId,
          shopifyProductId: shopifyProduct.id.toString(),
          title: shopifyProduct.title,
          description: shopifyProduct.body_html || "",
          price: parseFloat(variant.price),
          inventory: variant.inventory_quantity || 0,
        });

        if (created) {
          console.log(`✅ Created product: ${shopifyProduct.title}`);
        } else {
          console.log(`🔄 Updated product: ${shopifyProduct.title}`);
        }
        syncedCount++;
      }

      console.log(`✅ Synced ${syncedCount} products successfully`);
      return syncedCount;
    } catch (error) {
      console.error("❌ Error syncing products:", error);
      throw error;
    }
  }

  async syncCustomers(tenantId) {
    try {
      const response = await fetch(`${this.baseUrl}/customers.json`);
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
      console.error("❌ Error syncing customers:", error);
      throw error;
    }
  }
}
