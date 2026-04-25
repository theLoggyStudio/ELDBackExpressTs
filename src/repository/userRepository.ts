import { User } from '../entity/User.js';

type UserPayload = {
  nom: string;
  email: string;
  tel: string;
  motDePasse: string;
};

export const userRepository = {
  findAll: () => User.findAll({ order: [['id', 'DESC']], attributes: { exclude: ['motDePasse'] } }),
  findByPk: (id: number) => User.findByPk(id),
  findByEmail: (email: string) => User.findOne({ where: { email } }),
  create: (payload: UserPayload) => User.create(payload),
  update: async (id: number, payload: Partial<UserPayload>) => {
    const entity = await User.findByPk(id);
    if (!entity) return null;
    await entity.update(payload);
    return entity;
  },
  delete: async (id: number) => {
    const deleted = await User.destroy({ where: { id } });
    return deleted > 0;
  },
};
