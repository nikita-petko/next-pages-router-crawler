import type { Locale } from '@rbx/intl';

const COUNTRY_TO_CURRENCY: Readonly<Record<string, string>> = {
  // Eurozone
  AT: 'EUR',
  BE: 'EUR',
  BG: 'EUR',
  HR: 'EUR',
  CY: 'EUR',
  EE: 'EUR',
  FI: 'EUR',
  FR: 'EUR',
  DE: 'EUR',
  GR: 'EUR',
  IE: 'EUR',
  IT: 'EUR',
  LV: 'EUR',
  LT: 'EUR',
  LU: 'EUR',
  MT: 'EUR',
  NL: 'EUR',
  PT: 'EUR',
  SK: 'EUR',
  SI: 'EUR',
  ES: 'EUR',
  // Non-euro EU
  CZ: 'CZK',
  DK: 'DKK',
  HU: 'HUF',
  PL: 'PLN',
  RO: 'RON',
  SE: 'SEK',
  // Rest of Europe / EEA
  GB: 'GBP',
  NO: 'NOK',
  CH: 'CHF',
  LI: 'CHF',
  IS: 'ISK',
  // Americas
  US: 'USD',
  CA: 'CAD',
  BR: 'BRL',
  MX: 'MXN',
  AR: 'ARS',
  CL: 'CLP',
  CO: 'COP',
  // Asia-Pacific
  AU: 'AUD',
  NZ: 'NZD',
  JP: 'JPY',
  KR: 'KRW',
  CN: 'CNY',
  HK: 'HKD',
  TW: 'TWD',
  SG: 'SGD',
  IN: 'INR',
  TH: 'THB',
  MY: 'MYR',
  ID: 'IDR',
  PH: 'PHP',
  VN: 'VND',
  // Middle East / Africa
  AE: 'AED',
  SA: 'SAR',
  IL: 'ILS',
  TR: 'TRY',
  ZA: 'ZAR',
};

export function getCurrencyCodeForCountry(country?: string | null): string | null {
  if (!country) {
    return null;
  }
  return COUNTRY_TO_CURRENCY[country.toUpperCase()] ?? null;
}

export type LocalCurrencyMode = 'convert' | 'none';

export type LocalCurrencyDisplay = {
  mode: LocalCurrencyMode;
  currencyCode: string | null;
};

const CONVERT_CURRENCY_COUNTRIES: ReadonlySet<string> = new Set(['GB', 'MY']);

const CA_CONVERT_PROVINCES: ReadonlySet<string> = new Set([
  'BC',
  'BRITISH COLUMBIA',
  'SK',
  'SASKATCHEWAN',
]);

export function getLocalCurrencyDisplay(
  country?: string | null,
  state?: string | null,
): LocalCurrencyDisplay {
  const currencyCode = getCurrencyCodeForCountry(country);
  if (!country || !currencyCode) {
    return { mode: 'none', currencyCode: null };
  }

  const upperCountry = country.toUpperCase();
  if (CONVERT_CURRENCY_COUNTRIES.has(upperCountry)) {
    return { mode: 'convert', currencyCode };
  }
  if (upperCountry === 'CA') {
    const upperState = state?.trim().toUpperCase() ?? '';
    if (CA_CONVERT_PROVINCES.has(upperState)) {
      return { mode: 'convert', currencyCode };
    }
    return { mode: 'none', currencyCode: null };
  }

  return { mode: 'none', currencyCode: null };
}

// RST is Manitoba-specific; Stripe returns `rst` (not `pst`) for Manitoba.
export type TaxLabel = 'VAT' | 'GST' | 'HST' | 'GST + PST' | 'GST + RST' | 'GST + QST';

const VAT_NOTE_COUNTRIES: ReadonlySet<string> = new Set(['GB', 'KR', 'PE', 'CL', 'MY']);

const CA_PROVINCE_TAX_LABEL: Readonly<Record<string, TaxLabel>> = {
  BC: 'GST + PST',
  'BRITISH COLUMBIA': 'GST + PST',
  SK: 'GST + PST',
  SASKATCHEWAN: 'GST + PST',
  MB: 'GST + RST',
  MANITOBA: 'GST + RST',
  QC: 'GST + QST',
  QUEBEC: 'GST + QST',
  QUÉBEC: 'GST + QST',
  ON: 'HST',
  ONTARIO: 'HST',
  NS: 'HST',
  'NOVA SCOTIA': 'HST',
  NB: 'HST',
  'NEW BRUNSWICK': 'HST',
  PE: 'HST',
  'PRINCE EDWARD ISLAND': 'HST',
  NL: 'HST',
  'NEWFOUNDLAND AND LABRADOR': 'HST',
  NEWFOUNDLAND: 'HST',
  AB: 'GST',
  ALBERTA: 'GST',
  YT: 'GST',
  YUKON: 'GST',
  NT: 'GST',
  'NORTHWEST TERRITORIES': 'GST',
  NU: 'GST',
  NUNAVUT: 'GST',
};

export function getTaxNote(country?: string | null, state?: string | null): TaxLabel | null {
  if (!country) {
    return null;
  }

  const upperCountry = country.toUpperCase();
  if (VAT_NOTE_COUNTRIES.has(upperCountry)) {
    return 'VAT';
  }

  if (upperCountry === 'CA') {
    const upperState = state?.trim().toUpperCase() ?? '';
    return CA_PROVINCE_TAX_LABEL[upperState] ?? null;
  }

  return null;
}

export function formatLocalCurrency(
  amount: number,
  currencyCode: string,
  locale: Locale | null,
): string | null {
  try {
    return new Intl.NumberFormat(locale ?? undefined, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch {
    return null;
  }
}
