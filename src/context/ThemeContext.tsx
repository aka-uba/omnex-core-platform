'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { rtlLocales } from '@/lib/i18n/config';

type LayoutType = 'sidebar' | 'top';
type ThemeMode = 'light' | 'dark' | 'auto';
type Direction = 'ltr' | 'rtl';
type MenuColor = 'light' | 'dark' | 'auto' | 'custom';
type SidebarBackground = 'light' | 'dark' | 'brand' | 'gradient' | 'custom';
type TopBackground = 'light' | 'dark' | 'brand' | 'gradient' | 'custom';
type TopBarScroll = 'fixed' | 'hidden' | 'hidden-on-hover';

interface ThemeContextType {
    // Layout
    layout: LayoutType;
    setLayout: (layout: LayoutType) => void;
    
    // Theme Mode
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    
    // Direction
    direction: Direction;
    setDirection: (dir: Direction) => void;
    
    // Menu Color
    menuColor: MenuColor;
    setMenuColor: (color: MenuColor) => void;
    customMenuColor: string;
    setCustomMenuColor: (color: string) => void;
    
    // Sidebar
    sidebarBackground: SidebarBackground;
    setSidebarBackground: (bg: SidebarBackground) => void;
    customSidebarColor: string;
    setCustomSidebarColor: (color: string) => void;
    sidebarWidth: number;
    setSidebarWidth: (width: number) => void;
    
    // Top Layout
    topBackground: TopBackground;
    setTopBackground: (bg: TopBackground) => void;
    customTopColor: string;
    setCustomTopColor: (color: string) => void;
    
    // Footer
    footerVisible: boolean;
    setFooterVisible: (visible: boolean) => void;
    
    // Top Bar Scroll
    topBarScroll: TopBarScroll;
    setTopBarScroll: (behavior: TopBarScroll) => void;
    
