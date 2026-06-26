/**
 * Maps common ISO 4217 currency codes to their display symbols. The create
 * form only requires a currency *code*; the display symbol used in the detail
 * view is derived here. Unknown codes fall back to the code itself, so the
 * value is always meaningful.
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  AUD: 'AU$',
  USD: 'US$',
  GBP: '£',
  EUR: '€',
  NZD: 'NZ$',
  SGD: 'S$',
  INR: '₹',
  JPY: '¥',
  CAD: 'CA$',
};

export function getCurrencySymbol(currencyCode: string): string {
  const code = currencyCode.toUpperCase();
  return CURRENCY_SYMBOLS[code] ?? code;
}
