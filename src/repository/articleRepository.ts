import { Op } from 'sequelize';
import { Article } from '../entity/Article.js';

type ArticlePayload = {
  urlImage: string;
  nom: string;
  version?: string;
  categorie: string;
  URL: string;
  urlDrive: string;
  prix: number;
  description: string;
  descriptionAvecAssistace: string;
  prixAvecAssistace: number;
  tel: string;
  elementsSansAssistance: string[];
  elementsAvecAssistance: string[];
};

const ELEMENTS_SANS_ASSISTANCE_DEFAUT: string[] = [
  'Téléchargement du logiciel',
  "Pas d'assistance à l'installation",
];
const ELEMENTS_AVEC_ASSISTANCE_DEFAUT: string[] = [
  'Téléchargement du logiciel',
  'Assistance téléphonique pour installation du logiciel',
];
const TEL_ARTICLE_DEFAUT = '+221708984443';

const withDefaultAssistanceElements = <T extends Partial<ArticlePayload>>(payload: T): T => {
  const tel = typeof payload.tel === 'string' ? payload.tel.trim() : '';
  return {
    ...payload,
    tel: tel || TEL_ARTICLE_DEFAUT,
    elementsSansAssistance: [...ELEMENTS_SANS_ASSISTANCE_DEFAUT],
    elementsAvecAssistance: [...ELEMENTS_AVEC_ASSISTANCE_DEFAUT],
  };
};

const ORDER: Array<[string, string]> = [
  ['nom', 'ASC'],
  ['version', 'ASC'],
];

const escapeLike = (value: string): string => value.replace(/[%_\\]/g, '\\$&');

const searchWhere = (q: string) => {
  const term = `%${escapeLike(q)}%`;
  return {
    [Op.or]: [
      { nom: { [Op.iLike]: term } },
      { version: { [Op.iLike]: term } },
      { categorie: { [Op.iLike]: term } },
    ],
  };
};

export type ArticlePageResult = {
  items: Article[];
  total: number;
  page: number;
  pageSize: number;
};

export const articleRepository = {
  findAll: () => Article.findAll({ order: ORDER }),
  findByPk: (id: number) => Article.findByPk(id),
  findByNomVersion: (nom: string, version: string) =>
    Article.findOne({ where: { nom, version: version ?? '' } }),
  findPage: async ({
    page,
    pageSize,
    q,
  }: {
    page: number;
    pageSize: number;
    q?: string;
  }): Promise<ArticlePageResult> => {
    const safePage = Math.max(1, page);
    const safeSize = Math.min(100, Math.max(1, pageSize));
    const query = q?.trim() ?? '';
    const where = query ? searchWhere(query) : undefined;

    const { rows, count } = await Article.findAndCountAll({
      where,
      order: ORDER,
      limit: safeSize,
      offset: (safePage - 1) * safeSize,
    });

    return {
      items: rows,
      total: count,
      page: safePage,
      pageSize: safeSize,
    };
  },
  create: (payload: ArticlePayload) =>
    Article.create(
      withDefaultAssistanceElements({
        ...payload,
        version: payload.version ?? '',
      }),
    ),
  update: async (id: number, payload: Partial<ArticlePayload>) => {
    const entity = await Article.findByPk(id);
    if (!entity) return null;
    await entity.update(
      withDefaultAssistanceElements({
        ...payload,
        ...(payload.version !== undefined ? { version: payload.version ?? '' } : {}),
      }),
    );
    return entity;
  },
  delete: async (id: number) => {
    const deleted = await Article.destroy({ where: { id } });
    return deleted > 0;
  },
  count: () => Article.count(),
};
