'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Locale, defaultLocale } from './config';

type TranslationObject = Record<string, any>;

// Cache for loaded translations - disabled in dev mode to ensure fresh translations
const translationCache: Record<string, TranslationObject> = {};
const isDev = process.env.NODE_ENV === 'development';

function loadTranslation(namespace: string, locale: Locale): TranslationObject {
    const cacheKey = `${namespace}:${locale}`;

    // Return cached translation if available (skip cache in dev mode)
    if (!isDev && translationCache[cacheKey]) {
        return translationCache[cacheKey];
    }

    try {
        // Use require to load translation file (works in Next.js with proper webpack config)
        // Translation files should be in src/locales/{namespace}/{locale}.json
        let translationModule: any;
        
        try {
            translationModule = require(`@/locales/${namespace}/${locale}.json`);
        } catch {
            // Fallback to default locale
            if (locale !== defaultLocale) {
                try {
                    translationModule = require(`@/locales/${namespace}/${defaultLocale}.json`);
                } catch {
                    return {};
                }
            } else {
                return {};
            }
        }
        
        const translations = translationModule.default || translationModule;
        translationCache[cacheKey] = translations;
        return translations;
    } catch (error) {
        return {};
    }
}

export function useTranslation(namespace: string = 'global') {
    const params = useParams();
    const locale = (params?.locale as Locale) || defaultLocale;

    const translations = useMemo(() => {
        return loadTranslation(namespace, locale);
    }, [namespace, locale]);

    const t = (key: string, replacements?: Record<string, string | number>): string => {
        if (!key) return '';
        
        // Try to translate even if key doesn't contain a dot
        const keys = key.includes('.') ? key.split('.') : [key];
        let value: any = translations;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Return key if translation not found
                return key;
            }
        }

        let translatedString = typeof value === 'string' ? value : key;

        // Apply replacements
        if (replacements) {
            for (const placeholder in replacements) {
                translatedString = translatedString.replace(
                    new RegExp(`{{${placeholder}}}`, 'g'),
                    String(replacements[placeholder])
                );
            }
        }

        return translatedString;
    };

    return { t, locale };
}
