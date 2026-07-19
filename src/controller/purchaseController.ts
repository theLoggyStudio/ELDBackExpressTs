import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { articleRepository } from '../repository/articleRepository.js';
import { downloadTokenRepository } from '../repository/downloadTokenRepository.js';
import { purchaseRepository } from '../repository/purchaseRepository.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseBody = (body: unknown): Record<string, unknown> =>
  body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {};

export const purchaseController = {
  getAll: async (_req: Request, res: Response) => {
    const rows = await purchaseRepository.findAll();
    res.json(rows);
  },

  create: async (req: Request, res: Response) => {
    const b = parseBody(req.body);
    const buyerEmail = typeof b.buyerEmail === 'string' ? b.buyerEmail.trim() : '';
    const applicationName = typeof b.applicationName === 'string' ? b.applicationName.trim() : '';

    if (buyerEmail && !emailPattern.test(buyerEmail)) {
      return res.status(400).json({ message: 'E-mail acheteur invalide' });
    }
    if (!applicationName) {
      return res.status(400).json({ message: 'Nom d’application requis' });
    }

    const created = await purchaseRepository.create({
      receiptId: randomUUID(),
      buyerEmail: buyerEmail || '—',
      applicationName: applicationName.slice(0, 500),
    });

    // Jeton de téléchargement à usage unique : l'URL Drive n'est jamais renvoyée au front.
    let downloadToken: string | null = null;
    const articleId = Number(b.articleId);
    if (Number.isInteger(articleId) && articleId > 0) {
      const article = await articleRepository.findByPk(articleId);
      if (article?.urlDrive?.trim()) {
        const tokenRow = await downloadTokenRepository.createForArticle(articleId);
        downloadToken = tokenRow.token;
      }
    }

    return res.status(201).json({ ...created.toJSON(), downloadToken });
  },
};
