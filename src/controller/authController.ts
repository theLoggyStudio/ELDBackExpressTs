import type { Response } from 'express';
import { userRepository } from '../repository/userRepository.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { signAuthToken } from '../utils/jwt.js';
import type { AuthRequest } from '../middleware/auth.js';

export const authController = {
  login: async (req: AuthRequest, res: Response) => {
    const { email, motDePasse } = req.body;
    const user = await userRepository.findByEmail(email);
    if (!user) return res.status(401).json({ message: 'Identifiants invalides' });

    const ok = await comparePassword(motDePasse, user.motDePasse);
    if (!ok) return res.status(401).json({ message: 'Identifiants invalides' });

    const token = signAuthToken({ userId: user.id, email: user.email });
    return res.json({
      token,
      user: { id: user.id, nom: user.nom, email: user.email, tel: user.tel },
    });
  },
  changePassword: async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Non autorisé' });

    const { ancienMotDePasse, nouveauMotDePasse } = req.body;
    const user = await userRepository.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    const valid = await comparePassword(ancienMotDePasse, user.motDePasse);
    if (!valid) return res.status(400).json({ message: 'Ancien mot de passe incorrect' });

    const hashed = await hashPassword(nouveauMotDePasse);
    await userRepository.update(userId, { motDePasse: hashed });
    return res.json({ message: 'Mot de passe mis à jour' });
  },
};
