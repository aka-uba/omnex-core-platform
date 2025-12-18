import { createTheme } from '@mantine/core';

export const theme = createTheme({
    primaryColor: 'blue',
    defaultRadius: 'md',
    fontFamily: 'Inter, sans-serif',
    headings: {
        fontFamily: 'Inter, sans-serif',
    },
    colors: {
        dark: [
            '#C1C2C5',
            '#A6A7AB',
            '#909296',
            '#5C5F66',
            '#373A40',
            '#2C2E33',
            '#25262B',
            '#1A1B1E',
            '#141517',
            '#101113',
        ],
    },
    components: {
        Button: {
            defaultProps: {
                size: 'md',
            },
            styles: (theme: any, params: any) => ({
                root: {
                    position: 'relative',
                    overflow: 'hidden',
                    // Sadece variant="filled" ve color prop'u yoksa varsayılan renkleri uygula
                    ...(params.variant === 'filled' && !params.color && {
                        backgroundColor: theme.colorScheme === 'dark' ? 'var(--bg-card)' : 'var(--color-primary-600)',
                        color: theme.colorScheme === 'dark' ? 'var(--text-primary)' : 'white',
                        '&:hover': {
                            backgroundColor: theme.colorScheme === 'dark' ? 'var(--bg-surface)' : 'var(--color-primary-700)',
                        },
                    }),
                    // variant="default" için özel stiller
                    ...(params.variant === 'default' && {
                        backgroundColor: theme.colorScheme === 'dark' ? 'var(--bg-surface)' : 'white',
                        color: theme.colorScheme === 'dark' ? 'var(--text-primary)' : 'var(--text-primary)',
                        borderColor: theme.colorScheme === 'dark' ? 'var(--border-color)' : 'var(--border-color)',
                        '&:hover': {
                            backgroundColor: theme.colorScheme === 'dark' ? '#3c4043' : 'var(--bg-secondary)',
                        },
                    }),
                },
            }),
        },
        TextInput: {
            defaultProps: {
                size: 'md',
            },
            styles: (theme: any) => ({
                input: {
                    backgroundColor: theme.colorScheme === 'dark' ? 'var(--bg-card)' : 'white',
                    borderColor: theme.colorScheme === 'dark' ? 'var(--border-color)' : 'var(--border-color)',
                    color: theme.colorScheme === 'dark' ? 'var(--text-primary)' : 'var(--text-primary)',
                    '&::placeholder': {
                        color: theme.colorScheme === 'dark' ? 'var(--text-muted)' : 'var(--text-muted)',
                    },
                    '&:focus': {
                        borderColor: 'var(--color-primary-500)',
                    },
                },
            }),
        },
        Card: {
            styles: (theme: any) => ({
                root: {
                    backgroundColor: theme.colorScheme === 'dark' ? 'var(--bg-card)' : 'white',
                    borderColor: theme.colorScheme === 'dark' ? 'var(--border-color)' : 'var(--border-color)',
                    color: theme.colorScheme === 'dark' ? 'var(--text-primary)' : 'var(--text-primary)',
                },
            }),
        },
        Paper: {
            styles: (theme: any) => ({
                root: {
                    backgroundColor: theme.colorScheme === 'dark' ? 'var(--bg-card)' : 'white',
                    borderColor: theme.colorScheme === 'dark' ? 'var(--border-color)' : 'var(--border-color)',
                    color: theme.colorScheme === 'dark' ? 'var(--text-primary)' : 'var(--text-primary)',
                },
            }),
        },
        Drawer: {
            styles: (theme: any) => ({
                content: {
                    backgroundColor: theme.colorScheme === 'dark' ? 'var(--bg-card)' : 'var(--bg-card)',
                    color: theme.colorScheme === 'dark' ? 'var(--text-primary)' : 'var(--text-primary)',
                },
                header: {
                    backgroundColor: theme.colorScheme === 'dark' ? 'var(--bg-card)' : 'var(--bg-card)',
                    borderBottomColor: theme.colorScheme === 'dark' ? 'var(--border-color)' : 'var(--border-color)',
                    color: theme.colorScheme === 'dark' ? 'var(--text-primary)' : 'var(--text-primary)',
                },
                body: {
                    backgroundColor: theme.colorScheme === 'dark' ? 'var(--bg-card)' : 'var(--bg-card)',
                    color: theme.colorScheme === 'dark' ? 'var(--text-primary)' : 'var(--text-primary)',
                },
            }),
        },
        Modal: {
            styles: (theme: any) => ({
                content: {
                    backgroundColor: theme.colorScheme === 'dark' ? 'var(--bg-card)' : 'white',
                    borderColor: theme.colorScheme === 'dark' ? 'var(--border-color)' : 'var(--border-color)',
                },
                header: {
                    backgroundColor: theme.colorScheme === 'dark' ? 'var(--bg-card)' : 'white',
                    borderBottomColor: theme.colorScheme === 'dark' ? 'var(--border-color)' : 'var(--border-color)',
                },
                body: {
                    backgroundColor: theme.colorScheme === 'dark' ? 'var(--bg-card)' : 'white',
                    color: theme.colorScheme === 'dark' ? 'var(--text-primary)' : 'var(--text-primary)',
                },
            }),
        },
        Select: {
            styles: (theme: any) => ({
                input: {
                    backgroundColor: theme.colorScheme === 'dark' ? 'var(--bg-card)' : 'white',
                    borderColor: theme.colorScheme === 'dark' ? 'var(--border-color)' : 'var(--border-color)',
                    color: theme.colorScheme === 'dark' ? 'var(--text-primary)' : 'var(--text-primary)',
                },
                dropdown: {
                    backgroundColor: theme.colorScheme === 'dark' ? 'var(--bg-card)' : 'white',
                    borderColor: theme.colorScheme === 'dark' ? 'var(--border-color)' : 'var(--border-color)',
                },
            }),
        },
        Textarea: {
            styles: (theme: any) => ({
                input: {
                    backgroundColor: theme.colorScheme === 'dark' ? 'var(--bg-card)' : 'white',
                    borderColor: theme.colorScheme === 'dark' ? 'var(--border-color)' : 'var(--border-color)',
                    color: theme.colorScheme === 'dark' ? 'var(--text-primary)' : 'var(--text-primary)',
                },
            }),
        },
        Dropzone: {
            styles: (theme: any) => ({
                root: {
                    backgroundColor: theme.colorScheme === 'dark' ? 'var(--bg-surface)' : 'var(--bg-secondary)',
                    borderColor: theme.colorScheme === 'dark' ? 'var(--border-color)' : 'var(--border-color)',
                },
            }),
        },
    },
});
