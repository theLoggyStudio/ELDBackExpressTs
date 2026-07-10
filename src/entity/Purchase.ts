import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Purchase extends Model<InferAttributes<Purchase>, InferCreationAttributes<Purchase>> {
  declare id: CreationOptional<number>;
  declare receiptId: string;
  declare buyerEmail: string;
  declare applicationName: string;
  declare purchasedAt: CreationOptional<Date>;
}

Purchase.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    receiptId: { type: DataTypes.STRING(36), allowNull: true, unique: true },
    buyerEmail: { type: DataTypes.STRING, allowNull: false },
    applicationName: { type: DataTypes.STRING, allowNull: false },
    purchasedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'Purchase',
    tableName: 'purchases',
  },
);
