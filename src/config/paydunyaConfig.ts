import dotenv from 'dotenv';

dotenv.config();

export type PaydunyaMode = 'test' | 'production';

export const getPaydunyaMode = (): PaydunyaMode => {
  const m = (process.env.PAYDUNYA_MODE ?? 'test').trim().toLowerCase();
  return m === 'production' ? 'production' : 'test';
};

export const getPaydunyaMasterKey = (): string => (process.env.PAYDUNIA_MASTER_KEY ?? '').trim();

export const getPaydunyaKeys = () => {
  const mode = getPaydunyaMode();
  if (mode === 'production') {
    return {
      publicKey: process.env.PAYDUNIA_PRODUCTION_PUBLIC_KEY ?? '',
      privateKey: process.env.PAYDUNIA_PRODUCTION_PRIVATE_KEY ?? '',
      token: process.env.PAYDUNIA_PRODUCTION_TOKEN ?? '',
      url: (process.env.PAYDUNIA_PRODUCTION_URL ?? 'https://app.paydunya.com/api/v1/checkout-invoice/create').trim(),
    };
  }
  return {
    publicKey: process.env.PAYDUNIA_TEST_PUBLIC_KEY ?? '',
    privateKey: process.env.PAYDUNIA_TEST_PRIVATE_KEY ?? '',
    token: process.env.PAYDUNIA_TEST_TOKEN ?? '',
    url: (process.env.PAYDUNIA_TEST_URL ?? 'https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create').trim(),
  };
};

/** Codes ISO 3166-1 alpha-2 des pays desservis par PayDunya (UEMOA + partenaires courants). Surchargable via env. */
export const getPaydunyaCountryCodes = (): Set<string> => {
  const raw =
    process.env.PAYDUNYA_COUNTRY_CODES?.trim() ||
    'SN,CI,ML,BJ,BF,TG,NE,GN,LR,SL,CM,GA,CG,TD,CF,CD,GH,NG';
  return new Set(
    raw
      .split(/[\s,;]+/u)
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean)
  );
};

