/**
 * Utility functions for formatting values
 */

import { getCurrencyLocale, DEFAULT_CURRENCY } from '@/lib/constants/currency';

/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param currency - The currency code (default: from constants)
 * @param locale - The locale for formatting (auto-detected from currency if not provided)
 *
 * @note Prefer using `useCurrency().formatCurrency()` in React components
 * as it automatically reads the currency from GeneralSettings.
 * This utility is for non-React contexts (API routes, utilities, etc.)
 */
export function formatCurrency(
    amount: number,
    currency: string = DEFAULT_CURRENCY,
    locale?: string
): string {
    const currencyLocale = locale || getCurrencyLocale(currency);
    try {
        return new Intl.NumberFormat(currencyLocale, {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        // Fallback for invalid currency codes
        return `${amount.toFixed(2)} ${currency}`;
    }
}

/**
 * Format a number with thousand separators
 * @param value - The number to format
 * @param locale - The locale for formatting (default: tr-TR)
 */
export function formatNumber(value: number, locale: string = 'tr-TR'): string {
    return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format a date
 * @param date - The date to format
 * @param locale - The locale for formatting (default: tr-TR)
 * @param options - Intl.DateTimeFormat options
 */
export function formatDate(
    date: Date | string,
    locale: string = 'tr-TR',
    options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * Format bytes to human readable string
 * @param bytes - The number of bytes
 * @param decimals - Number of decimal places (default: 2)
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
