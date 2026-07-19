import { randomBytes } from 'node:crypto';
import { Op } from 'sequelize';
import { DownloadToken } from '../entity/DownloadToken.js';

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 heure

export type ClaimResult =
  | { status: 'ok'; articleId: number }
  | { status: 'not_found' }
  | { status: 'already_used' }
  | { status: 'expired' };

export const downloadTokenRepository = {
  createForArticle: async (articleId: number, ttlMs: number = DEFAULT_TTL_MS): Promise<DownloadToken> => {
    const token = randomBytes(32).toString('hex');
    return DownloadToken.create({
      token,
      articleId,
      usedAt: null,
      expiresAt: new Date(Date.now() + ttlMs),
    });
  },

  /** Consomme le jeton de façon atomique : une seule utilisation possible, même en cas d'accès concurrents. */
  claim: async (token: string): Promise<ClaimResult> => {
    const row = await DownloadToken.findOne({ where: { token } });
    if (!row) return { status: 'not_found' };
    if (row.usedAt) return { status: 'already_used' };
    if (row.expiresAt.getTime() < Date.now()) return { status: 'expired' };

    const [updated] = await DownloadToken.update(
      { usedAt: new Date() },
      {
        where: {
          token,
          usedAt: { [Op.is]: null },
          expiresAt: { [Op.gt]: new Date() },
        },
      },
    );
    if (updated === 0) return { status: 'already_used' };
    return { status: 'ok', articleId: row.articleId };
  },
};
