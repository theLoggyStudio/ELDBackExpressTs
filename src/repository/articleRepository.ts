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

const withDefaultAssistanceElements = <T extends Partial<ArticlePayload>>(payload: T): T => {
  return {
    ...payload,
    elementsSansAssistance: [...ELEMENTS_SANS_ASSISTANCE_DEFAUT],
    elementsAvecAssistance: [...ELEMENTS_AVEC_ASSISTANCE_DEFAUT],
  };
};

export const articleRepository = {
  findAll: () => Article.findAll({ order: [['nom', 'ASC'], ['version', 'ASC']] }),
  findByPk: (id: number) => Article.findByPk(id),
  findByNomVersion: (nom: string, version: string) =>
    Article.findOne({ where: { nom, version: version ?? '' } }),
  create: (payload: ArticlePayload) => Article.create(withDefaultAssistanceElements(payload)),
  update: async (id: number, payload: Partial<ArticlePayload>) => {
    const entity = await Article.findByPk(id);
    if (!entity) return null;
    await entity.update(withDefaultAssistanceElements(payload));
    return entity;
  },
  delete: async (id: number) => {
    const deleted = await Article.destroy({ where: { id } });
    return deleted > 0;
  },
  count: () => Article.count(),
};
