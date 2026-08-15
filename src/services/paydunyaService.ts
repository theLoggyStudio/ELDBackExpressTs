import { getPaydunyaKeys, getPaydunyaMasterKey, getPaydunyaMode } from '../config/paydunyaConfig.js';

type CreateInvoiceResult = { ok: true; checkoutUrl: string } | { ok: false; message: string };

type ConfirmInvoiceResult =
  | {
      ok: true;
      status: string;
      customerEmail: string;
      customerName: string;
      customerPhone: string;
    }
  | { ok: false; message: string };

const normalizeCode = (raw: unknown): string => {
  if (raw === 0 || raw === '0') return '00';
  return String(raw ?? '');
};

const messageForCode = (code: string, text: string | undefined): string | undefined => {
  if (code === '1001') {
    const detail = text?.trim();
    return detail
      ? `Clés PayDunya invalides : ${detail}`
      : 'Clés PayDunya invalides : master key / clé privée / token (même application, mode test ou production).';
  }
  return text;
};

const getPaydunyaConfirmUrl = (invoiceToken: string): string => {
  const mode = getPaydunyaMode();
  const base =
    mode === 'production'
      ? 'https://app.paydunya.com/api/v1/checkout-invoice/confirm'
      : 'https://app.paydunya.com/sandbox-api/v1/checkout-invoice/confirm';
  return `${base}/${encodeURIComponent(invoiceToken)}`;
};

export const createPaydunyaCheckoutInvoice = async (params: {
  totalAmountFcfa: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<CreateInvoiceResult> => {
  const masterKey = getPaydunyaMasterKey();
  const { privateKey, token, url } = getPaydunyaKeys();
  const mode = getPaydunyaMode();

  // Docs HTTP/JSON : master + private + token (pas la clé publique).
  if (!masterKey || !privateKey || !token) {
    return { ok: false, message: `Clés PayDunya manquantes (master/privée/token, mode: ${mode}).` };
  }
  if (!url) {
    return { ok: false, message: 'URL API PayDunya manquante.' };
  }

  const body: Record<string, unknown> = {
    invoice: {
      total_amount: Math.round(params.totalAmountFcfa),
      description: params.description,
    },
    store: {
      name: 'EllaDarie',
    },
    actions: {
      return_url: params.returnUrl,
      cancel_url: params.cancelUrl,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'PAYDUNYA-MASTER-KEY': masterKey,
      'PAYDUNYA-PRIVATE-KEY': privateKey,
      'PAYDUNYA-TOKEN': token,
    },
    body: JSON.stringify(body),
  });

  let data: { response_code?: string | number; response_text?: string; description?: string };
  try {
    data = (await res.json()) as typeof data;
  } catch {
    return {
      ok: false,
      message: res.ok ? 'Réponse PayDunya invalide.' : `HTTP ${res.status} (JSON attendu).`,
    };
  }

  const code = normalizeCode(data.response_code);
  if (code === '00' && data.response_text) {
    return { ok: true, checkoutUrl: data.response_text };
  }

  const hint = messageForCode(code, data.response_text) ?? data.response_text;
  return { ok: false, message: hint || data.description || `Erreur PayDunya (code ${code}).` };
};

/** Confirme une facture PayDunya et récupère les infos client (email saisi sur la page de paiement). */
export const confirmPaydunyaCheckoutInvoice = async (
  invoiceToken: string,
): Promise<ConfirmInvoiceResult> => {
  const token = invoiceToken.trim();
  if (!token) {
    return { ok: false, message: 'Token de facture PayDunya manquant.' };
  }

  const masterKey = getPaydunyaMasterKey();
  const { privateKey, token: apiToken } = getPaydunyaKeys();
  const mode = getPaydunyaMode();

  if (!masterKey || !privateKey || !apiToken) {
    return { ok: false, message: `Clés PayDunya manquantes (master/privée/token, mode: ${mode}).` };
  }

  const res = await fetch(getPaydunyaConfirmUrl(token), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'PAYDUNYA-MASTER-KEY': masterKey,
      'PAYDUNYA-PRIVATE-KEY': privateKey,
      'PAYDUNYA-TOKEN': apiToken,
    },
  });

  let data: {
    response_code?: string | number;
    response_text?: string;
    description?: string;
    status?: string;
    customer?: { name?: string; email?: string; phone?: string };
  };
  try {
    data = (await res.json()) as typeof data;
  } catch {
    return {
      ok: false,
      message: res.ok ? 'Réponse PayDunya invalide.' : `HTTP ${res.status} (JSON attendu).`,
    };
  }

  const code = normalizeCode(data.response_code);
  if (code !== '00') {
    const hint = messageForCode(code, data.response_text) ?? data.response_text;
    return { ok: false, message: hint || data.description || `Erreur PayDunya (code ${code}).` };
  }

  const customer = data.customer ?? {};
  return {
    ok: true,
    status: String(data.status ?? data.response_text ?? '').trim().toLowerCase(),
    customerEmail: String(customer.email ?? '').trim(),
    customerName: String(customer.name ?? '').trim(),
    customerPhone: String(customer.phone ?? '').trim(),
  };
};

