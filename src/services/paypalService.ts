import { getPaypalApiBase, getPaypalCredentials } from '../config/paypalConfig.js';

type CreateOrderResult = { ok: true; orderId: string; approvalUrl: string } | { ok: false; message: string };

const asNumber = (v: string | undefined, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

/** Montant PayPal : USD à partir du FCFA (taux aligné sur currencyService). */
const amountUsdFromFcfa = (amountFcfa: number): string => {
  const fcfaPerUsd = asNumber(process.env.FX_FCFA_PER_USD, 620);
  const usd = amountFcfa / fcfaPerUsd;
  return usd.toFixed(2);
};

const getAccessToken = async (): Promise<{ ok: true; token: string } | { ok: false; message: string }> => {
  const { clientId, clientSecret } = getPaypalCredentials();
  if (!clientId || !clientSecret) {
    return { ok: false, message: 'PayPal non configuré (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET).' };
  }
  const base = getPaypalApiBase();
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  let data: { access_token?: string; error_description?: string };
  try {
    data = (await res.json()) as typeof data;
  } catch {
    return { ok: false, message: `PayPal OAuth : réponse invalide (HTTP ${res.status}).` };
  }
  if (!data.access_token) {
    return { ok: false, message: data.error_description || `PayPal OAuth échoué (HTTP ${res.status}).` };
  }
  return { ok: true, token: data.access_token };
};

export const createPayPalOrder = async (params: {
  amountFcfa: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<CreateOrderResult> => {
  const auth = await getAccessToken();
  if (!auth.ok) return auth;

  const base = getPaypalApiBase();
  const value = amountUsdFromFcfa(params.amountFcfa);
  const body = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: 'USD',
          value,
        },
        description: params.description.slice(0, 127),
      },
    ],
    application_context: {
      brand_name: 'EllaDarie',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      return_url: params.returnUrl,
      cancel_url: params.cancelUrl,
    },
  };

  const res = await fetch(`${base}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  let data: {
    id?: string;
    links?: Array<{ href: string; rel: string; method?: string }>;
    message?: string;
  };
  try {
    data = (await res.json()) as typeof data;
  } catch {
    return { ok: false, message: `PayPal : réponse JSON invalide (HTTP ${res.status}).` };
  }
  if (!res.ok) {
    return { ok: false, message: data.message || `Création ordre PayPal échouée (HTTP ${res.status}).` };
  }
  const orderId = data.id;
  const approvalUrl = data.links?.find((l) => l.rel === 'approve')?.href;
  if (!orderId || !approvalUrl) {
    return { ok: false, message: 'PayPal : ordre créé sans lien d’approbation.' };
  }
  return { ok: true, orderId, approvalUrl };
};

export const capturePayPalOrder = async (
  orderId: string
): Promise<{ ok: true } | { ok: false; message: string }> => {
  const auth = await getAccessToken();
  if (!auth.ok) return auth;

  const base = getPaypalApiBase();
  const res = await fetch(`${base}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.token}`,
      'Content-Type': 'application/json',
    },
  });

  let data: { status?: string; message?: string; details?: unknown };
  try {
    data = (await res.json()) as typeof data;
  } catch {
    return { ok: false, message: `PayPal capture : réponse invalide (HTTP ${res.status}).` };
  }
  if (!res.ok) {
    return { ok: false, message: data.message || `Capture PayPal échouée (HTTP ${res.status}).` };
  }
  if (data.status !== 'COMPLETED') {
    return { ok: false, message: `PayPal : statut inattendu (${data.status ?? '—'}).` };
  }
  return { ok: true };
};
