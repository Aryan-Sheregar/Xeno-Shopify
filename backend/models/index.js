import { Tenant } from "./Tenant.js";
import { Customer } from "./Customer.js";
import { Product } from "./Product.js";
import { Order } from "./Order.js";
import { OrderLineItem } from "./OrderLineItem.js";

export const setupAssociations = () => {
  // Tenant associations
  Tenant.hasMany(Customer, { foreignKey: "tenantId", as: "customers" });
  Tenant.hasMany(Product, { foreignKey: "tenantId", as: "products" });
  Tenant.hasMany(Order, { foreignKey: "tenantId", as: "orders" });

  // Customer associations
  Customer.belongsTo(Tenant, { foreignKey: "tenantId", as: "tenant" });
  Customer.hasMany(Order, { foreignKey: "customerId", as: "orders" });

  // Product associations
  Product.belongsTo(Tenant, { foreignKey: "tenantId", as: "tenant" });
  Product.hasMany(OrderLineItem, {
    foreignKey: "productId",
    as: "orderLineItems",
  });

  // Order associations
  Order.belongsTo(Tenant, { foreignKey: "tenantId", as: "tenant" });
  Order.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });
  Order.hasMany(OrderLineItem, { foreignKey: "orderId", as: "lineItems" });

  // OrderLineItem associations
  OrderLineItem.belongsTo(Order, { foreignKey: "orderId", as: "order" });
  OrderLineItem.belongsTo(Product, { foreignKey: "productId", as: "product" });
};

export { Tenant, Customer, Product, Order, OrderLineItem };