    // Actions
    savePreferences: () => Promise<void>;
    resetPreferences: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Default values
const DEFAULT_LAYOUT: LayoutType = 'sidebar';
const DEFAULT_THEME_MODE: ThemeMode = 'auto';
const DEFAULT_DIRECTION: Direction = 'ltr';
const DEFAULT_MENU_COLOR: MenuColor = 'auto';
const DEFAULT_SIDEBAR_BACKGROUND: SidebarBackground = 'light';
const DEFAULT_TOP_BACKGROUND: TopBackground = 'light';
const DEFAULT_SIDEBAR_WIDTH = 260;
const DEFAULT_FOOTER_VISIBLE = true;
const DEFAULT_TOP_BAR_SCROLL: TopBarScroll = 'fixed';
const DEFAULT_CUSTOM_MENU_COLOR = '#228be6';
const DEFAULT_CUSTOM_SIDEBAR_COLOR = '#228be6';
const DEFAULT_CUSTOM_TOP_COLOR = '#228be6';

// LocalStorage keys
const STORAGE_KEYS = {
    layout: 'omnex-layout',
    themeMode: 'omnex-theme-mode',
    direction: 'omnex-direction',
    menuColor: 'omnex-menu-color',
    customMenuColor: 'omnex-custom-menu-color',
    sidebarBackground: 'omnex-sidebar-bg',
    customSidebarColor: 'omnex-custom-sidebar-color',
    topBackground: 'omnex-top-bg',
    customTopColor: 'omnex-custom-top-color',
    sidebarWidth: 'omnex-sidebar-width',
    footerVisible: 'omnex-footer-visible',
    topBarScroll: 'omnex-topbar-scroll',
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Initialize state from localStorage or defaults
    const [layout, setLayoutState] = useState<LayoutType>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEYS.layout) as LayoutType;
            return saved || DEFAULT_LAYOUT;
        }
        return DEFAULT_LAYOUT;
    });
    
    const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEYS.themeMode) as ThemeMode;
            return saved || DEFAULT_THEME_MODE;
        }
        return DEFAULT_THEME_MODE;
    });
    
    const [direction, setDirectionState] = useState<Direction>(() => {
        if (typeof window !== 'undefined') {
            // First check localStorage
            const saved = localStorage.getItem(STORAGE_KEYS.direction) as Direction;
            if (saved) {
                return saved;
            }
            
            // If no saved direction, determine from current locale
            const pathname = window.location.pathname;
            const locale = pathname?.split('/')[1] || '';
            const isRTL = rtlLocales.includes(locale);
            return isRTL ? 'rtl' : 'ltr';
        }
        return DEFAULT_DIRECTION;
    });
    
    const [menuColor, setMenuColorState] = useState<MenuColor>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEYS.menuColor) as MenuColor;
            return saved || DEFAULT_MENU_COLOR;
        }
        return DEFAULT_MENU_COLOR;
    });
    
    const [customMenuColor, setCustomMenuColorState] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEYS.customMenuColor);
            return saved || DEFAULT_CUSTOM_MENU_COLOR;
        }
        return DEFAULT_CUSTOM_MENU_COLOR;
    });
    
    const [sidebarBackground, setSidebarBackgroundState] = useState<SidebarBackground>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEYS.sidebarBackground) as SidebarBackground;
            return saved || DEFAULT_SIDEBAR_BACKGROUND;
        }
        return DEFAULT_SIDEBAR_BACKGROUND;
    });
    
    const [customSidebarColor, setCustomSidebarColorState] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEYS.customSidebarColor);
            return saved || DEFAULT_CUSTOM_SIDEBAR_COLOR;
        }
        return DEFAULT_CUSTOM_SIDEBAR_COLOR;
    });
    
    const [topBackground, setTopBackgroundState] = useState<TopBackground>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEYS.topBackground) as TopBackground;
            return saved || DEFAULT_TOP_BACKGROUND;
        }
        return DEFAULT_TOP_BACKGROUND;
    });
    
    const [customTopColor, setCustomTopColorState] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEYS.customTopColor);
            return saved || DEFAULT_CUSTOM_TOP_COLOR;
        }
        return DEFAULT_CUSTOM_TOP_COLOR;
    });
    
    const [sidebarWidth, setSidebarWidthState] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEYS.sidebarWidth);
            return saved ? parseInt(saved, 10) : DEFAULT_SIDEBAR_WIDTH;
        }
        return DEFAULT_SIDEBAR_WIDTH;
    });
    
    const [footerVisible, setFooterVisibleState] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEYS.footerVisible);
            return saved ? saved === 'true' : DEFAULT_FOOTER_VISIBLE;
        }
        return DEFAULT_FOOTER_VISIBLE;
    });
    
    const [topBarScroll, setTopBarScrollState] = useState<TopBarScroll>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEYS.topBarScroll) as TopBarScroll;
            return saved || DEFAULT_TOP_BAR_SCROLL;
        }
        return DEFAULT_TOP_BAR_SCROLL;
    });

    // Theme mode will be applied via MantineProvider wrapper

    // Apply direction to HTML
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('dir', direction);
        }
    }, [direction]);

    // Setters with localStorage persistence
    const setLayout = (newLayout: LayoutType) => {
        setLayoutState(newLayout);
        localStorage.setItem(STORAGE_KEYS.layout, newLayout);
    };

    const setThemeMode = (mode: ThemeMode) => {
        setThemeModeState(mode);
        localStorage.setItem(STORAGE_KEYS.themeMode, mode);
    };

    const setDirection = (dir: Direction) => {
        setDirectionState(dir);
        localStorage.setItem(STORAGE_KEYS.direction, dir);
    };

    const setMenuColor = (color: MenuColor) => {
        setMenuColorState(color);
        localStorage.setItem(STORAGE_KEYS.menuColor, color);
    };
    
    const setCustomMenuColor = (color: string) => {
        setCustomMenuColorState(color);
        localStorage.setItem(STORAGE_KEYS.customMenuColor, color);
    };

    const setSidebarBackground = (bg: SidebarBackground) => {
        setSidebarBackgroundState(bg);
        localStorage.setItem(STORAGE_KEYS.sidebarBackground, bg);
    };
    
    const setCustomSidebarColor = (color: string) => {
        setCustomSidebarColorState(color);
        localStorage.setItem(STORAGE_KEYS.customSidebarColor, color);
    };

    const setTopBackground = (bg: TopBackground) => {
        setTopBackgroundState(bg);
        localStorage.setItem(STORAGE_KEYS.topBackground, bg);
    };
    
    const setCustomTopColor = (color: string) => {
        setCustomTopColorState(color);
        localStorage.setItem(STORAGE_KEYS.customTopColor, color);
    };

    const setSidebarWidth = (width: number) => {
        setSidebarWidthState(width);
        localStorage.setItem(STORAGE_KEYS.sidebarWidth, width.toString());
    };

    const setFooterVisible = (visible: boolean) => {
        setFooterVisibleState(visible);
        localStorage.setItem(STORAGE_KEYS.footerVisible, visible.toString());
    };

    const setTopBarScroll = (behavior: TopBarScroll) => {
        setTopBarScrollState(behavior);
        localStorage.setItem(STORAGE_KEYS.topBarScroll, behavior);
    };

    // Save preferences (can be extended to save to API)
    const savePreferences = async () => {
        // All preferences are already saved to localStorage in setters
        // This can be extended to save to API
        try {
            // await fetch('/api/user/preferences', { method: 'POST', body: JSON.stringify({...}) });
        } catch (error) {
            // Failed to save preferences - silently fail
        }
    };

    // Reset preferences to defaults
    const resetPreferences = () => {
        setLayout(DEFAULT_LAYOUT);
        setThemeMode(DEFAULT_THEME_MODE);
        setDirection(DEFAULT_DIRECTION);
        setMenuColor(DEFAULT_MENU_COLOR);
        setCustomMenuColor(DEFAULT_CUSTOM_MENU_COLOR);
        setSidebarBackground(DEFAULT_SIDEBAR_BACKGROUND);
        setCustomSidebarColor(DEFAULT_CUSTOM_SIDEBAR_COLOR);
        setTopBackground(DEFAULT_TOP_BACKGROUND);
        setCustomTopColor(DEFAULT_CUSTOM_TOP_COLOR);
        setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
        setFooterVisible(DEFAULT_FOOTER_VISIBLE);
        setTopBarScroll(DEFAULT_TOP_BAR_SCROLL);
        
        // Clear localStorage
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    };

    return (
        <ThemeContext.Provider
            value={{
                layout,
                setLayout,
                themeMode,
                setThemeMode,
                direction,
                setDirection,
                menuColor,
                setMenuColor,
                customMenuColor,
                setCustomMenuColor,
                sidebarBackground,
                setSidebarBackground,
                customSidebarColor,
                setCustomSidebarColor,
                topBackground,
                setTopBackground,
                customTopColor,
                setCustomTopColor,
                sidebarWidth,
                setSidebarWidth,
                footerVisible,
                setFooterVisible,
                topBarScroll,
                setTopBarScroll,
                savePreferences,
                resetPreferences,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
