export const Customer = sequelize.define(
  "Customer",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    shopifyCustomerId: {
      type: DataTypes.BIGINT, 
      unique: true,
    },
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: DataTypes.STRING,
    totalSpent: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    ordersCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "_customers",
    timestamps: true,
  }
);
