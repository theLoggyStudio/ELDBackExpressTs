import type { Request, Response, NextFunction } from 'express';
import { verifyAuthToken } from '../utils/jwt.js';

type AuthRequest = Request & {
  user?: { userId: number; email: string };
};

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Non autorisé' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  try {
    req.user = verifyAuthToken(token);
    next();
  } catch {
    return res.status(401).json({ message: 'Token invalide' });
  }
};

export type { AuthRequest };
