export interface ThemeConfig {
    colors: {
        primary: string;
        secondary: string;
        background: string;
        surface: string;
        text: string;
        border: string;
        [key: string]: string;
    };
    typography: {
        fontFamily: {
            heading: string;
            body: string;
        };
        fontSize: {
            base: string;
            h1: string;
            h2: string;
            h3: string;
            small: string;
        };
        lineHeight: {
            base: string;
            heading: string;
        };
    };
    spacing: {
        container: string;
        sectionPadding: string;
        elementGap: string;
    };
    borderRadius: {
        small: string;
        medium: string;
        large: string;
        button: string;
    };
    shadows: {
        small: string;
        medium: string;
        large: string;
    };
}

export const defaultTheme: ThemeConfig = {
    colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f172a',
        border: '#e2e8f0',
    },
    typography: {
        fontFamily: {
            heading: 'Inter, sans-serif',
            body: 'Inter, sans-serif',
        },
        fontSize: {
            base: '16px',
            h1: '2.5rem',
            h2: '2rem',
            h3: '1.75rem',
            small: '0.875rem',
        },
        lineHeight: {
            base: '1.5',
            heading: '1.2',
        },
    },
    spacing: {
        container: '1200px',
        sectionPadding: '4rem',
        elementGap: '1rem',
    },
    borderRadius: {
        small: '0.25rem',
        medium: '0.5rem',
        large: '1rem',
        button: '0.5rem',
    },
    shadows: {
        small: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        medium: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        large: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    },
};
