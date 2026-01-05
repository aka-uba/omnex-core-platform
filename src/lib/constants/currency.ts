/**
 * Currency Constants
 * Merkezi para birimi sabitleri - tüm sistemde kullanılır
 */

export interface CurrencyOption {
  value: string;
  label: string;
  symbol: string;
  locale: string;
}

/**
 * Desteklenen para birimleri
 * GeneralSettings'te kullanılan tüm para birimleri burada tanımlı olmalı
 */
export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { value: 'TRY', label: 'TRY - Türk Lirası', symbol: '₺', locale: 'tr-TR' },
  { value: 'USD', label: 'USD - US Dollar', symbol: '$', locale: 'en-US' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€', locale: 'de-DE' },
  { value: 'GBP', label: 'GBP - British Pound', symbol: '£', locale: 'en-GB' },
  { value: 'JPY', label: 'JPY - Japanese Yen', symbol: '¥', locale: 'ja-JP' },
  { value: 'CNY', label: 'CNY - Chinese Yuan', symbol: '¥', locale: 'zh-CN' },
  { value: 'SAR', label: 'SAR - Saudi Riyal', symbol: '﷼', locale: 'ar-SA' },
];

/**
 * Para birimi kodlarından locale mapping
 */
export const CURRENCY_LOCALES: Record<string, string> = {
  TRY: 'tr-TR',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
  CNY: 'zh-CN',
  SAR: 'ar-SA',
};

/**
 * Varsayılan para birimi
 */
export const DEFAULT_CURRENCY = 'TRY';

/**
 * Form select için basit options (value/label)
 */
export const CURRENCY_SELECT_OPTIONS = SUPPORTED_CURRENCIES.map(c => ({
  value: c.value,
  label: c.label,
}));

/**
 * Form select için sadece kod options
 */
export const CURRENCY_CODE_OPTIONS = SUPPORTED_CURRENCIES.map(c => c.value);

/**
 * Para birimi bilgisi getir
 */
export function getCurrencyInfo(code: string): CurrencyOption | undefined {
  return SUPPORTED_CURRENCIES.find(c => c.value === code);
}

/**
 * Para birimi için locale getir
 */
export function getCurrencyLocale(code: string): string {
  return CURRENCY_LOCALES[code] || 'tr-TR';
}

/**
 * Para birimi sembolü getir
 */
export function getCurrencySymbol(code: string): string {
  const currency = getCurrencyInfo(code);
  return currency?.symbol || code;
}
