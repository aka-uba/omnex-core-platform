/**
 * Branding Configuration
 *
 * Bu dosya, projedeki tüm branding (logo, favicon, pwa icon) ayarlarını merkezi olarak yönetir.
 * Multi-tenant yapısı için her firma kendi dizinine sahiptir:
 * - /branding/default/ - Varsayılan dosyalar (yeni firmalar için fallback)
 * - /branding/{companyId}/ - Firma bazlı dosyalar
 */

// Branding dosya isimleri (sabit)
export const BRANDING_FILENAMES = {
  logo: 'logo.png',
  logoLight: 'logo-light.png',
  logoDark: 'logo-dark.png',
  favicon: 'favicon.ico',
  pwaIcon: 'pwa-icon.png',
} as const;

// Varsayılan branding dizini
export const DEFAULT_BRANDING_DIR = '/branding/default';

// Eski sabit yollar (geriye uyumluluk için)
// ÖNEMLİ: Bu sabitler artık kullanılmamalı, getCompanyBrandingPaths() kullanın
export const BRANDING_PATHS = {
  // Dizin yolu
  directory: '/branding',

  // Sabit dosya isimleri (varsayılan dizin)
  logo: `${DEFAULT_BRANDING_DIR}/${BRANDING_FILENAMES.logo}`,
  logoLight: `${DEFAULT_BRANDING_DIR}/${BRANDING_FILENAMES.logoLight}`,
  logoDark: `${DEFAULT_BRANDING_DIR}/${BRANDING_FILENAMES.logoDark}`,
  favicon: `${DEFAULT_BRANDING_DIR}/${BRANDING_FILENAMES.favicon}`,
  pwaIcon: `${DEFAULT_BRANDING_DIR}/${BRANDING_FILENAMES.pwaIcon}`,

  // Dosya sistemi yolları (public klasöründen göreceli)
  logoFile: `branding/default/${BRANDING_FILENAMES.logo}`,
  logoLightFile: `branding/default/${BRANDING_FILENAMES.logoLight}`,
  logoDarkFile: `branding/default/${BRANDING_FILENAMES.logoDark}`,
  faviconFile: `branding/default/${BRANDING_FILENAMES.favicon}`,
  pwaIconFile: `branding/default/${BRANDING_FILENAMES.pwaIcon}`,
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
 * Firma bazlı branding dizinini döndürür
 * @param companyId Firma ID
 * @returns Branding dizin yolu (örn: /branding/abc123)
 */
export function getCompanyBrandingDir(companyId: string | null | undefined): string {
  if (!companyId) {
    return DEFAULT_BRANDING_DIR;
  }
  return `/branding/${companyId}`;
}

/**
 * Firma bazlı branding dosya yollarını döndürür
 * @param companyId Firma ID (null ise varsayılan dizin kullanılır)
 * @returns Tüm branding dosyalarının yolları
 */
export function getCompanyBrandingPaths(companyId: string | null | undefined) {
  const dir = getCompanyBrandingDir(companyId);

  return {
    directory: dir,
    logo: `${dir}/${BRANDING_FILENAMES.logo}`,
    logoLight: `${dir}/${BRANDING_FILENAMES.logoLight}`,
    logoDark: `${dir}/${BRANDING_FILENAMES.logoDark}`,
    favicon: `${dir}/${BRANDING_FILENAMES.favicon}`,
    pwaIcon: `${dir}/${BRANDING_FILENAMES.pwaIcon}`,
  };
}

/**
 * Dosya sistemi yollarını döndürür (public klasöründen göreceli)
 * @param companyId Firma ID
 * @returns Dosya sistemi yolları
 */
export function getCompanyBrandingFilePaths(companyId: string | null | undefined) {
  const subDir = companyId ? companyId : 'default';

  return {
    logoFile: `branding/${subDir}/${BRANDING_FILENAMES.logo}`,
    logoLightFile: `branding/${subDir}/${BRANDING_FILENAMES.logoLight}`,
    logoDarkFile: `branding/${subDir}/${BRANDING_FILENAMES.logoDark}`,
    faviconFile: `branding/${subDir}/${BRANDING_FILENAMES.favicon}`,
    pwaIconFile: `branding/${subDir}/${BRANDING_FILENAMES.pwaIcon}`,
  };
}

/**
 * Branding dosyasının URL'sini oluşturur (firma bazlı)
 * @param type Dosya tipi
 * @param companyId Firma ID
 * @returns Dosya URL'i
 */
export function getBrandingUrl(
  type: 'logo' | 'logoLight' | 'logoDark' | 'favicon' | 'pwaIcon',
  companyId?: string | null
): string {
  const paths = getCompanyBrandingPaths(companyId);

  const urlMap: Record<string, string> = {
    logo: paths.logo,
    logoLight: paths.logoLight,
    logoDark: paths.logoDark,
    favicon: paths.favicon,
    pwaIcon: paths.pwaIcon,
  };

  return urlMap[type] || paths.logo;
}

/**
 * Branding dosyasının var olup olmadığını kontrol eder (client-side)
 * Önce firma dizinini kontrol eder, yoksa varsayılan dizine fallback yapar
 * @param type Dosya tipi
 * @param companyId Firma ID
 * @returns Dosya URL'i veya null
 */
export async function checkBrandingExists(
  type: 'logo' | 'logoLight' | 'logoDark' | 'favicon' | 'pwaIcon',
  companyId?: string | null
): Promise<string | null> {
  // Önce firma dizinini kontrol et
  if (companyId) {
    const companyUrl = getBrandingUrl(type, companyId);
    try {
      const response = await fetch(companyUrl, { method: 'HEAD' });
      if (response.ok) {
        return companyUrl;
      }
    } catch {
      // Firma dizininde yok, varsayılana geç
    }
  }

  // Varsayılan dizini kontrol et
  const defaultUrl = getBrandingUrl(type, null);
  try {
    const response = await fetch(defaultUrl, { method: 'HEAD' });
    if (response.ok) {
      return defaultUrl;
    }
  } catch {
    // Varsayılan dizinde de yok
  }

  return null;
}

/**
 * Tüm branding dosyalarının varlığını kontrol eder (fallback ile)
 * @param companyId Firma ID
 * @returns Her dosya için URL veya null
 */
export async function checkAllBrandingWithFallback(companyId?: string | null): Promise<{
  logo: string | null;
  logoLight: string | null;
  logoDark: string | null;
  favicon: string | null;
  pwaIcon: string | null;
}> {
  const [logo, logoLight, logoDark, favicon, pwaIcon] = await Promise.all([
    checkBrandingExists('logo', companyId),
    checkBrandingExists('logoLight', companyId),
    checkBrandingExists('logoDark', companyId),
    checkBrandingExists('favicon', companyId),
    checkBrandingExists('pwaIcon', companyId),
  ]);

  return { logo, logoLight, logoDark, favicon, pwaIcon };
}
