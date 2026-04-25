import { Article } from '../entity/Article.js';

type ArticlePayload = {
  urlImage: string;
  nom: string;
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

export const articleRepository = {
  findAll: () => Article.findAll({ order: [['id', 'DESC']] }),
  findByPk: (id: number) => Article.findByPk(id),
  create: (payload: ArticlePayload) => Article.create(payload),
  update: async (id: number, payload: Partial<ArticlePayload>) => {
    const entity = await Article.findByPk(id);
    if (!entity) return null;
    await entity.update(payload);
    return entity;
  },
  delete: async (id: number) => {
    const deleted = await Article.destroy({ where: { id } });
    return deleted > 0;
  },
  count: () => Article.count(),
};
