import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Article } from './entity/Article.js';
import { User } from './entity/User.js';
import { hashPassword } from './utils/password.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const seedData = async () => {
  const articleCount = await Article.count();
  if (articleCount === 0) {
    const filePath = path.resolve(__dirname, '../../src/constants/json/article.json');
    const raw = await readFile(filePath, 'utf-8');
    const payload = JSON.parse(raw) as Array<Record<string, unknown>>;
    await Article.bulkCreate(payload as never[]);
  }

  const userCount = await User.count();
  if (userCount === 0) {
    const motDePasse = await hashPassword('admin');
    await User.create({
      nom: 'admin',
      email: 'admin@eld.local',
      tel: '+221 00000000',
      motDePasse,
    });
  }
};
