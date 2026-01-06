'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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
  canShowNativePrompt: boolean; // Browser supports native prompt (even if event not fired yet)
  isReady: boolean;

  // Platform detection
  platform: Platform;
  browser: Browser;
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  isMobile: boolean;

  // Actions
  promptInstall: () => Promise<boolean>;
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
  if (/firefox/.test(ua)) return 'firefox';
  if (/chrome/.test(ua) && !/edg/.test(ua)) return 'chrome';
  if (/safari/.test(ua) && !/chrome/.test(ua)) return 'safari';

  return 'unknown';
}

// Check if browser theoretically supports beforeinstallprompt
function browserSupportsNativePrompt(platform: Platform, browser: Browser): boolean {
  // Chrome and Edge support beforeinstallprompt on Android, Windows, Mac, Linux
  // But NOT on iOS (iOS Chrome is just Safari with a skin)
  if (platform === 'ios') return false;

  if (browser === 'chrome' || browser === 'edge') {
    return platform === 'android' || platform === 'windows' || platform === 'mac' || platform === 'linux';
  }

  // Opera also supports it on some platforms
  if (browser === 'opera') {
    return platform === 'android' || platform === 'windows' || platform === 'mac' || platform === 'linux';
  }

  return false;
}

// Store the deferred prompt globally so it persists across re-renders
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
let globalPromptReceived = false;

export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [browser, setBrowser] = useState<Browser>('unknown');
  const [isReady, setIsReady] = useState(false);
  const [promptReceived, setPromptReceived] = useState(globalPromptReceived);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect platform and browser immediately
    const userAgent = window.navigator.userAgent;
    const detectedPlatform = detectPlatform(userAgent);
    const detectedBrowser = detectBrowser(userAgent);

    setPlatform(detectedPlatform);
    setBrowser(detectedBrowser);

    // Check if already installed (standalone mode)
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(standalone);
      setIsInstalled(standalone);
    };

    checkStandalone();

    // If we already have a global prompt, use it
    if (globalDeferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt);
      setPromptReceived(true);
    }

    // Listen for beforeinstallprompt event (Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event globally and in state
      globalDeferredPrompt = e;
      globalPromptReceived = true;
      setDeferredPrompt(e);
      setPromptReceived(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check display-mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => checkStandalone();
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    // Mark as ready after a short delay to allow event to fire
    // For browsers that support native prompt, we wait a bit longer
    const supportsNative = browserSupportsNativePrompt(detectedPlatform, detectedBrowser);
    const readyTimeout = setTimeout(() => {
      setIsReady(true);
    }, supportsNative ? 100 : 50); // Short delay just for initial render

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      clearTimeout(readyTimeout);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    const prompt = deferredPrompt || globalDeferredPrompt;

    if (!prompt) {
      return false;
    }

    try {
      // Show the install prompt
      await prompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await prompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstalled(true);
        globalDeferredPrompt = null;
        setDeferredPrompt(null);
        return true;
      }
    } catch (error) {
      console.error('PWA install prompt error:', error);
    }

    // Clear the prompt after use (can only be used once)
    globalDeferredPrompt = null;
    setDeferredPrompt(null);
    return false;
  }, [deferredPrompt]);

  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';
  const isMobile = isIOS || isAndroid;
  const isDesktop = !isMobile && platform !== 'unknown';

  // Do we have the actual prompt event?
  const hasNativePrompt = !!(deferredPrompt || globalDeferredPrompt);

  // Does the browser support native prompt (even if event not received yet)?
  const canShowNativePrompt = browserSupportsNativePrompt(platform, browser);

  // Installable if:
  // 1. Hook is ready
  // 2. Not already in standalone mode
  // 3. Has native prompt OR is on a platform where we can show instructions
  const isInstallable = isReady && !isStandalone && (
    hasNativePrompt ||
    canShowNativePrompt || // Show button even if event not received (will try to prompt)
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
    canShowNativePrompt,
    isReady,
    platform,
    browser,
    isIOS,
    isAndroid,
    isDesktop,
    isMobile,
    promptInstall,
  };
}
