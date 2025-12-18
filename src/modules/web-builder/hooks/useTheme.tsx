'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeConfig, defaultTheme } from '../types/theme.types';

interface ThemeContextType {
    theme: ThemeConfig;
    updateTheme: (updates: Partial<ThemeConfig>) => void;
    updateColor: (key: string, value: string) => void;
    updateTypography: (category: keyof ThemeConfig['typography'], key: string, value: string) => void;
    resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, initialTheme }: { children: React.ReactNode; initialTheme?: ThemeConfig }) {
    const [theme, setTheme] = useState<ThemeConfig>(initialTheme || defaultTheme);

    // Generate CSS variables whenever theme changes
    useEffect(() => {
        const root = document.documentElement;

        // Colors
        Object.entries(theme.colors).forEach(([key, value]) => {
            root.style.setProperty(`--wb-color-${key}`, value);
        });

        // Typography
        root.style.setProperty('--wb-font-heading', theme.typography.fontFamily.heading);
        root.style.setProperty('--wb-font-body', theme.typography.fontFamily.body);

        // Spacing
        root.style.setProperty('--wb-spacing-container', theme.spacing.container);
        root.style.setProperty('--wb-spacing-section', theme.spacing.sectionPadding);

        // Border Radius
        root.style.setProperty('--wb-radius-button', theme.borderRadius.button);

    }, [theme]);

    const updateTheme = (updates: Partial<ThemeConfig>) => {
        setTheme((prev) => ({ ...prev, ...updates }));
    };

    const updateColor = (key: string, value: string) => {
        setTheme((prev) => ({
            ...prev,
            colors: {
                ...prev.colors,
                [key]: value,
            },
        }));
    };

    const updateTypography = (category: keyof ThemeConfig['typography'], key: string, value: string) => {
        setTheme((prev) => ({
            ...prev,
            typography: {
                ...prev.typography,
                [category]: {
                    ...prev.typography[category],
                    [key]: value,
                },
            },
        }));
    };

    const resetTheme = () => {
        setTheme(defaultTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, updateTheme, updateColor, updateTypography, resetTheme }}>
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
