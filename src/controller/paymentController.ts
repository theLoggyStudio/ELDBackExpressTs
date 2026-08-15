import type { Request, Response } from 'express';
import { getDohoneCountryCodes } from '../config/dohoneConfig.js';
import { getPaydunyaCountryCodes } from '../config/paydunyaConfig.js';
import { quoteForCountry } from '../services/currencyService.js';
import { startDohonePayment } from '../services/dohoneService.js';
import {
  confirmPaydunyaCheckoutInvoice,
  createPaydunyaCheckoutInvoice,
} from '../services/paydunyaService.js';

const parseBody = (body: unknown): Record<string, unknown> =>
  body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {};

const asString = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);
const asNumber = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

const normalizeCountry = (raw: unknown): string => {
  const s = (asString(raw) ?? 'SN').trim().toUpperCase();
  return /^[A-Z]{2}$/u.test(s) ? s : 'SN';
};

export const paymentController = {
  quote: (req: Request, res: Response) => {
    try {
      const b = parseBody(req.body);
      const amountFcfa = asNumber(b.amountFcfa) ?? (typeof b.amountFcfa === 'string' ? Number(b.amountFcfa) : NaN);
      const countryCode = normalizeCountry(b.countryCode);
      if (!Number.isFinite(amountFcfa) || amountFcfa < 0) {
        return res.status(400).json({ message: 'amountFcfa invalide' });
      }
      const paydunyaCountries = getPaydunyaCountryCodes();
      const dohoneCountries = getDohoneCountryCodes();
      const usesDohone = dohoneCountries.has(countryCode);
      const usesPaydunya = paydunyaCountries.has(countryCode) && !usesDohone;
      const q = quoteForCountry(amountFcfa, countryCode);
      const provider: 'paydunya' | 'dohone' | 'none' = usesDohone
        ? 'dohone'
        : usesPaydunya
          ? 'paydunya'
          : 'none';
      return res.json({
        ...q,
        paydunyaSupported: usesPaydunya,
        dohoneSupported: usesDohone,
        provider,
        paydunyaConfiguredCountries: Array.from(paydunyaCountries),
        dohoneConfiguredCountries: Array.from(dohoneCountries),
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur';
      return res.status(400).json({ message });
    }
  },

  checkout: async (req: Request, res: Response) => {
    const b = parseBody(req.body);
    const amountFcfa = asNumber(b.amountFcfa) ?? (typeof b.amountFcfa === 'string' ? Number(b.amountFcfa) : NaN);
    const countryCode = normalizeCountry(b.countryCode);
    const description = (asString(b.description) ?? 'Commande').trim() || 'Commande';
    const returnUrl = (asString(b.returnUrl) ?? '').trim();
    const cancelUrl = (asString(b.cancelUrl) ?? '').trim();
    const phone = (asString(b.phone) ?? '').trim();

    if (!Number.isFinite(amountFcfa) || amountFcfa <= 0) {
      return res.status(400).json({ message: 'amountFcfa invalide' });
    }
    if (!returnUrl || !cancelUrl) {
      return res.status(400).json({ message: 'returnUrl et cancelUrl requis' });
    }

    const paydunyaCountries = getPaydunyaCountryCodes();
    const dohoneCountries = getDohoneCountryCodes();
    const useDohone = dohoneCountries.has(countryCode);

    if (useDohone) {
      const d = await startDohonePayment({
        amountFcfa,
        countryCode,
        description,
        returnUrl,
        cancelUrl,
        phone,
      });
      if (!d.ok) {
        return res.status(502).json({ message: d.message });
      }
      return res.json({ provider: 'dohone', checkoutUrl: d.checkoutUrl });
    }

    if (paydunyaCountries.has(countryCode)) {
      const inv = await createPaydunyaCheckoutInvoice({
        totalAmountFcfa: amountFcfa,
        description: description.slice(0, 500),
        returnUrl,
        cancelUrl,
      });
      if (!inv.ok) {
        return res.status(502).json({ message: inv.message });
      }
      return res.json({ provider: 'paydunya', checkoutUrl: inv.checkoutUrl });
    }

    return res.status(400).json({
      message: 'Aucun fournisseur de paiement pour ce pays. Ajoutez le pays à DOHONE_COUNTRY_CODES ou PAYDUNYA_COUNTRY_CODES.',
    });
  },

  /** Confirme une facture PayDunya (token renvoyé sur return_url) et renvoie l’e-mail client. */
  confirmPaydunya: async (req: Request, res: Response) => {
    const token =
      (typeof req.query.token === 'string' ? req.query.token : undefined)?.trim() ||
      (asString(parseBody(req.body).token) ?? '').trim();

    if (!token) {
      return res.status(400).json({ message: 'token de facture PayDunya requis' });
    }

    const result = await confirmPaydunyaCheckoutInvoice(token);
    if (!result.ok) {
      return res.status(502).json({ message: result.message });
    }

    return res.json({
      status: result.status,
      customerEmail: result.customerEmail,
      customerName: result.customerName,
      customerPhone: result.customerPhone,
    });
  },
};
