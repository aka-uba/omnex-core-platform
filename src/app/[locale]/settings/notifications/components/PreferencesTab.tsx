'use client';

import React from 'react';
import { Stack, Group, Switch, Button, Paper, Title, NumberInput, TextInput } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/client';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { ClientIcon } from '@/components/common/ClientIcon';

interface PreferencesTabProps {
    settings: any;
    onSave: (settings: any) => void;
    saving: boolean;
}

export function PreferencesTab({ settings, onSave, saving }: PreferencesTabProps) {
    const { t } = useTranslation('global');
    const [formData, setFormData] = React.useState({
        reminderTime: settings.reminderTime || 15,
        quietHoursStart: settings.quietHoursStart || null,
        quietHoursEnd: settings.quietHoursEnd || null,
        notificationSound: settings.notificationSound ?? true,
        notificationSoundFile: settings.notificationSoundFile || null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stack gap="lg">
                <Paper p="md" withBorder>
                    <Title order={5} mb="md">{t('settings.notifications.preferences.title')}</Title>
                    <Stack gap="md">
                        <NumberInput
                            label={t('settings.notifications.preferences.reminderTime')}
                            description={t('settings.notifications.preferences.reminderTimeDescription')}
                            value={formData.reminderTime}
                            onChange={(value) => setFormData({ ...formData, reminderTime: Number(value) || 15 })}
                            suffix={t('settings.general.security.minutesSuffix')}
                            min={1}
                            max={1440}
                        />

                        <Paper p="sm" withBorder bg="gray.0">
                            <Title order={6} mb="sm">{t('settings.notifications.preferences.quietHours')}</Title>
                            <Group grow>
                                <TextInput
                                    label={t('settings.notifications.preferences.quietHoursStart')}
                                    type="time"
                                    value={formData.quietHoursStart || ''}
                                    onChange={(e) => setFormData({ ...formData, quietHoursStart: e.currentTarget.value || null })}
                                    placeholder="HH:mm"
                                />
                                <TextInput
                                    label={t('settings.notifications.preferences.quietHoursEnd')}
                                    type="time"
                                    value={formData.quietHoursEnd || ''}
                                    onChange={(e) => setFormData({ ...formData, quietHoursEnd: e.currentTarget.value || null })}
                                    placeholder="HH:mm"
                                />
                            </Group>
                        </Paper>

                        <Switch
                            label={t('settings.notifications.preferences.notificationSound')}
                            description={t('settings.notifications.preferences.notificationSoundDescription')}
                            checked={formData.notificationSound}
                            onChange={(e) => setFormData({ ...formData, notificationSound: e.currentTarget.checked })}
                        />
                    </Stack>
                </Paper>

                <Group justify="flex-end">
                    <Button
                        type="submit"
                        leftSection={
                            <ClientIcon>
                                <IconDeviceFloppy size={16} />
                            </ClientIcon>
                        }
                        loading={saving}
                    >
                        {t('save')}
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}

