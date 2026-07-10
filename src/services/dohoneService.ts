import { dohoneCountryLabelFromIso } from '../config/dohoneConfig.js';

type StartDohoneResult = { ok: true; checkoutUrl: string } | { ok: false; message: string };

const getApiUrl = (): string =>
  (process.env.DOHONE_API_URL ?? 'https://www.dohone.com/dohone-api/v1').trim();

const getMerchantRn = (): string => (process.env.DOHONE_MERCHANT_RN ?? '').trim();

const getPaymentRt = (): string => (process.env.DOHONE_PAYMENT_RT ?? 'MOBILE').trim();

const getCurrency = (): string => (process.env.DOHONE_CURRENCY ?? 'XAF').trim();

const extractCheckoutUrl = (data: unknown): string | null => {
  if (!data || typeof data !== 'object') return null;
  const keys = [
    'checkoutUrl',
    'url',
    'URL',
    'paymentUrl',
    'redirect',
    'link',
    'redirect_url',
    'payment_url',
  ];
  const o = data as Record<string, unknown>;
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'string' && /^https?:\/\//iu.test(v.trim())) return v.trim();
  }
  const nested = o.data;
  if (nested && typeof nested === 'object') {
    const no = nested as Record<string, unknown>;
    for (const k of keys) {
      const v = no[k];
      if (typeof v === 'string' && /^https?:\/\//iu.test(v.trim())) return v.trim();
    }
  }
  return null;
};

/**
 * Initie un paiement Dohone (cmd startpayment, form-urlencoded).
 * Le numéro marchand reste côté serveur (DOHONE_MERCHANT_RN).
 */
export const startDohonePayment = async (params: {
  amountFcfa: number;
  countryCode: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  phone: string;
}): Promise<StartDohoneResult> => {
  const rN = getMerchantRn();
  if (!rN) {
    return { ok: false, message: 'Dohone non configuré (DOHONE_MERCHANT_RN).' };
  }

  const phone = params.phone.trim();
  if (!phone) {
    return { ok: false, message: 'Numéro de téléphone requis pour le paiement Dohone.' };
  }

  const apiUrl = getApiUrl();
  let base: URL;
  try {
    base = new URL(apiUrl);
  } catch {
    return { ok: false, message: 'DOHONE_API_URL invalide.' };
  }

  const body = new URLSearchParams({
    cmd: 'startpayment',
    rN,
    rT: getPaymentRt(),
    amount: String(Math.round(params.amountFcfa)),
    currency: getCurrency(),
    phone,
    country: dohoneCountryLabelFromIso(params.countryCode),
    description: params.description.slice(0, 200),
    return_url: params.returnUrl,
    cancel_url: params.cancelUrl,
  });

  try {
    const response = await fetch(base.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const text = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      return {
        ok: false,
        message: `Dohone: réponse invalide (HTTP ${String(response.status)}).`,
      };
    }

    if (!response.ok) {
      const msg =
        data &&
        typeof data === 'object' &&
        'message' in data &&
        typeof (data as { message: unknown }).message === 'string'
          ? (data as { message: string }).message
          : `HTTP ${String(response.status)}`;
      return { ok: false, message: `Dohone: ${msg}` };
    }

    const checkoutUrl = extractCheckoutUrl(data);
    if (checkoutUrl) {
      return { ok: true, checkoutUrl };
    }

    return {
      ok: false,
      message:
        'Dohone: réponse sans URL de redirection. Vérifiez la doc API (réponse JSON) ou les paramètres.',
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erreur réseau Dohone';
    return { ok: false, message };
  }
};
