'use client';

import { Stack, Select, Text, SegmentedControl, Slider, Box } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/client';
import { GenerationConfig } from '../../types';

interface VideoSettingsProps {
    config: GenerationConfig;
    onChange: (config: GenerationConfig) => void;
}

export function VideoSettings({ config, onChange }: VideoSettingsProps) {
    const { t } = useTranslation('modules/ai');

    const handleChange = (key: keyof GenerationConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <Stack gap="md">
            <Box>
                <Text size="sm" fw={500} mb={4}>{t('videoSettings.aspectRatio')}</Text>
                <SegmentedControl
                    fullWidth
                    value={config.aspectRatio || '16:9'}
                    onChange={(val) => handleChange('aspectRatio', val)}
                    data={[
                        { label: '16:9', value: '16:9' },
                        { label: '9:16', value: '9:16' },
                        { label: '1:1', value: '1:1' },
                    ]}
                />
            </Box>

            <Select
                label={t('videoSettings.style')}
                placeholder={t('videoSettings.selectStyle')}
                {...(config.style ? { value: config.style } : {})}
                onChange={(val) => handleChange('style', val)}
                data={[
                    { value: 'realistic', label: 'Realistic' },
                    { value: 'anime', label: 'Anime' },
                    { value: '3d-animation', label: '3D Animation' },
                    { value: 'cinematic', label: 'Cinematic' },
                ]}
            />

            <Select
                label={t('videoSettings.resolution')}
                placeholder={t('videoSettings.selectResolution')}
                {...(config.resolution ? { value: config.resolution } : {})}
                onChange={(val) => handleChange('resolution', val)}
                data={[
                    { value: '1080p', label: '1080p' },
                    { value: '720p', label: '720p' },
                    { value: '4k', label: '4K' },
                ]}
            />

            <Box>
                <Text size="sm" fw={500} mb={4}>{t('videoSettings.duration')}</Text>
                <Slider
                    value={config.maxTokens ? config.maxTokens / 10 : 5} // Using maxTokens as proxy for duration in seconds
                    onChange={(val) => handleChange('maxTokens', val * 10)}
                    min={2}
                    max={10}
                    step={1}
                    label={(val) => `${val}s`}
                />
            </Box>

            <Box>
                <Text size="sm" fw={500} mb={4}>{t('videoSettings.motion')}</Text>
                <Slider
                    value={config.temperature ? config.temperature * 100 : 50}
                    onChange={(val) => handleChange('temperature', val / 100)}
                    label={(val) => `${val}%`}
                />
            </Box>
        </Stack>
    );
}
