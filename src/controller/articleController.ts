import type { Request, Response } from 'express';
import type { Article } from '../entity/Article.js';
import { articleRepository } from '../repository/articleRepository.js';
import { verifyAuthToken } from '../utils/jwt.js';

const parsePositiveInt = (value: unknown, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

/** urlDrive n'est renvoyée qu'aux requêtes admin authentifiées (jamais au catalogue public). */
const isAdminRequest = (req: Request): boolean => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return false;
  try {
    verifyAuthToken(authHeader.replace('Bearer ', '').trim());
    return true;
  } catch {
    return false;
  }
};

const toPublicArticle = (row: Article): Record<string, unknown> => {
  const plain = row.toJSON() as Record<string, unknown>;
  delete plain.urlDrive;
  return plain;
};

const serializeArticles = (rows: Article[], includeDrive: boolean): unknown[] =>
  includeDrive ? rows : rows.map(toPublicArticle);

export const articleController = {
  getAll: async (req: Request, res: Response) => {
    const wantsAll = req.query.all === '1' || req.query.all === 'true';
    const includeDrive = isAdminRequest(req);

    if (wantsAll) {
      const rows = await articleRepository.findAll();
      res.setHeader('Cache-Control', 'private, no-store');
      return res.json({
        items: serializeArticles(rows, includeDrive),
        total: rows.length,
        page: 1,
        pageSize: rows.length,
      });
    }

    const page = parsePositiveInt(req.query.page, 1);
    const pageSize = Math.min(50, parsePositiveInt(req.query.limit, 6));
    const q = typeof req.query.q === 'string' ? req.query.q : '';

    const result = await articleRepository.findPage({ page, pageSize, q });
    res.setHeader('Cache-Control', includeDrive ? 'private, no-store' : 'public, max-age=30, stale-while-revalidate=90');
    res.json({ ...result, items: serializeArticles(result.items, includeDrive) });
  },
  getOne: async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }
    const row = await articleRepository.findByPk(id);
    if (!row) return res.status(404).json({ message: 'Article introuvable' });
    const includeDrive = isAdminRequest(req);
    res.setHeader('Cache-Control', includeDrive ? 'private, no-store' : 'public, max-age=60, stale-while-revalidate=120');
    res.json(includeDrive ? row : toPublicArticle(row));
  },
  create: async (req: Request, res: Response) => {
    const created = await articleRepository.create(req.body);
    res.status(201).json(created);
  },
  update: async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const updated = await articleRepository.update(id, req.body);
    if (!updated) return res.status(404).json({ message: 'Article introuvable' });
    res.json(updated);
  },
  remove: async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ok = await articleRepository.delete(id);
    if (!ok) return res.status(404).json({ message: 'Article introuvable' });
    res.status(204).send();
  },
};
