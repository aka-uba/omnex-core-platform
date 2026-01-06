'use client';

import { useCompany } from '@/context/CompanyContext';
import { getCurrencyLocale, DEFAULT_CURRENCY, SUPPORTED_CURRENCIES, CURRENCY_SELECT_OPTIONS } from '@/lib/constants/currency';

/**
 * useCurrency Hook
 *
 * CompanyContext'ten para birimi bilgilerini çeker.
 * Tüm para birimi formatlama işlemleri için bu hook kullanılmalıdır.
 *
 * @example
 * ```tsx
 * const { currency, formatCurrency, formatAmount } = useCurrency();
 *
 * // Tam formatlama (sembol ile)
 * formatCurrency(1500.50) // "₺1.500,50" veya "$1,500.50" (ayara göre)
 *
 * // Sadece sayı formatlama (sembol olmadan)
 * formatAmount(1500.50) // "1.500,50" veya "1,500.50" (locale'e göre)
 *
 * // Form default değeri için
 * <Select defaultValue={currency} ... />
 * ```
 */
export function useCurrency() {
  const { currency: companyCurrency, settings, loading } = useCompany();

  // Güvenli currency değeri (context yüklenmemişse DEFAULT_CURRENCY kullan)
  const currency = companyCurrency || DEFAULT_CURRENCY;

  // Güvenli locale değeri
  const locale = getCurrencyLocale(currency);

  /**
   * Para birimi ile formatlama (sembol dahil)
   * @param amount - Formatlanacak miktar
   * @param overrideCurrency - Farklı para birimi kullanmak için (opsiyonel)
   */
  const formatCurrency = (amount: number, overrideCurrency?: string): string => {
    const currencyCode = overrideCurrency || currency;
    const currencyLocale = getCurrencyLocale(currencyCode);

    try {
      return new Intl.NumberFormat(currencyLocale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      // Fallback
      return `${amount.toFixed(2)} ${currencyCode}`;
    }
  };

  /**
   * Sadece sayı formatlama (para birimi sembolü olmadan)
   * @param amount - Formatlanacak miktar
   */
  const formatAmount = (amount: number): string => {
    try {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return amount.toFixed(2);
    }
  };

  /**
   * Kısa format (büyük sayılar için: 1.5M, 2.3K)
   * @param amount - Formatlanacak miktar
   */
  const formatCompact = (amount: number): string => {
    try {
      return new Intl.NumberFormat(locale, {
        notation: 'compact',
        compactDisplay: 'short',
      }).format(amount);
    } catch {
      return amount.toString();
    }
  };

  /**
   * Kısa format para birimi ile
   * @param amount - Formatlanacak miktar
   */
  const formatCurrencyCompact = (amount: number): string => {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        notation: 'compact',
        compactDisplay: 'short',
      }).format(amount);
    } catch {
      return `${formatCompact(amount)} ${currency}`;
    }
  };

  return {
    // Mevcut para birimi kodu
    currency,

    // Mevcut locale
    locale,

    // Tüm ayarlar (ihtiyaç halinde)
    settings,

    // Loading durumu
    loading,

    // Formatlama fonksiyonları
    formatCurrency,
    formatAmount,
    formatCompact,
    formatCurrencyCompact,

    // Form select options
    currencyOptions: CURRENCY_SELECT_OPTIONS,
    supportedCurrencies: SUPPORTED_CURRENCIES,
  };
}

export default useCurrency;
