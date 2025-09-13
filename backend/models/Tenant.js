import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Tenant = sequelize.define(
  "Tenant",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shopifyDomain: {
      type: DataTypes.STRING,
      unique: true,
    },
    shopifyAccessToken: {
      type: DataTypes.TEXT,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "tenants",
    timestamps: true,
  }
);
