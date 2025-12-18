'use client';

import { useState } from 'react';
import { Box, Grid, Title, Stack, Text, Paper, SimpleGrid } from '@mantine/core';
import { VideoSettings } from './VideoSettings';
import { VideoPlayer } from './VideoPlayer';
import { AIInput } from '../shared/AIInput';
import { ModelSelector } from '../shared/ModelSelector';
import { AIModel, GenerationConfig, GeneratedContent } from '../../types';
import { useTranslation } from '@/lib/i18n/client';

const MOCK_VIDEO_MODELS: AIModel[] = [
    { id: 'sora', name: 'Sora', provider: 'openai', type: 'video', description: 'Photorealistic video generation' },
    { id: 'runway-gen-2', name: 'Runway Gen-2', provider: 'stability', type: 'video', description: 'Cinematic video creation' },
    { id: 'pika', name: 'Pika', provider: 'stability', type: 'video', description: 'Animation and video editing' },
];

export function VideoGenerator() {
    const { t } = useTranslation('modules/ai');
    const [selectedModel, setSelectedModel] = useState<string | null>('sora');
    const [config, setConfig] = useState<GenerationConfig>({
        modelId: 'sora',
        aspectRatio: '16:9',
        resolution: '1080p',
        style: 'realistic'
    });
    const [generatedVideos, setGeneratedVideos] = useState<GeneratedContent[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = (prompt: string) => {
        setIsGenerating(true);

        // Simulate generation
        setTimeout(() => {
            const newVideo: GeneratedContent = {
                id: Date.now().toString(),
                type: 'video',
                url: 'https://www.w3schools.com/html/mov_bbb.mp4', // Mock video URL
                prompt,
                createdAt: new Date(),
                modelId: selectedModel || '',
                metadata: {
                    resolution: config.resolution,
                    style: config.style,
                    aspectRatio: config.aspectRatio
                }
            };

            setGeneratedVideos(prev => [newVideo, ...prev]);
            setIsGenerating(false);
        }, 3000);
    };

    return (
        <Grid h="100%" gutter={0}>
            <Grid.Col span={{ base: 12, md: 9 }} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                    <Title order={3}>{t('videoGenerator')}</Title>
                </Box>

                <Box flex={1} p="md" style={{ overflowY: 'auto' }}>
                    {generatedVideos.length === 0 ? (
                        <Box h="100%" display="flex" style={{ alignItems: 'center', justifyContent: 'center' }}>
                            <Text c="dimmed">{t('noVideoGenerated')}</Text>
                        </Box>
                    ) : (
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                            {generatedVideos.map((video) => (
                                <VideoPlayer
                                    key={video.id}
                                    src={video.url || ''}
                                    title={video.prompt}
                                    aspectRatio={video.metadata?.aspectRatio || '16:9'}
                                />
                            ))}
                        </SimpleGrid>
                    )}
                </Box>

                <Box p="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)', backgroundColor: 'var(--mantine-color-body)' }}>
                    <AIInput
                        onSend={handleGenerate}
                        isLoading={isGenerating}
                        placeholder={t('videoPromptPlaceholder')}
                        allowVoice={false}
                    />
                </Box>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 3 }} style={{ borderLeft: '1px solid var(--mantine-color-default-border)' }}>
                <Paper h="100%" p="md" radius={0} style={{ backgroundColor: 'var(--mantine-color-body)' }}>
                    <Stack gap="xl">
                        <ModelSelector
                            label={t('model')}
                            value={selectedModel}
                            onChange={setSelectedModel}
                            models={MOCK_VIDEO_MODELS}
                        />
                        <VideoSettings config={config} onChange={setConfig} />
                    </Stack>
                </Paper>
            </Grid.Col>
        </Grid>
    );
}
