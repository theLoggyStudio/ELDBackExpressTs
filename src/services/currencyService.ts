/**
 * Conversion indicative FCFA (XOF) -> devise d'affichage selon le pays.
 * Taux modifiables par variables d'environnement (arrondi affichage côté Intl).
 */

const asNumber = (v: string | undefined, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

/** 1 FCFA (XOF) = combien d’unités de la devise cible (approx.). */
const localAmount = (amountFcfa: number, displayCurrency: string): number => {
  const eur = asNumber(process.env.FX_FCFA_PER_EUR, 655.957);
  const usd = asNumber(process.env.FX_FCFA_PER_USD, 620);
  const gbp = asNumber(process.env.FX_FCFA_PER_GBP, 780);
  const chf = asNumber(process.env.FX_FCFA_PER_CHF, 700);
  const mad = asNumber(process.env.FX_FCFA_PER_MAD, 60);
  const dzd = asNumber(process.env.FX_FCFA_PER_DZD, 4.5);
  const xaf = asNumber(process.env.FX_FCFA_PER_XAF, 655.957);
  const ghs = asNumber(process.env.FX_FCFA_PER_GHS, 45);
  const ngnPerFcfa = asNumber(process.env.FX_NGN_PER_FCFA, 0.27);

  if (displayCurrency === 'XOF' || displayCurrency === 'XAF') {
    return amountFcfa;
  }
  if (displayCurrency === 'EUR') return amountFcfa / eur;
  if (displayCurrency === 'USD') return amountFcfa / usd;
  if (displayCurrency === 'GBP') return amountFcfa / gbp;
  if (displayCurrency === 'CHF') return amountFcfa / chf;
  if (displayCurrency === 'MAD') return amountFcfa / mad;
  if (displayCurrency === 'DZD') return amountFcfa / dzd;
  if (displayCurrency === 'GHS') return amountFcfa / ghs;
  if (displayCurrency === 'NGN') return amountFcfa * ngnPerFcfa;
  return amountFcfa / usd;
};

const countryToCurrency: Record<string, string> = {
  SN: 'XOF',
  CI: 'XOF',
  ML: 'XOF',
  BJ: 'XOF',
  BF: 'XOF',
  TG: 'XOF',
  NE: 'XOF',
  GN: 'XOF',
  FR: 'EUR',
  DE: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  BE: 'EUR',
  PT: 'EUR',
  NL: 'EUR',
  AT: 'EUR',
  IE: 'EUR',
  FI: 'EUR',
  LU: 'EUR',
  US: 'USD',
  CA: 'USD',
  GB: 'GBP',
  CH: 'CHF',
  MA: 'MAD',
  DZ: 'DZD',
  CM: 'XAF',
  CF: 'XAF',
  TD: 'XAF',
  CG: 'XAF',
  GA: 'XAF',
  GH: 'GHS',
  NG: 'NGN',
};

export const getDisplayCurrency = (countryCode: string): string => {
  const c = countryCode.trim().toUpperCase();
  return countryToCurrency[c] ?? 'USD';
};

const fractionDigits = (currency: string): number => {
  if (currency === 'XOF' || currency === 'XAF' || currency === 'JPY') return 0;
  return 2;
};

export type QuoteResult = {
  amountFcfa: number;
  countryCode: string;
  displayCurrency: string;
  localAmount: number;
  localAmountFormatted: string;
  disclaimer: string;
};

export const quoteForCountry = (amountFcfa: number, countryCode: string): QuoteResult => {
  const c = (countryCode || 'SN').trim().toUpperCase() || 'SN';
  if (!Number.isFinite(amountFcfa) || amountFcfa < 0) {
    throw new Error('Montant FCFA invalide.');
  }
  const displayCurrency = getDisplayCurrency(c);
  const value = localAmount(amountFcfa, displayCurrency);
  const fmt = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: displayCurrency,
    minimumFractionDigits: fractionDigits(displayCurrency),
    maximumFractionDigits: fractionDigits(displayCurrency),
  });
  return {
    amountFcfa: Math.round(amountFcfa),
    countryCode: c,
    displayCurrency,
    localAmount: Number.isFinite(value) ? value : 0,
    localAmountFormatted: fmt.format(value),
    disclaimer: 'Taux indicatifs ; le paiement est réglé en FCFA (XOF) côté PayDunya le cas échéant.',
  };
};
