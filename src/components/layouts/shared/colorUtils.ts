/**
 * Color Utilities
 * Arka plan rengine göre otomatik text/icon renk hesaplama
 * Sadece light mode için kullanılır
 */

/**
 * Hex renk kodunu RGB'ye çevir
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result && result[1] && result[2] && result[3]
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}


/**
 * Renk kodunu normalize et (hex veya rgb)
 */
function normalizeColor(color: string): { r: number; g: number; b: number } | null {
  // Hex renk
  if (color.startsWith('#')) {
    return hexToRgb(color);
  }

  // RGB renk
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch && rgbMatch[1] && rgbMatch[2] && rgbMatch[3]) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  // CSS variable (basit kontrol)
  if (color.startsWith('var(')) {
    // CSS variable'lar için varsayılan değer döndür
    return null;
  }

  return null;
}

/**
 * Luminance hesapla (WCAG standardı)
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * (rs ?? 0) + 0.7152 * (gs ?? 0) + 0.0722 * (bs ?? 0);
}

/**
 * Arka plan rengine göre uygun text rengini belirle
 * @param backgroundColor Arka plan rengi (hex veya rgb)
 * @returns Açık veya koyu text rengi
 */
export function getContrastTextColor(backgroundColor: string): string {
  const rgb = normalizeColor(backgroundColor);
  if (!rgb) {
    // Varsayılan: koyu text
    return '#212529';
  }

  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  
  // Luminance 0.5'ten büyükse açık arka plan (koyu text)
  // Luminance 0.5'ten küçükse koyu arka plan (açık text)
  return luminance > 0.5 ? '#212529' : '#ffffff';
}

/**
 * Arka plan rengine göre uygun icon rengini belirle
 * @param backgroundColor Arka plan rengi
 * @returns Icon rengi
 */
export function getContrastIconColor(backgroundColor: string): string {
  return getContrastTextColor(backgroundColor);
}

/**
 * Arka plan rengine göre uygun placeholder rengini belirle
 * @param backgroundColor Arka plan rengi
 * @param isDark Arka plan koyu mu?
 * @returns Placeholder rengi (daha soluk)
 */
export function getPlaceholderColor(backgroundColor: string, isDark: boolean): string {
  const rgb = normalizeColor(backgroundColor);
  if (!rgb) {
    return isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
  }

  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  
  if (luminance > 0.5) {
    // Açık arka plan - koyu placeholder (daha soluk)
    return 'rgba(0, 0, 0, 0.5)';
  } else {
    // Koyu arka plan - açık placeholder (daha soluk)
    return 'rgba(255, 255, 255, 0.5)';
  }
}

/**
 * Arka plan rengine göre hover arka plan rengini hesapla
 * @param backgroundColor Arka plan rengi
 * @param isDark Arka plan koyu mu?
 * @returns Hover arka plan rengi (rgba)
 */
export function getHoverBackgroundColor(
  backgroundColor: string,
  isDark: boolean
): string {
  const rgb = normalizeColor(backgroundColor);
  if (!rgb) {
    return isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  }

  if (isDark) {
    // Koyu arka plan için açık hover (daha belirgin)
    return 'rgba(255, 255, 255, 0.2)';
  } else {
    // Açık arka plan için koyu hover (daha belirgin)
    return 'rgba(0, 0, 0, 0.15)';
  }
}

/**
 * Arka plan rengine göre active arka plan rengini hesapla
 * @param backgroundColor Arka plan rengi
 * @param isDark Arka plan koyu mu?
 * @returns Active arka plan rengi (rgba)
 */
export function getActiveBackgroundColor(
  backgroundColor: string,
  isDark: boolean
): string {
  const rgb = normalizeColor(backgroundColor);
  if (!rgb) {
    return isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)';
  }

  if (isDark) {
    return 'rgba(255, 255, 255, 0.2)';
  } else {
    return 'rgba(0, 0, 0, 0.15)';
  }
}

