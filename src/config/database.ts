import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL ?? '';

if (!databaseUrl) {
  throw new Error('DATABASE_URL manquant dans le fichier .env');
}

export const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  dialectModule: pg,
  logging: false,
});
