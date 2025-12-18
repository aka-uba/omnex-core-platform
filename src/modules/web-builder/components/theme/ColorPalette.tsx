'use client';

import { ColorInput, Stack, Text, Group } from '@mantine/core';
import { useTheme } from '../../hooks/useTheme';

export function ColorPalette() {
    const { theme, updateColor } = useTheme();

    return (
        <Stack gap="md">
            <Text fw={500} size="sm">Brand Colors</Text>
            <Group grow>
                <ColorInput
                    label="Primary"
                    value={theme.colors.primary}
                    onChange={(val) => updateColor('primary', val)}
                />
                <ColorInput
                    label="Secondary"
                    value={theme.colors.secondary}
                    onChange={(val) => updateColor('secondary', val)}
                />
            </Group>

            <Text fw={500} size="sm" mt="sm">Backgrounds</Text>
            <Group grow>
                <ColorInput
                    label="Background"
                    value={theme.colors.background}
                    onChange={(val) => updateColor('background', val)}
                />
                <ColorInput
                    label="Surface"
                    value={theme.colors.surface}
                    onChange={(val) => updateColor('surface', val)}
                />
            </Group>

            <Text fw={500} size="sm" mt="sm">Content</Text>
            <Group grow>
                <ColorInput
                    label="Text"
                    value={theme.colors.text}
                    onChange={(val) => updateColor('text', val)}
                />
                <ColorInput
                    label="Border"
                    value={theme.colors.border}
                    onChange={(val) => updateColor('border', val)}
                />
            </Group>
        </Stack>
    );
}
