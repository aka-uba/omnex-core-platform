'use client';

import { Paper, Group, ActionIcon, Slider, Text, Stack } from '@mantine/core';
import { IconPlayerPlay, IconPlayerPause, IconVolume, IconDownload } from '@tabler/icons-react';
import { useState } from 'react';

interface AudioPlayerProps {
    src: string;
    title: string;
    duration: string;
}

export function AudioPlayer({ src, title, duration }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    return (
        <Paper p="md" radius="md" withBorder>
            <Stack gap="xs">
                <Text size="sm" fw={500} truncate>{title}</Text>

                <Group gap="md">
                    <ActionIcon
                        variant="filled"
                        color="blue"
                        radius="xl"
                        size="lg"
                        onClick={togglePlay}
                    >
                        {isPlaying ? <IconPlayerPause size={20} /> : <IconPlayerPlay size={20} />}
                    </ActionIcon>

                    <Stack gap={0} style={{ flex: 1 }}>
                        <Slider
                            value={progress}
                            onChange={setProgress}
                            size="sm"
                            label={null}
                        />
                        <Group justify="space-between" mt={4}>
                            <Text size="xs" c="dimmed">0:00</Text>
                            <Text size="xs" c="dimmed">{duration}</Text>
                        </Group>
                    </Stack>

                    <ActionIcon variant="subtle" color="gray">
                        <IconVolume size={20} />
                    </ActionIcon>

                    <ActionIcon variant="subtle" color="gray">
                        <IconDownload size={20} />
                    </ActionIcon>
                </Group>
            </Stack>
        </Paper>
    );
}
