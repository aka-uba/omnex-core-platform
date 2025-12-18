'use client';

import {
    Paper,
    Text,
    Code,
    Stack,
    Group,
    Badge,
    ScrollArea,
    Divider
} from '@mantine/core';
import { IconCode } from '@tabler/icons-react';

interface ConfigPreviewProps {
    scope: { type: 'tenant' | 'role' | 'user'; id?: string };
    activeTab: string;
}

export function ConfigPreview({ scope, activeTab }: ConfigPreviewProps) {
    // In a real implementation, this would listen to changes in the active tab's form
    // For now, we'll show a placeholder explanation of how the config is applied

    return (
        <Paper withBorder p="md" radius="md" h="100%">
            <Stack h="100%">
                <Group justify="space-between">
                    <Group>
                        <IconCode size={20} />
                        <Text fw={600}>Configuration Preview</Text>
                    </Group>
                    <Badge variant="light" color="blue">JSON</Badge>
                </Group>

                <Divider />

                <ScrollArea style={{ flex: 1 }}>
                    <Stack gap="md">
                        <Text size="sm" c="dimmed">
                            This panel shows the raw JSON configuration that will be applied based on your current selection.
                        </Text>

                        <Stack gap="xs">
                            <Text size="xs" fw={700} tt="uppercase" c="dimmed">Current Scope</Text>
                            <Code block>
                                {JSON.stringify(scope, null, 2)}
                            </Code>
                        </Stack>

                        <Stack gap="xs">
                            <Text size="xs" fw={700} tt="uppercase" c="dimmed">Active Configuration Type</Text>
                            <Badge>{activeTab.toUpperCase()}</Badge>
                        </Stack>

                        <Stack gap="xs">
                            <Text size="xs" fw={700} tt="uppercase" c="dimmed">Priority Logic</Text>
                            <Text size="sm">
                                Configurations are merged in the following order (last one wins):
                            </Text>
                            <Group gap="xs">
                                <Badge color="gray" variant="outline">1. Tenant</Badge>
                                <Text size="sm">→</Text>
                                <Badge color="blue" variant="outline">2. Role</Badge>
                                <Text size="sm">→</Text>
                                <Badge color="violet" variant="outline">3. User</Badge>
                            </Group>
                        </Stack>
                    </Stack>
                </ScrollArea>
            </Stack>
        </Paper>
    );
}
