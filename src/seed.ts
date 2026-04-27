import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Article } from './entity/Article.js';
import { User } from './entity/User.js';
import { hashPassword } from './utils/password.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLE_SEED_PATHS = [
  path.resolve(__dirname, './constants/json/article.json'),
  path.resolve(__dirname, '../src/constants/json/article.json'),
  path.resolve(__dirname, '../../ELDVente/src/constants/json/article.json'),
];

const loadArticleSeed = async (): Promise<Array<Record<string, unknown>>> => {
  for (const filePath of ARTICLE_SEED_PATHS) {
    try {
      const raw = await readFile(filePath, 'utf-8');
      return JSON.parse(raw) as Array<Record<string, unknown>>;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  // eslint-disable-next-line no-console
  console.warn('Article seed file not found; skipping initial article seeding.');
  return [];
};

export const seedData = async () => {
  const articleCount = await Article.count();
  if (articleCount === 0) {
    const payload = await loadArticleSeed();
    if (payload.length > 0) {
      await Article.bulkCreate(payload as never[]);
    }
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
