import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sequelize } from '../src/config/database.js';
import '../src/entity/Article.js';
import { articleRepository } from '../src/repository/articleRepository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLE_SEED_PATHS = [
  path.resolve(__dirname, '../src/constants/json/article.json'),
  path.resolve(__dirname, '../../ELDVente/src/constants/json/article.json'),
];

type SeedArticle = {
  nom: string;
  version?: string;
  urlDrive: string;
  [key: string]: unknown;
};

const loadArticleSeed = async (): Promise<SeedArticle[]> => {
  for (const filePath of ARTICLE_SEED_PATHS) {
    try {
      const raw = await readFile(filePath, 'utf-8');
      return JSON.parse(raw) as SeedArticle[];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
  throw new Error('Fichier article.json introuvable pour la synchronisation.');
};

const normalizeVersion = (version?: string) => (version ?? '').trim();

export const syncArticlesFromSeed = async (options?: { replaceAll?: boolean }) => {
  const replaceAll = options?.replaceAll ?? false;
  const payload = await loadArticleSeed();

  await sequelize.sync({ alter: true });

  if (replaceAll) {
    const { Article } = await import('../src/entity/Article.js');
    await Article.destroy({ where: {} });
    await Article.bulkCreate(
      payload.map((item) => ({
        ...item,
        version: normalizeVersion(item.version),
      })) as never[],
    );
    return { created: payload.length, updated: 0, total: payload.length };
  }

  let created = 0;
  let updated = 0;

  for (const item of payload) {
    const version = normalizeVersion(item.version);
    const existing = await articleRepository.findByNomVersion(item.nom, version);
    if (existing) {
      await existing.update({ ...item, version });
      updated += 1;
    } else {
      await articleRepository.create({ ...item, version } as never);
      created += 1;
    }
  }

  return { created, updated, total: payload.length };
};

const isDirectRun = process.argv[1]?.includes('sync-articles');

if (isDirectRun) {
  const replaceAll = process.argv.includes('--replace-all');
  syncArticlesFromSeed({ replaceAll })
    .then((result) => {
      // eslint-disable-next-line no-console
      console.log(
        `Synchronisation terminée : ${result.created} créé(s), ${result.updated} mis à jour, ${result.total} dans le catalogue.`,
      );
      process.exit(0);
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Échec de la synchronisation des articles :', error);
      process.exit(1);
    });
}
