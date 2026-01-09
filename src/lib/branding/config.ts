/**
 * Branding Configuration
 *
 * Bu dosya, projedeki tüm branding (logo, favicon, pwa icon) ayarlarını merkezi olarak yönetir.
 * Dosyalar sabit isimlerle public/branding/ klasörüne kaydedilir.
 * Bu sayede:
 * - Çift render sorunu ortadan kalkar
 * - API'den veri beklemeden dosyalar gösterilir
 * - Sunucu ve lokal ortamda aynı şekilde çalışır
 */

// Sabit branding dosya yolları
export const BRANDING_PATHS = {
  // Dizin yolu
  directory: '/branding',

  // Sabit dosya isimleri
  logo: '/branding/logo.png',
  logoLight: '/branding/logo-light.png',  // Light arka plan için KOYU renkli logo (açık zemin üzerinde görünsün)
  logoDark: '/branding/logo-dark.png',    // Dark arka plan için AÇIK renkli logo (koyu zemin üzerinde görünsün)
  favicon: '/branding/favicon.ico',
  pwaIcon: '/branding/pwa-icon.png',

  // Dosya sistemi yolları (public klasöründen göreceli)
  logoFile: 'branding/logo.png',
  logoLightFile: 'branding/logo-light.png',
  logoDarkFile: 'branding/logo-dark.png',
  faviconFile: 'branding/favicon.ico',
  pwaIconFile: 'branding/pwa-icon.png',
} as const;

// Varsayılan şirket adı (logo yoksa gösterilecek)
export const DEFAULT_COMPANY_NAME = '';

// Varsayılan alt başlık (logo yoksa gösterilecek)
export const DEFAULT_COMPANY_SUBTITLE = '';

// Varsayılan metadata
export const DEFAULT_META = {
  title: '',
  description: '',
};

/**
 * Branding dosyasının URL'sini oluşturur
 * Cache-busting için timestamp ekler
 */
export function getBrandingUrl(type: 'logo' | 'favicon' | 'pwaIcon'): string {
  const paths = {
    logo: BRANDING_PATHS.logo,
    favicon: BRANDING_PATHS.favicon,
    pwaIcon: BRANDING_PATHS.pwaIcon,
  };
  return paths[type];
}

/**
 * Branding dosyasının var olup olmadığını kontrol eder (client-side)
 */
export async function checkBrandingExists(type: 'logo' | 'favicon' | 'pwaIcon'): Promise<boolean> {
  try {
    const url = getBrandingUrl(type);
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
