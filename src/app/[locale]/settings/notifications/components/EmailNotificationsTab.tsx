'use client';

import React from 'react';
import { Stack, Group, Switch, Button, Paper, Title, Checkbox } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/client';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { ClientIcon } from '@/components/common/ClientIcon';

interface EmailNotificationsTabProps {
    settings: any;
    onSave: (settings: any) => void;
    saving: boolean;
}

export function EmailNotificationsTab({ settings, onSave, saving }: EmailNotificationsTabProps) {
    const { t } = useTranslation('global');
    const [formData, setFormData] = React.useState({
        emailEnabled: settings.emailEnabled ?? true,
        emailSystemNotifications: settings.emailSystemNotifications ?? true,
        emailUserNotifications: settings.emailUserNotifications ?? true,
        emailModuleNotifications: settings.emailModuleNotifications || {},
    });

    // notificationTypes removed - unused

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stack gap="lg">
                <Paper p="md" withBorder>
                    <Title order={5} mb="md">{t('settings.notifications.email.title')}</Title>
                    <Stack gap="md">
                        <Switch
                            label={t('settings.notifications.email.enable')}
                            description={t('settings.notifications.email.enableDescription')}
                            checked={formData.emailEnabled}
                            onChange={(e) => setFormData({ ...formData, emailEnabled: e.currentTarget.checked })}
                        />

                        {formData.emailEnabled && (
                            <>
                                <Paper p="sm" withBorder bg="gray.0">
                                    <Title order={6} mb="sm">{t('settings.notifications.email.notificationTypes')}</Title>
                                    <Stack gap="sm">
                                        <Checkbox
                                            label={t('settings.notifications.email.types.system')}
                                            description={t('settings.notifications.email.types.systemDescription')}
                                            checked={formData.emailSystemNotifications}
                                            onChange={(e) => setFormData({ ...formData, emailSystemNotifications: e.currentTarget.checked })}
                                        />
                                        <Checkbox
                                            label={t('settings.notifications.email.types.user')}
                                            description={t('settings.notifications.email.types.userDescription')}
                                            checked={formData.emailUserNotifications}
                                            onChange={(e) => setFormData({ ...formData, emailUserNotifications: e.currentTarget.checked })}
                                        />
                                        <Checkbox
                                            label={t('settings.notifications.email.types.module')}
                                            description={t('settings.notifications.email.types.moduleDescription')}
                                            checked={Object.keys(formData.emailModuleNotifications || {}).length > 0}
                                            onChange={(e) => {
                                                if (!e.currentTarget.checked) {
                                                    setFormData({ ...formData, emailModuleNotifications: {} });
                                                } else {
                                                    setFormData({ ...formData, emailModuleNotifications: { enabled: true } });
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









