'use client';

import { Select, Group, Text, Avatar } from '@mantine/core';
import { IconBrain } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { AIModel } from '../../types';

interface ModelSelectorProps {
    value: string | null;
    onChange: (value: string | null) => void;
    models: AIModel[];
    label?: string;
}

export function ModelSelector({ value, onChange, models, label }: ModelSelectorProps) {
    const { t } = useTranslation('modules/ai');

    const selectData = models.map(model => ({
        value: model.id,
        label: model.name,
        description: model.description,
        provider: model.provider
    }));

    return (
        <Select
            label={label}
            placeholder={t('selectModel')}
            data={selectData}
            value={value}
            onChange={onChange}
            leftSection={<IconBrain size={16} />}
            searchable
            clearable
            renderOption={({ option, checked }) => (
                <Group flex="1" gap="xs">
                    <Avatar size="sm" radius="xl" color="blue">
                        {option.label[0]}
                    </Avatar>
                    <div>
                        <Text size="sm">{option.label}</Text>
                        <Text size="xs" c="dimmed">
                            {(option as any).description}
                        </Text>
                    </div>
                    {checked && <IconBrain size={16} style={{ marginLeft: 'auto' }} />}
                </Group>
            )}
        />
    );
}
