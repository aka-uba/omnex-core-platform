'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export type Platform = 'ios' | 'android' | 'windows' | 'mac' | 'linux' | 'unknown';
export type Browser = 'chrome' | 'edge' | 'firefox' | 'safari' | 'opera' | 'samsung' | 'unknown';

interface PWAInstallState {
  // Installation state
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  hasNativePrompt: boolean;

  // Platform detection
  platform: Platform;
  browser: Browser;
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  isMobile: boolean;

  // Actions
  promptInstall: () => Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

function detectPlatform(userAgent: string): Platform {
  const ua = userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/windows/.test(ua)) return 'windows';
  if (/macintosh|mac os x/.test(ua)) return 'mac';
  if (/linux/.test(ua)) return 'linux';

  return 'unknown';
}

function detectBrowser(userAgent: string): Browser {
  const ua = userAgent.toLowerCase();

  // Order matters - check more specific browsers first
  if (/samsungbrowser/.test(ua)) return 'samsung';
  if (/edg/.test(ua)) return 'edge';
  if (/opr|opera/.test(ua)) return 'opera';
  if (/chrome/.test(ua)) return 'chrome';
  if (/safari/.test(ua)) return 'safari';
  if (/firefox/.test(ua)) return 'firefox';

  return 'unknown';
}

export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [browser, setBrowser] = useState<Browser>('unknown');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setMounted(true);

    // Detect platform and browser
    const userAgent = window.navigator.userAgent;
    setPlatform(detectPlatform(userAgent));
    setBrowser(detectBrowser(userAgent));

    // Check if already installed (standalone mode)
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(standalone);
      setIsInstalled(standalone);
    };

    checkStandalone();

    // Listen for beforeinstallprompt event (Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check display-mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => checkStandalone();
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      // For browsers without native prompt support (iOS Safari, Firefox)
      // The UI component should show manual instructions
      return;
    }

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    // Clear the saved prompt
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';
  const isMobile = isIOS || isAndroid;
  const isDesktop = !isMobile && platform !== 'unknown';
  const hasNativePrompt = !!deferredPrompt;

  // Installable if:
  // 1. Component is mounted (client-side)
  // 2. Not already in standalone mode
  // 3. Has native prompt OR any detected platform (will show manual instructions)
  const isInstallable = mounted && !isStandalone && (
    hasNativePrompt ||
    isIOS ||
    isAndroid ||
    isDesktop ||
    platform !== 'unknown'
  );

  return {
    isInstallable,
    isInstalled,
    isStandalone,
    hasNativePrompt,
    platform,
    browser,
    isIOS,
    isAndroid,
    isDesktop,
    isMobile,
    promptInstall,
  };
}
