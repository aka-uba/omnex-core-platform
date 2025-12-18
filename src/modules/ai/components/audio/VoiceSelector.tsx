'use client';

import { Select, Group, Text, Avatar, ActionIcon } from '@mantine/core';
import { IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/client';

interface Voice {
    id: string;
    name: string;
    gender: 'male' | 'female';
    accent: string;
    previewUrl: string;
}

interface VoiceSelectorProps {
    value: string | null;
    onChange: (value: string | null) => void;
    label?: string;
}

const MOCK_VOICES: Voice[] = [
    { id: 'rachel', name: 'Rachel', gender: 'female', accent: 'American', previewUrl: '#' },
    { id: 'drew', name: 'Drew', gender: 'male', accent: 'American', previewUrl: '#' },
    { id: 'clyde', name: 'Clyde', gender: 'male', accent: 'American', previewUrl: '#' },
    { id: 'mimi', name: 'Mimi', gender: 'female', accent: 'Australian', previewUrl: '#' },
    { id: 'fin', name: 'Fin', gender: 'male', accent: 'Irish', previewUrl: '#' },
];

export function VoiceSelector({ value, onChange, label }: VoiceSelectorProps) {
    const { t } = useTranslation('modules/ai');
    const [playing, setPlaying] = useState<string | null>(null);

    const togglePreview = (voiceId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (playing === voiceId) {
            setPlaying(null);
        } else {
            setPlaying(voiceId);
            // Simulate playing
            setTimeout(() => setPlaying(null), 3000);
        }
    };

    return (
        <Select
            label={label}
            placeholder={t('selectVoice')}
            data={MOCK_VOICES.map(v => ({ value: v.id, label: v.name, ...v }))}
            value={value}
            onChange={onChange}
            renderOption={({ option, checked }) => {
                const voice = MOCK_VOICES.find(v => v.id === option.value);
                if (!voice) return null;

                return (
                    <Group flex="1" gap="xs">
                        <Avatar size="sm" radius="xl" color={voice.gender === 'female' ? 'pink' : 'blue'}>
                            {voice.name[0]}
                        </Avatar>
                        <div style={{ flex: 1 }}>
                            <Text size="sm">{voice.name}</Text>
                            <Text size="xs" c="dimmed">
                                {voice.gender === 'female' ? 'Female' : 'Male'} • {voice.accent}
                            </Text>
                        </div>
                        <ActionIcon
                            variant="subtle"
                            color={playing === voice.id ? 'red' : 'gray'}
                            onClick={(e) => togglePreview(voice.id, e)}
                        >
                            {playing === voice.id ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
                        </ActionIcon>
                    </Group>
                );
            }}
        />
    );
}
