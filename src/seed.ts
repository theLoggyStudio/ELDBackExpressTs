import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Article } from './entity/Article.js';
import { User } from './entity/User.js';
import { articleRepository } from './repository/articleRepository.js';
import { hashPassword } from './utils/password.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTICLE_SEED_PATHS = [
  path.resolve(__dirname, './constants/json/article.json'),
  path.resolve(__dirname, '../src/constants/json/article.json'),
  path.resolve(__dirname, '../../ELDVente/src/constants/json/article.json'),
];

const ELEMENTS_SANS_ASSISTANCE_DEFAUT: string[] = [
  'Téléchargement du logiciel',
  "Pas d'assistance à l'installation",
];
const ELEMENTS_AVEC_ASSISTANCE_DEFAUT: string[] = [
  'Téléchargement du logiciel',
  'Assistance pour installation du logiciel',
];

const normalizeVersion = (version?: string) => (version ?? '').trim();

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

const syncArticles = async (payload: Array<Record<string, unknown>>) => {
  for (const raw of payload) {
    const nom = String(raw.nom ?? '').trim();
    if (!nom) continue;
    const version = normalizeVersion(typeof raw.version === 'string' ? raw.version : '');
    const existing = await articleRepository.findByNomVersion(nom, version);
    const data = { ...raw, nom, version };
    if (existing) {
      await existing.update(data);
    } else {
      await articleRepository.create(data as never);
    }
  }
};

export const seedData = async () => {
  const payload = await loadArticleSeed();
  const articleCount = await Article.count();

  if (articleCount === 0 && payload.length > 0) {
    await Article.bulkCreate(
      payload.map((item) => ({
        ...item,
        version: normalizeVersion(typeof item.version === 'string' ? item.version : ''),
      })) as never[],
    );
  } else if (payload.length > 0) {
    await syncArticles(payload);
  }

  // Harmonise les articles deja en base avec les formules / téléphone standards demandés.
  await Article.update(
    {
      elementsSansAssistance: [...ELEMENTS_SANS_ASSISTANCE_DEFAUT],
      elementsAvecAssistance: [...ELEMENTS_AVEC_ASSISTANCE_DEFAUT],
      tel: '+221708984443',
    },
    { where: {} }
  );

  const userCount = await User.count();
  const legacyAdmin = await User.findOne({ where: { email: 'admin@eld.local' } });

  if (legacyAdmin) {
    await legacyAdmin.update({
      nom: 'admin',
      email: 'admin',
      motDePasse: await hashPassword('admin'),
    });
  } else if (userCount === 0) {
    await User.create({
      nom: 'admin',
      email: 'admin',
      tel: '+221 00000000',
      motDePasse: await hashPassword('admin'),
    });
  }
};
