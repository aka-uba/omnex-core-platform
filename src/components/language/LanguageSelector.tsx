'use client';

import { Menu } from '@mantine/core';
import { usePathname, useRouter } from 'next/navigation';
import { locales, localeNames, rtlLocales, type Locale } from '@/lib/i18n/config';
import { FlagIcon } from './FlagIcon';
import styles from './LanguageSelector.module.css';
import { useTheme } from '@/context/ThemeContext';

interface LanguageSelectorProps {
  size?: number;
}

export function LanguageSelector({ size = 20 }: LanguageSelectorProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { setDirection } = useTheme();
  
  // Mevcut locale'i pathname'den al
  const currentLocale = (pathname?.split('/')[1] as Locale) || 'tr';
  
  // Dil değiştirme fonksiyonu
  const changeLanguage = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    // Yeni locale'e göre direction'ı hesapla ve güncelle
    const isRTL = rtlLocales.includes(newLocale);
    const newDirection = isRTL ? 'rtl' : 'ltr';
    setDirection(newDirection);

    // Pathname'den mevcut locale'i çıkar ve yeni locale ile değiştir
    const pathWithoutLocale = pathname?.replace(`/${currentLocale}`, '') || '';
    const newPath = `/${newLocale}${pathWithoutLocale || ''}`;

    // Hard navigation to ensure all components reload with new locale
    window.location.href = newPath;
  };

  return (
    <Menu shadow="md" width={200} position="bottom-end">
      <Menu.Target>
        <button
          className={styles.languageSelectorButton}
          aria-label="Change language"
        >
          <FlagIcon locale={currentLocale} size={size} {...(styles.languageSelectorIcon ? { className: styles.languageSelectorIcon } : {})} />
        </button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Dil Seçin / Select Language</Menu.Label>
        {locales.map((locale) => (
          <Menu.Item
            key={locale}
            leftSection={<FlagIcon locale={locale} size={16} {...(styles.languageFlag ? { className: styles.languageFlag } : {})} />}
            onClick={() => changeLanguage(locale)}
            {...((currentLocale === locale ? styles.languageMenuItemActive : styles.languageMenuItem) ? { className: (currentLocale === locale ? styles.languageMenuItemActive : styles.languageMenuItem) } : {})}
          >
            {localeNames[locale]}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

