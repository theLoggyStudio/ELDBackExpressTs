import { getPaydunyaKeys, getPaydunyaMasterKey, getPaydunyaMode } from '../config/paydunyaConfig.js';

type CreateInvoiceResult = { ok: true; checkoutUrl: string } | { ok: false; message: string };

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

