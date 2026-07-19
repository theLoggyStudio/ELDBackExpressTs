import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../config/database.js';

/** Jeton de téléchargement à usage unique, délivré après paiement. */
export class DownloadToken extends Model<InferAttributes<DownloadToken>, InferCreationAttributes<DownloadToken>> {
  declare id: CreationOptional<number>;
  declare token: string;
  declare articleId: number;
  declare usedAt: Date | null;
  declare expiresAt: Date;
}

DownloadToken.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    token: { type: DataTypes.STRING(128), allowNull: false, unique: true },
    articleId: { type: DataTypes.INTEGER, allowNull: false },
    usedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    modelName: 'DownloadToken',
    tableName: 'download_tokens',
    indexes: [{ fields: ['token'], unique: true }],
  },
);
