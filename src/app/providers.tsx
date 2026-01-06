'use client';

import { MantineProvider, DirectionProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@/theme';
import { ThemeProvider as CustomThemeProvider, useTheme } from '@/context/ThemeContext';
import { ModuleProvider } from '@/context/ModuleContext';
import { CompanyProvider } from '@/context/CompanyContext';
import { ExportProvider } from '@/lib/export/ExportProvider';
import { DatesProviderWrapper } from '@/components/providers/DatesProvider';
import { DynamicHeadMeta } from '@/components/DynamicHeadMeta';
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration';
import { useCompany } from '@/context/CompanyContext';
import { useEffect, useState } from 'react';

/**
 * DynamicHeadMetaWithCompany - CompanyContext'ten firma adını alıp DynamicHeadMeta'ya geçirir
 */
function DynamicHeadMetaWithCompany() {
    const { company } = useCompany();
    return <DynamicHeadMeta companyName={company?.name || ''} />;
}

// Default tenant for development (when no tenant context is available)
const DEFAULT_TENANT_SLUG = 'omnexcore';

/**
 * TenantCookieSetter - Sets tenant cookie if not already set
 * This ensures API calls have tenant context in development
 */
function TenantCookieSetter() {
    useEffect(() => {
        if (typeof document === 'undefined') return;
        
        // Check if tenant-slug cookie exists
        const existingCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('tenant-slug='));
        
        if (!existingCookie) {
            // Set default tenant cookie for development
            const maxAge = 60 * 60 * 24 * 7; // 7 days
            document.cookie = `tenant-slug=${DEFAULT_TENANT_SLUG}; path=/; max-age=${maxAge}; SameSite=Lax`;
        }
    }, []);
    
    return null;
}

// Create a client for TanStack Query
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
        },
    },
});

function DirectionWrapper({ children }: { children: React.ReactNode }) {
    const { direction } = useTheme();
    const [, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Update HTML dir attribute when direction changes
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('dir', direction);
        }
    }, [direction]);

    // Use key prop to force re-render when direction changes
    return (
        <DirectionProvider key={direction} initialDirection={direction}>
            {children}
        </DirectionProvider>
    );
}

function MantineThemeWrapper({ children }: { children: React.ReactNode }) {
    // NOT: LayoutProvider artık theme mode'u yönetiyor
    // Bu wrapper devre dışı bırakıldı çünkü LayoutProvider theme mode'u yönetiyor
    // LayoutProvider hem Mantine'e hem de HTML'e theme mode'u uyguluyor
    
    // Sadece ilk yüklemede localStorage'dan theme mode'u oku ve uygula (LayoutProvider yüklenene kadar)
    useEffect(() => {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;
        
        // localStorage'dan theme mode'u oku (eski sistem veya yeni sistem)
        const oldThemeMode = localStorage.getItem('omnex-theme-mode');
        const newConfig = localStorage.getItem('omnex-layout-config-v2');
        
        let initialThemeMode: 'light' | 'dark' = 'light';
        
        if (newConfig) {
            try {
                const parsed = JSON.parse(newConfig);
                if (parsed.themeMode && parsed.themeMode !== 'auto') {
                    initialThemeMode = parsed.themeMode;
                }
            } catch (e) {
                // Ignore
            }
        } else if (oldThemeMode && oldThemeMode !== 'auto') {
            initialThemeMode = oldThemeMode as 'light' | 'dark';
        } else {
            // System preference
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            initialThemeMode = mediaQuery.matches ? 'dark' : 'light';
        }
        
        // HTML'e uygula (LayoutProvider yüklenene kadar)
        document.documentElement.setAttribute('data-mantine-color-scheme', initialThemeMode);
        
        // Tailwind dark mode için class ekle/çıkar
        if (initialThemeMode === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
    }, []);

    return <>{children}</>;
}

// Component to sync server-side dir prop with ThemeContext
// Must be inside CustomThemeProvider to use useTheme hook
function DirectionSync({ children, dir }: { children: React.ReactNode; dir?: string }) {
    const { direction, setDirection } = useTheme();
    
    // Sync server-side dir prop with ThemeContext on mount and when dir changes
    useEffect(() => {
        if (dir && dir !== direction) {
            setDirection(dir as 'ltr' | 'rtl');
        }
    }, [dir]); // Only depend on dir, not direction to avoid loops
    
    return <>{children}</>;
}

export function Providers({ children, dir }: { children: React.ReactNode; dir?: string }) {
    return (
        <QueryClientProvider client={queryClient}>
            <TenantCookieSetter />
            <ServiceWorkerRegistration />
            <CustomThemeProvider>
                <DirectionSync {...(dir ? { dir } : {})}>
                    <DirectionWrapper>
                        <MantineProvider theme={theme}>
                            <MantineThemeWrapper>
                                <DatesProviderWrapper>
                                    <ModalsProvider modalProps={{ centered: true }}>
                                        <Notifications position="top-center" zIndex={10000} />
                                        <ExportProvider>
                                            <CompanyProvider>
                                                <DynamicHeadMetaWithCompany />
                                                <ModuleProvider>
                                                    {children}
                                                </ModuleProvider>
                                            </CompanyProvider>
                                        </ExportProvider>
                                    </ModalsProvider>
                                </DatesProviderWrapper>
                            </MantineThemeWrapper>
                        </MantineProvider>
                    </DirectionWrapper>
                </DirectionSync>
            </CustomThemeProvider>
        </QueryClientProvider>
    );
}
