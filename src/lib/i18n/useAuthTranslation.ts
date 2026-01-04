'use client';

import { useState, useEffect, useCallback } from 'react';
import { Locale, defaultLocale, locales } from './config';

// Import all auth translations statically
import trTranslations from '@/locales/auth/tr.json';
import enTranslations from '@/locales/auth/en.json';
import deTranslations from '@/locales/auth/de.json';
import arTranslations from '@/locales/auth/ar.json';

type TranslationObject = Record<string, any>;

// Static translation map
const translationsMap: Record<Locale, TranslationObject> = {
  tr: trTranslations,
  en: enTranslations,
  de: deTranslations,
  ar: arTranslations,
};

/**
 * Hook for auth pages that don't have locale in URL
 * Uses localStorage 'preferred-locale' for language selection
 */
export function useAuthTranslation() {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Get saved locale from localStorage
    const savedLocale = localStorage.getItem('preferred-locale') as Locale;
    if (savedLocale && locales.includes(savedLocale)) {
      setLocaleState(savedLocale);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    console.log('[useAuthTranslation] setLocale called with:', newLocale);
    console.log('[useAuthTranslation] Available locales:', locales);
    console.log('[useAuthTranslation] Is valid locale:', locales.includes(newLocale));
    if (locales.includes(newLocale)) {
      console.log('[useAuthTranslation] Setting locale state to:', newLocale);
      setLocaleState(newLocale);
      localStorage.setItem('preferred-locale', newLocale);
      console.log('[useAuthTranslation] localStorage updated');
    }
  }, []);

  const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
    if (!key) return '';

    const translations = translationsMap[locale] || translationsMap[defaultLocale];
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
  }, [locale]);

  return { t, locale, setLocale, mounted };
}
