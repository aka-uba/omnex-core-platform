export const defaultLocale = 'tr';
export const locales = ['tr', 'en', 'de', 'ar'];
export const rtlLocales = ['ar'];

export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
    tr: 'Türkçe',
    en: 'English',
    de: 'Deutsch',
    ar: 'العربية',
};
