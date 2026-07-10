import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
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

    if (!buyerEmail || !emailPattern.test(buyerEmail)) {
      return res.status(400).json({ message: 'E-mail acheteur invalide' });
    }
    if (!applicationName) {
      return res.status(400).json({ message: 'Nom d’application requis' });
    }

    const created = await purchaseRepository.create({
      receiptId: randomUUID(),
      buyerEmail,
      applicationName: applicationName.slice(0, 500),
    });
    return res.status(201).json(created);
  },
};
