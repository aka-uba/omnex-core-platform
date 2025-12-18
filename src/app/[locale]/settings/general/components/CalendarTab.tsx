'use client';

import React from 'react';
import { Stack, Group, TextInput, NumberInput, Select, Button, Paper, Title, Switch } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/client';
import { IconDeviceFloppy, IconBrandGoogle, IconBrandWindows, IconBrandApple, IconMail } from '@tabler/icons-react';
import { ClientIcon } from '@/components/common/ClientIcon';

interface CalendarTabProps {
    settings: any;
    onSave: (settings: any) => void;
    saving: boolean;
}

export function CalendarTab({ settings, onSave, saving }: CalendarTabProps) {
    const { t } = useTranslation('global');
    const integrations = settings.calendarIntegrations || {};
    
    const [formData, setFormData] = React.useState({
        calendarIntegrations: {
            google: {
                enabled: integrations.google?.enabled || false,
                apiKey: integrations.google?.apiKey || '',
                calendarId: integrations.google?.calendarId || '',
                syncInterval: integrations.google?.syncInterval || 60,
            },
            outlook: {
                enabled: integrations.outlook?.enabled || false,
                clientId: integrations.outlook?.clientId || '',
                tenantId: integrations.outlook?.tenantId || '',
                syncInterval: integrations.outlook?.syncInterval || 60,
            },
            icloud: {
                enabled: integrations.icloud?.enabled || false,
                calendarUrl: integrations.icloud?.calendarUrl || '',
                syncInterval: integrations.icloud?.syncInterval || 60,
            },
            yandex: {
                enabled: integrations.yandex?.enabled || false,
                token: integrations.yandex?.token || '',
                syncInterval: integrations.yandex?.syncInterval || 60,
            },
        },
        calendarDefaultView: settings.calendarDefaultView || 'month',
        calendarShowWeekends: settings.calendarShowWeekends ?? true,
        calendarShowHolidays: settings.calendarShowHolidays ?? true,
    });

    const viewOptions = [
        { value: 'month', label: t('settings.general.calendar.viewMonth') },
        { value: 'week', label: t('settings.general.calendar.viewWeek') },
        { value: 'day', label: t('settings.general.calendar.viewDay') },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const updateIntegration = (provider: string, field: string, value: any) => {
        setFormData({
            ...formData,
            calendarIntegrations: {
                ...formData.calendarIntegrations,
                [provider]: {
                    ...formData.calendarIntegrations[provider as keyof typeof formData.calendarIntegrations],
                    [field]: value,
                },
            },
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stack gap="lg">
                {/* Google Calendar */}
                <Paper p="md" withBorder>
                    <Group mb="md">
                        <ClientIcon>
                            <IconBrandGoogle size={20} />
                        </ClientIcon>
                        <Title order={5}>{t('settings.general.calendar.googleCalendar')}</Title>
                    </Group>
                    <Stack gap="md">
                        <Switch
                            label={t('settings.general.calendar.enable')}
                            checked={formData.calendarIntegrations.google.enabled}
                            onChange={(e) => updateIntegration('google', 'enabled', e.currentTarget.checked)}
                        />
                        {formData.calendarIntegrations.google.enabled && (
                            <>
                                <TextInput
                                    label={t('settings.general.calendar.apiKey')}
                                    value={formData.calendarIntegrations.google.apiKey}
                                    onChange={(e) => updateIntegration('google', 'apiKey', e.currentTarget.value)}
                                    type="password"
                                />
                                <TextInput
                                    label={t('settings.general.calendar.calendarId')}
                                    value={formData.calendarIntegrations.google.calendarId}
                                    onChange={(e) => updateIntegration('google', 'calendarId', e.currentTarget.value)}
                                />
                                <NumberInput
                                    label={t('settings.general.calendar.syncInterval')}
                                    value={formData.calendarIntegrations.google.syncInterval}
                                    onChange={(value) => updateIntegration('google', 'syncInterval', Number(value) || 60)}
                                    suffix={t('settings.general.security.minutesSuffix')}
                                    min={1}
                                />
                            </>
                        )}
                    </Stack>
                </Paper>

                {/* Microsoft Outlook */}
                <Paper p="md" withBorder>
                    <Group mb="md">
                        <ClientIcon>
                            <IconBrandWindows size={20} />
                        </ClientIcon>
                        <Title order={5}>{t('settings.general.calendar.outlook')}</Title>
                    </Group>
                    <Stack gap="md">
                        <Switch
                            label={t('settings.general.calendar.enable')}
                            checked={formData.calendarIntegrations.outlook.enabled}
                            onChange={(e) => updateIntegration('outlook', 'enabled', e.currentTarget.checked)}
                        />
                        {formData.calendarIntegrations.outlook.enabled && (
                            <>
                                <TextInput
                                    label={t('settings.general.calendar.clientId')}
                                    value={formData.calendarIntegrations.outlook.clientId}
                                    onChange={(e) => updateIntegration('outlook', 'clientId', e.currentTarget.value)}
                                />
                                <TextInput
                                    label={t('settings.general.calendar.tenantId')}
                                    value={formData.calendarIntegrations.outlook.tenantId}
                                    onChange={(e) => updateIntegration('outlook', 'tenantId', e.currentTarget.value)}
                                />
                                <NumberInput
                                    label={t('settings.general.calendar.syncInterval')}
                                    value={formData.calendarIntegrations.outlook.syncInterval}
                                    onChange={(value) => updateIntegration('outlook', 'syncInterval', Number(value) || 60)}
                                    suffix=" minutes"
                                    min={1}
                                />
                            </>
                        )}
                    </Stack>
                </Paper>

                {/* Apple iCloud */}
                <Paper p="md" withBorder>
                    <Group mb="md">
                        <ClientIcon>
                            <IconBrandApple size={20} />
                        </ClientIcon>
                        <Title order={5}>{t('settings.general.calendar.icloud')}</Title>
                    </Group>
                    <Stack gap="md">
                        <Switch
                            label={t('settings.general.calendar.enable')}
                            checked={formData.calendarIntegrations.icloud.enabled}
                            onChange={(e) => updateIntegration('icloud', 'enabled', e.currentTarget.checked)}
                        />
                        {formData.calendarIntegrations.icloud.enabled && (
                            <>
                                <TextInput
                                    label={t('settings.general.calendar.calendarUrl')}
                                    value={formData.calendarIntegrations.icloud.calendarUrl}
                                    onChange={(e) => updateIntegration('icloud', 'calendarUrl', e.currentTarget.value)}
                                    placeholder="https://..."
                                />
                                <NumberInput
                                    label={t('settings.general.calendar.syncInterval')}
                                    value={formData.calendarIntegrations.icloud.syncInterval}
                                    onChange={(value) => updateIntegration('icloud', 'syncInterval', Number(value) || 60)}
                                    suffix=" minutes"
                                    min={1}
                                />
                            </>
                        )}
                    </Stack>
                </Paper>

                {/* Yandex Calendar */}
                <Paper p="md" withBorder>
                    <Group mb="md">
                        <ClientIcon>
                            <IconMail size={20} />
                        </ClientIcon>
                        <Title order={5}>{t('settings.general.calendar.yandex')}</Title>
                    </Group>
                    <Stack gap="md">
                        <Switch
                            label={t('settings.general.calendar.enable')}
                            checked={formData.calendarIntegrations.yandex.enabled}
                            onChange={(e) => updateIntegration('yandex', 'enabled', e.currentTarget.checked)}
                        />
                        {formData.calendarIntegrations.yandex.enabled && (
                            <>
                                <TextInput
                                    label={t('settings.general.calendar.token')}
                                    value={formData.calendarIntegrations.yandex.token}
                                    onChange={(e) => updateIntegration('yandex', 'token', e.currentTarget.value)}
                                    type="password"
                                />
                                <NumberInput
                                    label={t('settings.general.calendar.syncInterval')}
                                    value={formData.calendarIntegrations.yandex.syncInterval}
                                    onChange={(value) => updateIntegration('yandex', 'syncInterval', Number(value) || 60)}
                                    suffix=" minutes"
                                    min={1}
                                />
                            </>
                        )}
                    </Stack>
                </Paper>

                {/* General Calendar Settings */}
                <Paper p="md" withBorder>
                    <Title order={5} mb="md">{t('settings.general.calendar.generalSettings')}</Title>
                    <Stack gap="md">
                        <Select
                            label={t('settings.general.calendar.defaultView')}
                            data={viewOptions}
                            value={formData.calendarDefaultView}
                            onChange={(value) => setFormData({ ...formData, calendarDefaultView: value || 'month' })}
                        />
                        <Switch
                            label={t('settings.general.calendar.showWeekends')}
                            checked={formData.calendarShowWeekends}
                            onChange={(e) => setFormData({ ...formData, calendarShowWeekends: e.currentTarget.checked })}
                        />
                        <Switch
                            label={t('settings.general.calendar.showHolidays')}
                            checked={formData.calendarShowHolidays}
                            onChange={(e) => setFormData({ ...formData, calendarShowHolidays: e.currentTarget.checked })}
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

