import dotenv from 'dotenv';

dotenv.config();

/** Pays (ISO alpha-2) pour lesquels on utilise Dohone en priorité (CEMAC typique). */
export const getDohoneCountryCodes = (): Set<string> => {
  const raw = process.env.DOHONE_COUNTRY_CODES?.trim() || 'GA,TD,CF,CG,GQ';
  return new Set(
    raw
      .split(/[\s,;]+/u)
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean),
  );
};

/** Libellé pays pour le champ `country` de l’API Dohone (ex. doc fournisseur). */
export const dohoneCountryLabelFromIso = (code: string): string => {
  const c = code.trim().toUpperCase();
  const map: Record<string, string> = {
    GA: 'Gabon',
    TD: 'Tchad',
    CF: 'RCA',
    CG: 'Congo-Brazzaville',
    GQ: 'Guinée Équatoriale',
  };
  return map[c] ?? c;
};
