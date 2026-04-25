import type { Request, Response } from 'express';
import { userRepository } from '../repository/userRepository.js';
import { hashPassword } from '../utils/password.js';

export const userController = {
  getAll: async (_req: Request, res: Response) => {
    const rows = await userRepository.findAll();
    res.json(rows);
  },
  create: async (req: Request, res: Response) => {
    const { nom, email, tel, motDePasse } = req.body;
    const existing = await userRepository.findByEmail(email);
    if (existing) return res.status(409).json({ message: 'Email déjà utilisé' });

    const hashed = await hashPassword(motDePasse);
    const created = await userRepository.create({
      nom,
      email,
      tel,
      motDePasse: hashed,
    });
    res.status(201).json({ id: created.id, nom: created.nom, email: created.email, tel: created.tel });
  },
  update: async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const updated = await userRepository.update(id, req.body);
    if (!updated) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json({ id: updated.id, nom: updated.nom, email: updated.email, tel: updated.tel });
  },
  remove: async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const ok = await userRepository.delete(id);
    if (!ok) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.status(204).send();
  },
};
