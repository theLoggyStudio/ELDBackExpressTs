import type { Request, Response } from 'express';
import { articleRepository } from '../repository/articleRepository.js';

export const articleController = {
  getAll: async (_req: Request, res: Response) => {
    const rows = await articleRepository.findAll();
    res.json(rows);
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
