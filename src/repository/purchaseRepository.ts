import { Purchase } from '../entity/Purchase.js';

export const purchaseRepository = {
  findAll: () => Purchase.findAll({ order: [['purchasedAt', 'DESC']] }),

  create: (data: { receiptId: string; buyerEmail: string; applicationName: string; purchasedAt?: Date }) =>
    Purchase.create(data),
};
