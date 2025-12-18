import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: ['class', '[data-mantine-color-scheme="dark"]'],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: 'var(--primary)',
                    50: 'var(--color-primary-50)',
                    100: 'var(--color-primary-100)',
                    200: 'var(--color-primary-200)',
                    300: 'var(--color-primary-300)',
                    400: 'var(--color-primary-400)',
                    500: 'var(--color-primary-500)',
                    600: 'var(--color-primary-600)',
                    700: 'var(--color-primary-700)',
                    800: 'var(--color-primary-800)',
                    900: 'var(--color-primary-900)',
                },
                // Flat color definitions matching design file
                'background-light': 'var(--bg-secondary, #f5f7f8)',
                'background-dark': 'var(--bg-primary, #202124)',
                'surface-light': 'var(--bg-surface, #ffffff)',
                'surface-dark': 'var(--bg-surface, #303134)',
                'panel-light': 'var(--bg-card, #ffffff)',
                'panel-dark': 'var(--bg-card, #303134)',
                'header-light': 'var(--header-light)',
                'header-dark': 'var(--header-dark)',
                'text-primary-light': 'var(--text-light, #0d141c)',
                'text-primary-dark': 'var(--text-dark, #f5f7f8)',
                'text-secondary-light': 'var(--text-secondary-light, #49739c)',
                'text-secondary-dark': 'var(--text-secondary-dark, #a0b3c6)',
                'border-light': 'var(--border-light, #e7edf4)',
                'border-dark': 'var(--border-dark, #2a3b4d)',
                'interactive-light': 'var(--interactive-light)',
                'interactive-dark': 'var(--interactive-dark)',
                // Legacy nested structure (for backward compatibility)
                background: {
                    light: 'var(--bg-secondary)',
                    dark: 'var(--bg-primary)',
                },
                header: {
                    light: 'var(--header-light)',
                    dark: 'var(--header-dark)',
                },
                text: {
                    light: 'var(--text-light)',
                    dark: 'var(--text-dark)',
                    'secondary-light': 'var(--text-secondary-light)',
                    'secondary-dark': 'var(--text-secondary-dark)',
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    muted: 'var(--text-muted)',
                },
                border: {
                    light: 'var(--border-light)',
                    dark: 'var(--border-dark)',
                    DEFAULT: 'var(--border-color)',
                    hover: 'var(--border-hover)',
                },
                interactive: {
                    light: 'var(--interactive-light)',
                    dark: 'var(--interactive-dark)',
                },
                bg: {
                    primary: 'var(--bg-primary)',
                    secondary: 'var(--bg-secondary)',
                    card: 'var(--bg-card)',
                    surface: 'var(--bg-surface)',
                },
            },
            fontFamily: {
                display: ['Space Grotesk', 'Inter', 'sans-serif'],
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/container-queries'),
        require('@tailwindcss/typography'),
        require('@tailwindcss/aspect-ratio'),
        require('tailwindcss-animate'),
    ],
};
export default config;
