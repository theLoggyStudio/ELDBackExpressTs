import dotenv from 'dotenv';

dotenv.config();

export type PaypalMode = 'sandbox' | 'production';

export const getPaypalMode = (): PaypalMode => {
  const m = (process.env.PAYPAL_MODE ?? 'sandbox').trim().toLowerCase();
  return m === 'production' ? 'production' : 'sandbox';
};

export const getPaypalApiBase = (): string =>
  getPaypalMode() === 'production' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

export const getPaypalCredentials = (): { clientId: string; clientSecret: string } => ({
  clientId: (process.env.PAYPAL_CLIENT_ID ?? '').trim(),
  clientSecret: (process.env.PAYPAL_CLIENT_SECRET ?? '').trim(),
});

export const isPaypalConfigured = (): boolean => {
  const { clientId, clientSecret } = getPaypalCredentials();
  return Boolean(clientId && clientSecret);
};

/**
 * Pays où l’option PayPal est proposée (ISO 3166-1 alpha-2).
 * Surcharge via PAYPAL_COUNTRY_CODES ; liste par défaut = marchés où PayPal est couramment utilisé par les acheteurs.
 */
export const getPaypalCountryCodes = (): Set<string> => {
  const raw =
    process.env.PAYPAL_COUNTRY_CODES?.trim() ||
    'FR,DE,IT,ES,PT,NL,BE,LU,AT,IE,GB,CH,US,CA,AU,NZ,JP,PL,SE,NO,DK,FI,BR,MX,IN,SG,HK,AE,MA,TN,DZ,EG,ZA,IL,TR,KR,TH,MY,ID,PH,VN,SA,QA,KW,OM,BH,JO,LB,CY,MT,GR,RO,BG,HU,CZ,SK,SI,HR,EE,LV,LT,RS,IS,LI,MC,AD,SM,VA';
  return new Set(
    raw
      .split(/[\s,;]+/u)
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean)
  );
};

export const isPaypalCountry = (countryCode: string): boolean => getPaypalCountryCodes().has(countryCode.trim().toUpperCase());
