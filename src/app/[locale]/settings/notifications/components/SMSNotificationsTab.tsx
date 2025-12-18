'use client';

import React from 'react';
import { Stack, Group, Switch, Button, Paper, Title, Checkbox, TextInput, Select } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/client';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { ClientIcon } from '@/components/common/ClientIcon';

interface SMSNotificationsTabProps {
    settings: any;
    onSave: (settings: any) => void;
    saving: boolean;
}

export function SMSNotificationsTab({ settings, onSave, saving }: SMSNotificationsTabProps) {
    const { t } = useTranslation('global');
    const [formData, setFormData] = React.useState({
        smsEnabled: settings.smsEnabled ?? false,
        smsProvider: settings.smsProvider || null,
        smsApiKey: settings.smsApiKey || '',
        smsApiSecret: settings.smsApiSecret || '',
        smsFromNumber: settings.smsFromNumber || '',
        smsSystemNotifications: settings.smsSystemNotifications ?? false,
        smsUserNotifications: settings.smsUserNotifications ?? false,
        smsModuleNotifications: settings.smsModuleNotifications || {},
    });

    const smsProviders = [
        { value: 'twilio', label: 'Twilio' },
        { value: 'nexmo', label: 'Nexmo (Vonage)' },
        { value: 'custom', label: t('settings.notifications.sms.providerCustom') },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stack gap="lg">
                <Paper p="md" withBorder>
                    <Title order={5} mb="md">{t('settings.notifications.sms.title')}</Title>
                    <Stack gap="md">
                        <Switch
                            label={t('settings.notifications.sms.enable')}
                            description={t('settings.notifications.sms.enableDescription')}
                            checked={formData.smsEnabled}
                            onChange={(e) => setFormData({ ...formData, smsEnabled: e.currentTarget.checked })}
                        />

                        {formData.smsEnabled && (
                            <>
                                <Select
                                    label={t('settings.notifications.sms.provider')}
                                    description={t('settings.notifications.sms.providerDescription')}
                                    data={smsProviders}
                                    value={formData.smsProvider || ''}
                                    onChange={(value) => setFormData({ ...formData, smsProvider: value || null })}
                                />

                                {formData.smsProvider && (
                                    <>
                                        <TextInput
                                            label={t('settings.notifications.sms.apiKey')}
                                            type="password"
                                            value={formData.smsApiKey}
                                            onChange={(e) => setFormData({ ...formData, smsApiKey: e.currentTarget.value })}
                                            placeholder={t('settings.notifications.sms.apiKeyPlaceholder')}
                                        />
                                        <TextInput
                                            label={t('settings.notifications.sms.apiSecret')}
                                            type="password"
                                            value={formData.smsApiSecret}
                                            onChange={(e) => setFormData({ ...formData, smsApiSecret: e.currentTarget.value })}
                                            placeholder={t('settings.notifications.sms.apiSecretPlaceholder')}
                                        />
                                        <TextInput
                                            label={t('settings.notifications.sms.fromNumber')}
                                            value={formData.smsFromNumber}
                                            onChange={(e) => setFormData({ ...formData, smsFromNumber: e.currentTarget.value })}
                                            placeholder={t('settings.notifications.sms.fromNumberPlaceholder')}
                                        />
                                    </>
                                )}

                                <Paper p="sm" withBorder bg="gray.0">
                                    <Title order={6} mb="sm">{t('settings.notifications.sms.notificationTypes')}</Title>
                                    <Stack gap="sm">
                                        <Checkbox
                                            label={t('settings.notifications.sms.types.system')}
                                            description={t('settings.notifications.sms.types.systemDescription')}
                                            checked={formData.smsSystemNotifications}
                                            onChange={(e) => setFormData({ ...formData, smsSystemNotifications: e.currentTarget.checked })}
                                        />
                                        <Checkbox
                                            label={t('settings.notifications.sms.types.user')}
                                            description={t('settings.notifications.sms.types.userDescription')}
                                            checked={formData.smsUserNotifications}
                                            onChange={(e) => setFormData({ ...formData, smsUserNotifications: e.currentTarget.checked })}
                                        />
                                        <Checkbox
                                            label={t('settings.notifications.sms.types.module')}
                                            description={t('settings.notifications.sms.types.moduleDescription')}
                                            checked={Object.keys(formData.smsModuleNotifications || {}).length > 0}
                                            onChange={(e) => {
                                                if (!e.currentTarget.checked) {
                                                    setFormData({ ...formData, smsModuleNotifications: {} });
                                                } else {
                                                    setFormData({ ...formData, smsModuleNotifications: { enabled: true } });
                                                }
                                            }}
                                        />
                                    </Stack>
                                </Paper>
                            </>
                        )}
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
















