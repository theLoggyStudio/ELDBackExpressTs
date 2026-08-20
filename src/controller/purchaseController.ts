import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { articleRepository } from '../repository/articleRepository.js';
import { downloadTokenRepository } from '../repository/downloadTokenRepository.js';
import { purchaseRepository } from '../repository/purchaseRepository.js';
import { confirmPaydunyaCheckoutInvoice } from '../services/paydunyaService.js';

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
    const paymentProvider =
      typeof b.paymentProvider === 'string' ? b.paymentProvider.trim().toLowerCase() : '';
    const paydunyaToken = typeof b.paydunyaToken === 'string' ? b.paydunyaToken.trim() : '';

    if (buyerEmail && !emailPattern.test(buyerEmail)) {
      return res.status(400).json({ message: 'E-mail acheteur invalide' });
    }
    if (!applicationName) {
      return res.status(400).json({ message: 'Nom d’application requis' });
    }

    const articleId = Number(b.articleId);
    const wantsDownload = Number.isInteger(articleId) && articleId > 0;

    // Sécurité : un jeton Drive exige une preuve de paiement vérifiée côté serveur.
    // PayDunya = confirmation API « completed » ; FeexPay = confiance callback SDK (pas d’API back).
    let resolvedBuyerEmail = buyerEmail;
    if (wantsDownload) {
      if (paymentProvider === 'paydunya' || (!paymentProvider && paydunyaToken)) {
        if (!paydunyaToken) {
          return res.status(402).json({
            message: 'Preuve de paiement PayDunya manquante : téléchargement refusé.',
          });
        }
        const confirmed = await confirmPaydunyaCheckoutInvoice(paydunyaToken);
        if (!confirmed.ok) {
          return res.status(402).json({ message: confirmed.message });
        }
        if (confirmed.customerEmail && !resolvedBuyerEmail) {
          resolvedBuyerEmail = confirmed.customerEmail;
        }
      } else if (paymentProvider === 'feexpay') {
        // Pas de vérification serveur FeexPay pour l’instant : le front n’appelle create qu’après callback succès.
      } else if (paymentProvider === 'dohone') {
        // Dohone : pas d’API confirm ici ; le retour cancel_url / return_url reste à renforcer.
      } else {
        return res.status(402).json({
          message: 'Fournisseur de paiement non vérifié : téléchargement refusé.',
        });
      }
    }

    const created = await purchaseRepository.create({
      receiptId: randomUUID(),
      buyerEmail: resolvedBuyerEmail || '—',
      applicationName: applicationName.slice(0, 500),
    });

    // Jeton de téléchargement à usage unique : l'URL Drive n'est jamais renvoyée au front.
    let downloadToken: string | null = null;
    if (wantsDownload) {
      const article = await articleRepository.findByPk(articleId);
      if (article?.urlDrive?.trim()) {
        const tokenRow = await downloadTokenRepository.createForArticle(articleId);
        downloadToken = tokenRow.token;
      }
    }

    return res.status(201).json({ ...created.toJSON(), downloadToken });
  },
};
