import { sequelize } from "../config/database.js";
import {
  setupAssociations,
  Tenant,
  Customer,
  Product,
  Order,
  OrderLineItem,
} from "../models/index.js";

const seedData = async () => {
  try {
    await sequelize.authenticate();
    setupAssociations();
    const tenant = await Tenant.create({
      name: "Demo Electronics Store",
      shopifyDomain: "demo-electronics.myshopify.com",
    });

    const customers = await Customer.bulkCreate([
      {
        tenantId: tenant.id,
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        totalSpent: 1299.99,
        ordersCount: 3,
      },
      {
        tenantId: tenant.id,
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        totalSpent: 899.5,
        ordersCount: 2,
      },
    ]);

    const products = await Product.bulkCreate([
      {
        tenantId: tenant.id,
        title: "iPhone 15 Pro",
        description: "Latest iPhone with advanced features",
        price: 999.99,
        inventory: 50,
      },
      {
        tenantId: tenant.id,
        title: "MacBook Air M3",
        description: "Powerful laptop for professionals",
        price: 1299.99,
        inventory: 25,
      },
    ]);

    console.log("✅ Sample data created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding ", error);
    process.exit(1);
  }
};

seedData();
