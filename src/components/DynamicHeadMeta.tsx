'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';

interface CompanyMeta {
  name: string;
  favicon?: string | null;
  pwaIcon?: string | null;
  logo?: string | null;
}

/**
 * Dynamic Head Meta Component
 *
 * Dynamically sets favicon and PWA manifest based on company settings.
 * This component injects favicon and PWA icons after the page loads
 * by fetching company data from the API.
 */
export function DynamicHeadMeta() {
  const [company, setCompany] = useState<CompanyMeta | null>(null);

  useEffect(() => {
    async function fetchCompanyMeta() {
      try {
        const response = await fetchWithAuth('/api/company');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setCompany({
              name: result.data.name,
              favicon: result.data.favicon,
              pwaIcon: result.data.pwaIcon,
              logo: result.data.logo,
            });
          }
        }
      } catch (error) {
        // Silently fail - use default icons
        console.warn('Failed to fetch company meta:', error);
      }
    }

    fetchCompanyMeta();
  }, []);

  useEffect(() => {
    if (!company) return;

    // Update document title with company name
    if (company.name) {
      const currentTitle = document.title;
      if (!currentTitle.includes(company.name)) {
        document.title = `${company.name} | Omnex-Core`;
      }
    }

    // Update favicon
    if (company.favicon) {
      updateFavicon(company.favicon);
    }

    // Update PWA manifest with dynamic icons
    if (company.pwaIcon || company.logo) {
      updatePWAManifest(company);
    }
  }, [company]);

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
 * Creates or updates a dynamic PWA manifest with company icons
 */
function updatePWAManifest(company: CompanyMeta) {
  const iconUrl = company.pwaIcon || company.logo || company.favicon;
  if (!iconUrl) return;

  // Remove existing manifest link
  const existingManifest = document.querySelector("link[rel='manifest']");
  if (existingManifest) {
    existingManifest.remove();
  }

  // Create dynamic manifest
  const manifest = {
    name: company.name || 'Omnex-Core',
    short_name: company.name || 'Omnex',
    description: 'Omnex-Core Platform',
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
    (appleTitleMeta as HTMLMetaElement).content = company.name || 'Omnex-Core';
    document.head.appendChild(appleTitleMeta);
  }
}
