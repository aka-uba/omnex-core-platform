'use client';

import { Stack, Select, NumberInput, Text, SegmentedControl, Slider, Box } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/client';
import { GenerationConfig } from '../../types';

interface ImageSettingsProps {
    config: GenerationConfig;
    onChange: (config: GenerationConfig) => void;
}

export function ImageSettings({ config, onChange }: ImageSettingsProps) {
    const { t } = useTranslation('modules/ai');

    const handleChange = (key: keyof GenerationConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <Stack gap="md">
            <Box>
                <Text size="sm" fw={500} mb={4}>{t('imageSettings.aspectRatio')}</Text>
                <SegmentedControl
                    fullWidth
                    value={config.aspectRatio || '1:1'}
                    onChange={(val) => handleChange('aspectRatio', val)}
                    data={[
                        { label: '1:1', value: '1:1' },
                        { label: '16:9', value: '16:9' },
                        { label: '9:16', value: '9:16' },
                        { label: '4:3', value: '4:3' },
                    ]}
                />
            </Box>

            <Select
                label={t('imageSettings.style')}
                placeholder={t('imageSettings.selectStyle')}
                {...(config.style ? { value: config.style } : {})}
                onChange={(val) => handleChange('style', val)}
                data={[
                    { value: 'photorealistic', label: 'Photorealistic' },
                    { value: 'anime', label: 'Anime' },
                    { value: 'digital-art', label: 'Digital Art' },
                    { value: 'oil-painting', label: 'Oil Painting' },
                    { value: '3d-render', label: '3D Render' },
                ]}
            />

            <Select
                label={t('imageSettings.resolution')}
                placeholder={t('imageSettings.selectResolution')}
                {...(config.resolution ? { value: config.resolution } : {})}
                onChange={(val) => handleChange('resolution', val)}
                data={[
                    { value: '1024x1024', label: '1024x1024' },
                    { value: '512x512', label: '512x512' },
                    { value: '1920x1080', label: '1920x1080' },
                ]}
            />

            <Box>
                <Text size="sm" fw={500} mb={4}>{t('imageSettings.quality')}</Text>
                <Slider
                    value={config.temperature ? config.temperature * 100 : 70}
                    onChange={(val) => handleChange('temperature', val / 100)}
                    label={(val) => `${val}%`}
                />
            </Box>

            <NumberInput
                label={t('imageSettings.numberOfImages')}
                min={1}
                max={4}
                defaultValue={1}
            />
        </Stack>
    );
}
