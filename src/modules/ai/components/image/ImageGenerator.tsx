'use client';

import { useState } from 'react';
import { Box, Grid, Paper, Title, Stack } from '@mantine/core';
import { ImageSettings } from './ImageSettings';
import { ImageGallery } from './ImageGallery';
import { AIInput } from '../shared/AIInput';
import { ModelSelector } from '../shared/ModelSelector';
import { AIModel, GenerationConfig, GeneratedContent } from '../../types';
import { useTranslation } from '@/lib/i18n/client';

const MOCK_IMAGE_MODELS: AIModel[] = [
    { id: 'dall-e-3', name: 'DALL-E 3', provider: 'openai', type: 'image', description: 'High quality generation' },
    { id: 'midjourney-v6', name: 'Midjourney v6', provider: 'midjourney', type: 'image', description: 'Artistic and detailed' },
    { id: 'stable-diffusion-xl', name: 'Stable Diffusion XL', provider: 'stability', type: 'image', description: 'Fast and controllable' },
];

export function ImageGenerator() {
    const { t } = useTranslation('modules/ai');
    const [selectedModel, setSelectedModel] = useState<string | null>('dall-e-3');
    const [config, setConfig] = useState<GenerationConfig>({
        modelId: 'dall-e-3',
        aspectRatio: '1:1',
        resolution: '1024x1024',
        style: 'photorealistic'
    });
    const [generatedImages, setGeneratedImages] = useState<GeneratedContent[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = (prompt: string) => {
        setIsGenerating(true);

        // Simulate generation
        setTimeout(() => {
            const newImage: GeneratedContent = {
                id: Date.now().toString(),
                type: 'image',
                url: `https://source.unsplash.com/random/800x800?${encodeURIComponent(prompt)}&sig=${Math.random()}`,
                prompt,
                createdAt: new Date(),
                modelId: selectedModel || '',
                metadata: {
                    resolution: config.resolution,
                    style: config.style
                }
            };

            setGeneratedImages(prev => [newImage, ...prev]);
            setIsGenerating(false);
        }, 2000);
    };

    return (
        <Grid h="100%" gutter={0}>
            <Grid.Col span={{ base: 12, md: 9 }} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                    <Title order={3}>{t('imageGenerator')}</Title>
                </Box>

                <Box flex={1} p="md" style={{ overflowY: 'auto' }}>
                    <ImageGallery images={generatedImages} />
                </Box>

                <Box p="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)', backgroundColor: 'var(--mantine-color-body)' }}>
                    <AIInput
                        onSend={handleGenerate}
                        isLoading={isGenerating}
                        placeholder={t('imagePromptPlaceholder')}
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
                            models={MOCK_IMAGE_MODELS}
                        />
                        <ImageSettings config={config} onChange={setConfig} />
                    </Stack>
                </Paper>
            </Grid.Col>
        </Grid>
    );
}
