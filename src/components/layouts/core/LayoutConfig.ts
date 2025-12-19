/**
 * Layout Configuration Types and Constants
 * Tüm layout yapılandırma tipleri burada tanımlanır
 */

export type LayoutType = 'sidebar' | 'top' | 'mobile';
export type ThemeMode = 'light' | 'dark' | 'auto';
export type Direction = 'ltr' | 'rtl';
export type MenuColor = 'light' | 'dark' | 'auto' | 'custom';
export type BackgroundType = 'light' | 'dark' | 'brand' | 'gradient' | 'custom';
export type TopBarScroll = 'fixed' | 'hidden' | 'hidden-on-hover';
export type LayoutSource = 'role' | 'user' | 'company' | 'default';

// Border Configuration
export interface BorderConfig {
  enabled: boolean;
  width: number;
  color: string;
}

// Sidebar Configuration
export interface SidebarConfig {
  background: BackgroundType;
  customColor?: string;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  collapsed: boolean;
  menuColor: MenuColor;
  customMenuColor?: string;
  logoPosition?: 'top' | 'center' | 'bottom';
  logoSize?: 'small' | 'medium' | 'large';
  hoverEffects?: boolean;
  border?: BorderConfig;
}

// Top Layout Configuration
export interface TopConfig {
  background: BackgroundType;
  customColor?: string;
  height?: number;
  scrollBehavior: TopBarScroll;
  sticky?: boolean;
  menuColor: MenuColor;
  customMenuColor?: string;
  logoPosition?: 'left' | 'center' | 'right';
  logoSize?: 'small' | 'medium' | 'large';
  border?: BorderConfig;
}

// Mobile Layout Configuration
export interface MobileConfig {
  headerHeight: number;
  iconSize: number;
  menuAnimation: 'slide' | 'fade' | 'drawer';
  bottomBarVisible: boolean;
  iconSpacing: number;
}

// Content Area Configuration
export interface ContentAreaConfig {
  width: {
    value: number;
    unit: 'px' | '%';
    min?: number;
    max?: number;
  };
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  responsive: {
    mobile: {
      width?: { value: number; unit: 'px' | '%'; min?: number; max?: number };
      padding?: { top: number; right: number; bottom: number; left: number };
      margin?: { top: number; right: number; bottom: number; left: number };
    };
    tablet: {
      width?: { value: number; unit: 'px' | '%'; min?: number; max?: number };
      padding?: { top: number; right: number; bottom: number; left: number };
      margin?: { top: number; right: number; bottom: number; left: number };
    };
  };
}

// Main Layout Configuration
export interface LayoutConfig {
  layoutType: LayoutType;
  themeMode: ThemeMode;
  direction: Direction;
  footerVisible: boolean;
  sidebar?: SidebarConfig;
  top?: TopConfig;
  mobile?: MobileConfig;
  contentArea?: ContentAreaConfig;
  layoutSource?: LayoutSource;
}

// Default Configurations
export const DEFAULT_SIDEBAR_CONFIG: SidebarConfig = {
  background: 'light',
  width: 260,
  minWidth: 200,
  maxWidth: 320,
  collapsed: false,
  menuColor: 'auto',
  customMenuColor: '#228be6',
  logoPosition: 'top',
  logoSize: 'medium',
  hoverEffects: true,
  border: {
    enabled: false,
    width: 1,
    color: '#dee2e6',
  },
};

export const DEFAULT_TOP_CONFIG: TopConfig = {
  background: 'light',
  height: 64, // Sidebar header ile aynı: padding 0.75rem (12px) top/bottom + içerik 40px = 64px
  scrollBehavior: 'fixed',
  sticky: true,
  menuColor: 'auto',
  customMenuColor: '#228be6',
  logoPosition: 'left',
  logoSize: 'medium',
  border: {
    enabled: false,
    width: 1,
    color: '#dee2e6',
  },
};

export const DEFAULT_MOBILE_CONFIG: MobileConfig = {
  headerHeight: 56,
  iconSize: 24,
  menuAnimation: 'drawer',
  bottomBarVisible: false,
  iconSpacing: 8,
};

export const DEFAULT_CONTENT_AREA_CONFIG: ContentAreaConfig = {
  width: {
    value: 100,
    unit: '%',
    min: 320,
    max: 1920,
  },
  padding: {
    top: 24,
    right: 24,
    bottom: 24,
    left: 24,
  },
  margin: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  responsive: {
    mobile: {
      padding: {
        top: 16,
        right: 16,
        bottom: 16,
        left: 16,
      },
    },
    tablet: {
      padding: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      },
    },
  },
};

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  layoutType: 'sidebar',
  themeMode: 'light',
  direction: 'ltr',
  footerVisible: true,
  sidebar: DEFAULT_SIDEBAR_CONFIG,
  top: DEFAULT_TOP_CONFIG,
  mobile: DEFAULT_MOBILE_CONFIG,
  contentArea: DEFAULT_CONTENT_AREA_CONFIG,
  layoutSource: 'default',
};

// Breakpoints
export const BREAKPOINTS = {
  mobile: '(max-width: 768px)',
  tablet: '(min-width: 769px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)',
} as const;

// LocalStorage Keys
export const STORAGE_KEYS = {
  layoutConfig: 'omnex-layout-config-v2',
  layoutConfigTimestamp: 'omnex-layout-config-timestamp',
} as const;

