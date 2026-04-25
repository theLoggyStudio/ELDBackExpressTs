import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Article extends Model<InferAttributes<Article>, InferCreationAttributes<Article>> {
  declare id: CreationOptional<number>;
  declare urlImage: string;
  declare nom: string;
  declare categorie: string;
  declare URL: string;
  declare urlDrive: string;
  declare prix: number;
  declare description: string;
  declare descriptionAvecAssistace: string;
  declare prixAvecAssistace: number;
  declare tel: string;
  declare elementsSansAssistance: string[];
  declare elementsAvecAssistance: string[];
}

Article.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    urlImage: { type: DataTypes.TEXT, allowNull: false },
    nom: { type: DataTypes.STRING, allowNull: false },
    categorie: { type: DataTypes.STRING, allowNull: false },
    URL: { type: DataTypes.TEXT, allowNull: false },
    urlDrive: { type: DataTypes.TEXT, allowNull: false },
    prix: { type: DataTypes.INTEGER, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    descriptionAvecAssistace: { type: DataTypes.TEXT, allowNull: false },
    prixAvecAssistace: { type: DataTypes.INTEGER, allowNull: false },
    tel: { type: DataTypes.STRING, allowNull: false },
    elementsSansAssistance: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    elementsAvecAssistance: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  },
  {
    sequelize,
    modelName: 'Article',
    tableName: 'articles',
  }
);
