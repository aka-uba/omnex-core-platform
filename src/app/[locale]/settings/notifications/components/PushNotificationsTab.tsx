'use client';

import React from 'react';
import { Stack, Group, Switch, Button, Paper, Title, Checkbox } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/client';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { ClientIcon } from '@/components/common/ClientIcon';

interface PushNotificationsTabProps {
    settings: any;
    onSave: (settings: any) => void;
    saving: boolean;
}

export function PushNotificationsTab({ settings, onSave, saving }: PushNotificationsTabProps) {
    const { t } = useTranslation('global');
    const [formData, setFormData] = React.useState({
        pushEnabled: settings.pushEnabled ?? true,
        pushBrowserEnabled: settings.pushBrowserEnabled ?? true,
        pushMobileEnabled: settings.pushMobileEnabled ?? false,
        pushSystemNotifications: settings.pushSystemNotifications ?? true,
        pushUserNotifications: settings.pushUserNotifications ?? true,
        pushModuleNotifications: settings.pushModuleNotifications || {},
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stack gap="lg">
                <Paper p="md" withBorder>
                    <Title order={5} mb="md">{t('settings.notifications.push.title')}</Title>
                    <Stack gap="md">
                        <Switch
                            label={t('settings.notifications.push.enable')}
                            description={t('settings.notifications.push.enableDescription')}
                            checked={formData.pushEnabled}
                            onChange={(e) => setFormData({ ...formData, pushEnabled: e.currentTarget.checked })}
                        />

                        {formData.pushEnabled && (
                            <>
                                <Paper p="sm" withBorder bg="gray.0">
                                    <Title order={6} mb="sm">{t('settings.notifications.push.channels')}</Title>
                                    <Stack gap="sm">
                                        <Switch
                                            label={t('settings.notifications.push.browser')}
                                            description={t('settings.notifications.push.browserDescription')}
                                            checked={formData.pushBrowserEnabled}
                                            onChange={(e) => setFormData({ ...formData, pushBrowserEnabled: e.currentTarget.checked })}
                                        />
                                        <Switch
                                            label={t('settings.notifications.push.mobile')}
                                            description={t('settings.notifications.push.mobileDescription')}
                                            checked={formData.pushMobileEnabled}
                                            onChange={(e) => setFormData({ ...formData, pushMobileEnabled: e.currentTarget.checked })}
                                        />
                                    </Stack>
                                </Paper>

                                <Paper p="sm" withBorder bg="gray.0">
                                    <Title order={6} mb="sm">{t('settings.notifications.push.notificationTypes')}</Title>
                                    <Stack gap="sm">
                                        <Checkbox
                                            label={t('settings.notifications.push.types.system')}
                                            description={t('settings.notifications.push.types.systemDescription')}
                                            checked={formData.pushSystemNotifications}
                                            onChange={(e) => setFormData({ ...formData, pushSystemNotifications: e.currentTarget.checked })}
                                        />
                                        <Checkbox
                                            label={t('settings.notifications.push.types.user')}
                                            description={t('settings.notifications.push.types.userDescription')}
                                            checked={formData.pushUserNotifications}
                                            onChange={(e) => setFormData({ ...formData, pushUserNotifications: e.currentTarget.checked })}
                                        />
                                        <Checkbox
                                            label={t('settings.notifications.push.types.module')}
                                            description={t('settings.notifications.push.types.moduleDescription')}
                                            checked={Object.keys(formData.pushModuleNotifications || {}).length > 0}
                                            onChange={(e) => {
                                                if (!e.currentTarget.checked) {
                                                    setFormData({ ...formData, pushModuleNotifications: {} });
                                                } else {
                                                    setFormData({ ...formData, pushModuleNotifications: { enabled: true } });
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
















