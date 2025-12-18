'use client';

import { TextInput, ColorInput, Stack, Title, Button, Group, Textarea } from '@mantine/core';

export function BrandKitTab() {
    return (
        <Stack gap="md" maw={600}>
            <Title order={4}>Brand Identity</Title>
            <TextInput label="Company Name" placeholder="Enter company name" />
            <TextInput label="Website" placeholder="https://example.com" />

            <Title order={4} mt="md">Visual Style</Title>
            <ColorInput label="Primary Color" placeholder="#000000" />
            <ColorInput label="Secondary Color" placeholder="#000000" />

            <Title order={4} mt="md">Tone of Voice</Title>
            <Textarea
                label="Brand Voice Description"
                placeholder="Describe how your brand speaks (e.g., Professional, Friendly, Witty)"
                minRows={3}
            />

            <Group justify="flex-end" mt="xl">
                <Button>Save Changes</Button>
            </Group>
        </Stack>
    );
}
