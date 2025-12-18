'use client';

import { useState } from 'react';
import { type Locale } from '@/lib/i18n/config';

interface FlagIconProps {
  locale: Locale;
  size?: number;
  className?: string;
  showLabel?: boolean; // Dil kısaltmasını göster
}

// Bayrak resim dosya yolları - public/assets/images/flags klasöründeki bayrakları kullan
const flagImagesJpg: Record<Locale, string> = {
  tr: '/assets/images/flags/turkey.jpg', // Türkiye
  en: '/assets/images/flags/us.jpg', // ABD (İngilizce)
  de: '/assets/images/flags/germany.jpg', // Almanya
  ar: '/assets/images/flags/saudi.jpg', // Suudi Arabistan
};

// SVG fallback yolları (JPG yoksa kullanılacak)
const flagImagesSvg: Record<Locale, string> = {
  tr: '/flags/tr.svg', // Türkiye SVG
  en: '/flags/en.svg', // İngiltere SVG  
  de: '/flags/de.svg', // Almanya SVG
  ar: '/flags/ar.svg', // Suudi Arabistan SVG
};

// Fallback emojiler
const flagEmojis: Record<Locale, string> = {
  tr: '🇹🇷',
  en: '🇬🇧',
  de: '🇩🇪',
  ar: '🇸🇦',
};

// Dil kısaltma isimleri
const localeLabels: Record<Locale, string> = {
  tr: 'TR',
  en: 'EN',
  de: 'DE',
  ar: 'AR',
};

export function FlagIcon({ locale, size = 20, className, showLabel = false }: FlagIconProps) {
  const [imageError, setImageError] = useState(false);
  const [useSvg, setUseSvg] = useState(false);
  // Önce JPG dene, yoksa SVG kullan
  const flagPath = useSvg ? flagImagesSvg[locale] : flagImagesJpg[locale];
  const fallbackEmoji = flagEmojis[locale] || '🌐';
  
  return (
    <span 
      className={className}
      style={{ 
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: showLabel ? '0.25rem' : '0',
      }}
      role="img"
      aria-label={`${locale} flag`}
    >
      {!imageError ? (
        <img
          src={flagPath}
          alt={`${locale} flag`}
          style={{
            width: `${size * 1.5}px`,
            height: `${size}px`,
            minWidth: `${size * 1.5}px`,
            minHeight: `${size}px`,
            maxWidth: `${size * 1.5}px`,
            maxHeight: `${size}px`,
            aspectRatio: '3/2',
            objectFit: 'contain',
            borderRadius: '2px',
            display: 'block',
            flexShrink: 0,
          }}
          onError={() => {
            // JPG yüklenemezse SVG'yi dene
            if (!useSvg) {
              setUseSvg(true);
            } else {
              // SVG de yüklenemezse emoji göster
              setImageError(true);
            }
          }}
        />
      ) : (
        <span style={{ fontSize: `${size}px`, lineHeight: 1 }}>
          {fallbackEmoji}
        </span>
      )}
      {showLabel && (
        <span style={{ fontSize: `${size * 0.7}px`, fontWeight: 500 }}>
          {localeLabels[locale]}
        </span>
      )}
    </span>
  );
}

