'use client';

import { useState } from 'react';
import { Box, Grid, Title, Stack, Text, Paper } from '@mantine/core';
import { VoiceSelector } from './VoiceSelector';
import { AudioPlayer } from './AudioPlayer';
import { AIInput } from '../shared/AIInput';
import { ModelSelector } from '../shared/ModelSelector';
import { AIModel, GeneratedContent } from '../../types';
import { useTranslation } from '@/lib/i18n/client';

const MOCK_AUDIO_MODELS: AIModel[] = [
    { id: 'eleven-multilingual-v2', name: 'Eleven Multilingual v2', provider: 'elevenlabs', type: 'audio', description: 'Best for speech' },
    { id: 'tts-1-hd', name: 'OpenAI TTS HD', provider: 'openai', type: 'audio', description: 'High quality speech' },
];

export function AudioGenerator() {
    const { t } = useTranslation('modules/ai');
    const [selectedModel, setSelectedModel] = useState<string | null>('eleven-multilingual-v2');
    const [selectedVoice, setSelectedVoice] = useState<string | null>('rachel');
    const [generatedAudio, setGeneratedAudio] = useState<GeneratedContent[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = (prompt: string) => {
        setIsGenerating(true);

        // Simulate generation
        setTimeout(() => {
            const newAudio: GeneratedContent = {
                id: Date.now().toString(),
                type: 'audio',
                url: '#',
                prompt,
                createdAt: new Date(),
                modelId: selectedModel || '',
                metadata: {
                    voiceId: selectedVoice,
                    duration: '0:45'
                }
            };

            setGeneratedAudio(prev => [newAudio, ...prev]);
            setIsGenerating(false);
        }, 2000);
    };

    return (
        <Grid h="100%" gutter={0}>
            <Grid.Col span={{ base: 12, md: 8 }} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                    <Title order={3}>{t('audioGenerator')}</Title>
                </Box>

                <Box flex={1} p="md" style={{ overflowY: 'auto' }}>
                    <Stack gap="md">
                        {generatedAudio.length === 0 ? (
                            <Box h={200} display="flex" style={{ alignItems: 'center', justifyContent: 'center' }}>
                                <Text c="dimmed">{t('noAudioGenerated')}</Text>
                            </Box>
                        ) : (
                            generatedAudio.map((audio) => (
                                <AudioPlayer
                                    key={audio.id}
                                    src={audio.url || ''}
                                    title={audio.prompt}
                                    duration={audio.metadata?.duration || '0:00'}
                                />
                            ))
                        )}
                    </Stack>
                </Box>

                <Box p="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)', backgroundColor: 'var(--mantine-color-body)' }}>
                    <AIInput
                        onSend={handleGenerate}
                        isLoading={isGenerating}
                        placeholder={t('audioPromptPlaceholder')}
                        allowVoice={false}
                        allowAttachments={false}
                    />
                </Box>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }} style={{ borderLeft: '1px solid var(--mantine-color-default-border)' }}>
                <Paper h="100%" p="md" radius={0} style={{ backgroundColor: 'var(--mantine-color-body)' }}>
                    <Stack gap="xl">
                        <ModelSelector
                            label={t('model')}
                            value={selectedModel}
                            onChange={setSelectedModel}
                            models={MOCK_AUDIO_MODELS}
                        />

                        <VoiceSelector
                            label={t('voice')}
                            value={selectedVoice}
                            onChange={setSelectedVoice}
                        />
                    </Stack>
                </Paper>
            </Grid.Col>
        </Grid>
    );
}
