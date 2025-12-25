'use client';

import { useEffect, useRef } from 'react';
import { BRANDING_PATHS } from '@/lib/branding/config';
import { useCompany } from '@/context/CompanyContext';

/**
 * Dynamic Head Meta Component
 *
 * Sabit dosya yollarından favicon ve PWA icon ayarlar.
 * API'den veri beklemez, doğrudan dosya yollarını kullanır.
 * Bu sayede çift render sorunu ortadan kalkar.
 */
export function DynamicHeadMeta() {
  const { company } = useCompany();
  const initialized = useRef(false);

  useEffect(() => {
    // Sadece bir kez çalıştır
    if (initialized.current) return;
    initialized.current = true;

    // Sabit dosya yollarından favicon ayarla
    updateFavicon(BRANDING_PATHS.favicon);

    // PWA manifest oluştur
    updatePWAManifest(company?.name || '');
  }, []);

  // Firma adı değişirse title güncelle
  useEffect(() => {
    if (company?.name) {
      document.title = company.name;
    }
  }, [company?.name]);

  return null;
}

/**
 * Updates the favicon link element in the document head
 */
function updateFavicon(faviconUrl: string) {
  // Remove existing favicon links
  const existingFavicons = document.querySelectorAll("link[rel*='icon']");
  existingFavicons.forEach(el => el.remove());

  // Create new favicon links
  const link16 = document.createElement('link');
  link16.rel = 'icon';
  link16.type = 'image/png';
  link16.sizes = '16x16';
  link16.href = faviconUrl;
  document.head.appendChild(link16);

  const link32 = document.createElement('link');
  link32.rel = 'icon';
  link32.type = 'image/png';
  link32.sizes = '32x32';
  link32.href = faviconUrl;
  document.head.appendChild(link32);

  // Apple touch icon
  const appleTouchIcon = document.createElement('link');
  appleTouchIcon.rel = 'apple-touch-icon';
  appleTouchIcon.href = faviconUrl;
  document.head.appendChild(appleTouchIcon);
}

/**
 * Creates or updates a dynamic PWA manifest with branding icons
 * Sabit dosya yollarını kullanır - API'den veri beklemez
 */
function updatePWAManifest(companyName: string) {
  // Sabit branding dosya yollarını kullan
  const iconUrl = BRANDING_PATHS.pwaIcon;

  // Remove existing manifest link
  const existingManifest = document.querySelector("link[rel='manifest']");
  if (existingManifest) {
    existingManifest.remove();
  }

  // Create dynamic manifest - Omnex metinleri kullanma
  const manifest = {
    name: companyName || '',
    short_name: companyName || '',
    description: '',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#228be6',
    icons: [
      {
        src: iconUrl,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: iconUrl,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  };

  // Create blob URL for manifest
  const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
  const manifestUrl = URL.createObjectURL(manifestBlob);

  // Add manifest link
  const manifestLink = document.createElement('link');
  manifestLink.rel = 'manifest';
  manifestLink.href = manifestUrl;
  document.head.appendChild(manifestLink);

  // Update theme-color meta tag
  let themeColorMeta = document.querySelector("meta[name='theme-color']") as HTMLMetaElement;
  if (!themeColorMeta) {
    themeColorMeta = document.createElement('meta');
    themeColorMeta.name = 'theme-color';
    document.head.appendChild(themeColorMeta);
  }
  themeColorMeta.content = '#228be6';

  // Add Apple mobile web app meta tags
  let appleCapableMeta = document.querySelector("meta[name='apple-mobile-web-app-capable']");
  if (!appleCapableMeta) {
    appleCapableMeta = document.createElement('meta');
    (appleCapableMeta as HTMLMetaElement).name = 'apple-mobile-web-app-capable';
    (appleCapableMeta as HTMLMetaElement).content = 'yes';
    document.head.appendChild(appleCapableMeta);
  }

  let appleStatusBarMeta = document.querySelector("meta[name='apple-mobile-web-app-status-bar-style']");
  if (!appleStatusBarMeta) {
    appleStatusBarMeta = document.createElement('meta');
    (appleStatusBarMeta as HTMLMetaElement).name = 'apple-mobile-web-app-status-bar-style';
    (appleStatusBarMeta as HTMLMetaElement).content = 'default';
    document.head.appendChild(appleStatusBarMeta);
  }

  let appleTitleMeta = document.querySelector("meta[name='apple-mobile-web-app-title']");
  if (!appleTitleMeta) {
    appleTitleMeta = document.createElement('meta');
    (appleTitleMeta as HTMLMetaElement).name = 'apple-mobile-web-app-title';
    (appleTitleMeta as HTMLMetaElement).content = companyName || '';
    document.head.appendChild(appleTitleMeta);
  }
}
