import type { Request, Response } from 'express';
import { articleRepository } from '../repository/articleRepository.js';
import { downloadTokenRepository } from '../repository/downloadTokenRepository.js';

const errorPage = (res: Response, status: number, title: string, message: string) =>
  res.status(status).type('html').send(`<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
      .card { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 32px; max-width: 480px; text-align: center; }
      h1 { font-size: 20px; margin: 0 0 12px; }
      p { color: #94a3b8; font-size: 15px; margin: 0; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${title}</h1>
      <p>${message}</p>
    </div>
  </body>
</html>`);

export const downloadController = {
  /** Consomme un jeton à usage unique puis redirige vers l'URL de livraison (jamais exposée au front). */
  redeem: async (req: Request, res: Response) => {
    const token = typeof req.params.token === 'string' ? req.params.token.trim() : '';
    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return errorPage(res, 400, 'Lien invalide', 'Ce lien de téléchargement est invalide.');
    }

    const claim = await downloadTokenRepository.claim(token);
    if (claim.status === 'not_found') {
      return errorPage(res, 404, 'Lien introuvable', 'Ce lien de téléchargement n’existe pas ou n’est plus disponible.');
    }
    if (claim.status === 'already_used') {
      return errorPage(
        res,
        410,
        'Lien déjà utilisé',
        'Ce lien de téléchargement a déjà été utilisé. Chaque achat donne droit à un seul téléchargement.',
      );
    }
    if (claim.status === 'expired') {
      return errorPage(res, 410, 'Lien expiré', 'Ce lien de téléchargement a expiré.');
    }

    const article = await articleRepository.findByPk(claim.articleId);
    const target = article?.urlDrive?.trim();
    if (!target) {
      return errorPage(res, 404, 'Livraison indisponible', 'Le fichier associé à cet achat est introuvable. Contactez le support.');
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(302, target);
  },
};
