import { Locale, defaultLocale } from './config';

const dictionaries: Record<Locale, () => Promise<any>> = {
    tr: () => import('@/locales/global/tr.json').then((module) => module.default),
    en: () => import('@/locales/global/en.json').then((module) => module.default),
    de: () => import('@/locales/global/de.json').then((module) => module.default),
    ar: () => import('@/locales/global/ar.json').then((module) => module.default),
};

export const getDictionary = async (locale: Locale) => {
    const fn = dictionaries[locale] || dictionaries[defaultLocale];
    if (fn && typeof fn === 'function') {
        return fn();
    }
    const defaultFn = dictionaries[defaultLocale];
    if (defaultFn && typeof defaultFn === 'function') {
        return defaultFn();
    }
    return {};
};

export const getServerTranslation = async (locale: Locale, namespace: string = 'global') => {
    const dict = await getDictionary(locale);
    // Simple implementation: currently only supports global namespace structure
    // In a real app, you'd merge module-specific dictionaries here

    const t = (key: string, params?: Record<string, string | number>) => {
        const keys = key.split('.');
        let value = dict;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key; // Fallback to key if not found
            }
        }

        if (typeof value !== 'string') return key;

        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                value = value.replace(`{${k}}`, String(v));
            });
        }

        return value;
    };

    return { t };
};
