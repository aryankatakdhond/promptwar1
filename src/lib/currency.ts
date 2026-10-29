import type { CurrencyCode } from '@/types/event';

const CURRENCY_CONFIG: Record<CurrencyCode, { symbol: string; locale: string; decimals: number }> = {
  INR: { symbol: '₹', locale: 'en-IN', decimals: 0 },
  USD: { symbol: '$', locale: 'en-US', decimals: 0 },
  EUR: { symbol: '€', locale: 'de-DE', decimals: 0 },
  GBP: { symbol: '£', locale: 'en-GB', decimals: 0 },
  AED: { symbol: 'AED ', locale: 'ar-AE', decimals: 0 },
  SGD: { symbol: 'S$', locale: 'en-SG', decimals: 0 },
};

export const CURRENCY_CODES: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];

export function formatCurrency(amount: number, code: CurrencyCode = 'INR'): string {
  const config = CURRENCY_CONFIG[code];
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    }).format(amount);
  } catch {
    // Fallback for environments that don't support all locales
    const formatted = Math.round(amount).toLocaleString();
    return `${config.symbol}${formatted}`;
  }
}

export function parseCurrency(value: string): number {
  // Strip everything except digits, minus sign, and decimal point
  const cleaned = value
    .replace(/[^0-9.\-]/g, '')
    .trim();

  if (cleaned === '' || cleaned === '-') return 0;

  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;

  // Return as integer (whole currency units)
  return Math.round(parsed);
}
