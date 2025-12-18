/**
 * Locale-aware date formatting utilities
 */

export function getDateFormat(locale: string): string {
  const formatMap: Record<string, string> = {
    tr: 'DD.MM.YYYY',
    en: 'MM/DD/YYYY',
    de: 'DD.MM.YYYY',
    ar: 'DD/MM/YYYY',
  };
  return formatMap[locale] || 'DD.MM.YYYY';
}

export function getDateTimeFormat(locale: string): string {
  const formatMap: Record<string, string> = {
    tr: 'DD.MM.YYYY HH:mm',
    en: 'MM/DD/YYYY HH:mm',
    de: 'DD.MM.YYYY HH:mm',
    ar: 'DD/MM/YYYY HH:mm',
  };
  return formatMap[locale] || 'DD.MM.YYYY HH:mm';
}

export function getDateLocale(locale: string): string {
  const localeMap: Record<string, string> = {
    tr: 'tr-TR',
    en: 'en-US',
    de: 'de-DE',
    ar: 'ar-SA',
  };
  return localeMap[locale] || 'tr-TR';
}







