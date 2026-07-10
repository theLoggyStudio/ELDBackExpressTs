import { getPaydunyaKeys, getPaydunyaMasterKey, getPaydunyaMode } from '../config/paydunyaConfig.js';

type CreateInvoiceResult = { ok: true; checkoutUrl: string } | { ok: false; message: string };

const normalizeCode = (raw: unknown): string => {
  if (raw === 0 || raw === '0') return '00';
  return String(raw ?? '');
};

const messageForCode = (code: string, text: string | undefined): string | undefined => {
  if (code === '1001') {
    return 'Clés PayDunya invalides : vérifiez les clés publique/privée et le token (même application).';
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
  const { publicKey, privateKey, token, url } = getPaydunyaKeys();
  const mode = getPaydunyaMode();

  if (!masterKey || !publicKey || !privateKey || !token) {
    return { ok: false, message: `Clés PayDunya manquantes (master/publique/privée/token, mode: ${mode}).` };
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
      'PAYDUNYA-PUBLIC-KEY': publicKey,
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