/**
 * Arka plan rengine göre border rengini hesapla
 * @param backgroundColor Arka plan rengi
 * @param isDark Arka plan koyu mu?
 * @returns Border rengi
 */
export function getContrastBorderColor(
  backgroundColor: string,
  isDark: boolean
): string {
  const rgb = normalizeColor(backgroundColor);
  if (!rgb) {
    return isDark ? '#5f6368' : '#dee2e6';
  }

  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  
  if (luminance > 0.5) {
    // Açık arka plan - koyu border
    return 'rgba(0, 0, 0, 0.15)';
  } else {
    // Koyu arka plan - açık border
    return 'rgba(255, 255, 255, 0.2)';
  }
}

/**
 * Background type'a göre gerçek renk kodunu al
 */
export function getBackgroundColor(
  backgroundType: 'light' | 'dark' | 'brand' | 'gradient' | 'custom',
  customColor?: string
): string {
  switch (backgroundType) {
    case 'dark':
      return '#1f2937'; // Koyu arka plan rengi (sidebar ve top bar için)
    case 'brand':
      return '#228be6'; // var(--color-primary-600)
    case 'gradient':
      return 'transparent';
    case 'custom':
      return customColor || '#ffffff';
    case 'light':
    default:
      return '#ffffff';
  }
}

/**
 * Dark background için menü alanı arka plan rengini hesapla (Chrome dark mode tarzı)
 * Ana sidebar: #303134, Menü alanı: #202124 (biraz daha koyu)
 */
export function getMenuAreaBackgroundColor(backgroundColor: string): string {
  const rgb = normalizeColor(backgroundColor);
  if (!rgb) {
    return '#202124'; // --bg-primary-dark (varsayılan)
  }

  // Eğer dark background ise (#303134 gibi), menü alanı için daha koyu ton kullan
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  if (luminance <= 0.5) {
    // Dark background için menü alanı daha koyu (Chrome dark mode tarzı)
    // Ana: #303134 -> Menü: #202124
    return '#202124'; // --bg-primary-dark
  }
  
  // Light background için aynı rengi kullan
  return backgroundColor;
}

/**
 * Arka plan renginin koyu olup olmadığını kontrol et
 */
export function isDarkBackground(backgroundColor: string): boolean {
  const rgb = normalizeColor(backgroundColor);
  if (!rgb) {
    return false;
  }
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance <= 0.5;
}

/**
 * Focus durumu için border rengine göre box-shadow ve border-color hesapla
 * Kenar çizgi rengini baz alarak uyumlu bir focus efekti oluşturur
 */
export function getFocusStyles(borderColor: string): {
  boxShadow: string;
  borderColor: string;
} {
  const rgb = normalizeColor(borderColor);
  if (!rgb) {
    // Varsayılan mavi ton
    return {
      boxShadow: '0 0 0 2px rgba(13, 127, 242, 0.5)',
      borderColor: '#0d7ff2',
    };
  }

  // Border renginin luminance'ını hesapla
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  const isDark = luminance <= 0.5;

  if (isDark) {
    // Koyu border için daha açık ton kullan
    const lighterR = Math.min(255, rgb.r + 40);
    const lighterG = Math.min(255, rgb.g + 40);
    const lighterB = Math.min(255, rgb.b + 40);
    return {
      boxShadow: `0 0 0 2px rgba(${lighterR}, ${lighterG}, ${lighterB}, 0.5)`,
      borderColor: `rgb(${lighterR}, ${lighterG}, ${lighterB})`,
    };
  } else {
    // Açık border için daha koyu ton kullan
    const darkerR = Math.max(0, rgb.r - 40);
    const darkerG = Math.max(0, rgb.g - 40);
    const darkerB = Math.max(0, rgb.b - 40);
    return {
      boxShadow: `0 0 0 2px rgba(${darkerR}, ${darkerG}, ${darkerB}, 0.5)`,
      borderColor: `rgb(${darkerR}, ${darkerG}, ${darkerB})`,
    };
  }
}

