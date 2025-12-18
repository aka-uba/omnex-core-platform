'use client';

import { Paper, Group, ActionIcon, Text, Stack, AspectRatio, Box } from '@mantine/core';
import { IconDownload, IconShare, IconMaximize } from '@tabler/icons-react';

interface VideoPlayerProps {
    src: string;
    title: string;
    aspectRatio: string;
}

export function VideoPlayer({ src, title, aspectRatio }: VideoPlayerProps) {
    const ratio = aspectRatio === '16:9' ? 16 / 9 : aspectRatio === '9:16' ? 9 / 16 : 1;

    return (
        <Paper p="xs" radius="md" withBorder>
            <Stack gap="xs">
                <AspectRatio ratio={ratio}>
                    <Box
                        component="video"
                        controls
                        src={src}
                        style={{ width: '100%', height: '100%', borderRadius: 'var(--mantine-radius-sm)', backgroundColor: '#000' }}
                    />
                </AspectRatio>

                <Group justify="space-between" align="center">
                    <Text size="sm" fw={500} lineClamp={1} style={{ flex: 1 }}>{title}</Text>

                    <Group gap={4}>
                        <ActionIcon variant="subtle" color="gray" size="sm">
                            <IconMaximize size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="gray" size="sm">
                            <IconDownload size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="gray" size="sm">
                            <IconShare size={16} />
                        </ActionIcon>
                    </Group>
                </Group>
            </Stack>
        </Paper>
    );
}
