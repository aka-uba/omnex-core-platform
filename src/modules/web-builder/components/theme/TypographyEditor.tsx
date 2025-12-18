'use client';

import { Select, Stack, Text } from '@mantine/core';
import { useTheme } from '../../hooks/useTheme';

const FONT_OPTIONS = [
    { value: 'Inter, sans-serif', label: 'Inter' },
    { value: 'Roboto, sans-serif', label: 'Roboto' },
    { value: 'Open Sans, sans-serif', label: 'Open Sans' },
    { value: 'Playfair Display, serif', label: 'Playfair Display' },
    { value: 'Lato, sans-serif', label: 'Lato' },
];

export function TypographyEditor() {
    const { theme, updateTypography } = useTheme();

    return (
        <Stack gap="md">
            <Text fw={500} size="sm">Font Family</Text>
            <Select
                label="Headings"
                data={FONT_OPTIONS}
                value={theme.typography.fontFamily.heading}
                onChange={(val) => val && updateTypography('fontFamily', 'heading', val)}
            />
            <Select
                label="Body Text"
                data={FONT_OPTIONS}
                value={theme.typography.fontFamily.body}
                onChange={(val) => val && updateTypography('fontFamily', 'body', val)}
            />
        </Stack>
    );
}
