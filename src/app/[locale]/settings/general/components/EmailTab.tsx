'use client';

import React, { useEffect } from 'react';
import { Stack, Group, TextInput, NumberInput, Select, Button, Paper, Title, Switch } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/client';
import { IconDeviceFloppy, IconMail } from '@tabler/icons-react';
import { ClientIcon } from '@/components/common/ClientIcon';
import { TestEmailModal } from './TestEmailModal';

interface EmailTabProps {
    settings: any;
    onSave: (settings: any) => void;
    saving: boolean;
}

export function EmailTab({ settings, onSave, saving }: EmailTabProps) {
    const { t } = useTranslation('global');
    const [testEmailModalOpened, setTestEmailModalOpened] = React.useState(false);
    const [formData, setFormData] = React.useState({
        smtpEnabled: settings.smtpEnabled || false,
        smtpHost: settings.smtpHost || '',
        smtpPort: settings.smtpPort || 587,
        smtpEncryption: settings.smtpEncryption || 'TLS',
        smtpUsername: settings.smtpUsername || '',
        smtpPassword: settings.smtpPassword || '',
        smtpFromName: settings.smtpFromName || '',
        smtpFromEmail: settings.smtpFromEmail || '',
        smtpTimeout: settings.smtpTimeout || 30000,
        smtpRetryAttempts: settings.smtpRetryAttempts || 3,
        smtpConnectionPool: settings.smtpConnectionPool || 5,
    });

    // Sync formData when settings change (e.g., after page refresh)
    useEffect(() => {
        setFormData({
            smtpEnabled: settings.smtpEnabled ?? false,
            smtpHost: settings.smtpHost || '',
            smtpPort: settings.smtpPort || 587,
            smtpEncryption: settings.smtpEncryption || 'TLS',
            smtpUsername: settings.smtpUsername || '',
            smtpPassword: settings.smtpPassword || '', // Note: Password may be empty if not changed
            smtpFromName: settings.smtpFromName || '',
            smtpFromEmail: settings.smtpFromEmail || '',
            smtpTimeout: settings.smtpTimeout || 30000,
            smtpRetryAttempts: settings.smtpRetryAttempts || 3,
            smtpConnectionPool: settings.smtpConnectionPool || 5,
        });
    }, [settings]);

    const encryptionOptions = [
        { value: 'TLS', label: 'TLS' },
        { value: 'SSL', label: 'SSL' },
        { value: 'None', label: t('settings.general.email.encryptionNone') },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const handleTestEmail = () => {
        setTestEmailModalOpened(true);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stack gap="lg">
                <Paper p="md" withBorder>
                    <Title order={5} mb="md">{t('settings.general.email.title')}</Title>
                    <Stack gap="md">
                        <Switch
                            label={t('settings.general.email.enableSmtp')}
                            checked={formData.smtpEnabled}
                            onChange={(e) => setFormData({ ...formData, smtpEnabled: e.currentTarget.checked })}
                        />

                        {formData.smtpEnabled && (
                            <>
                                <Group grow>
                                    <TextInput
                                        label={t('settings.general.email.smtpHost')}
                                        value={formData.smtpHost}
                                        onChange={(e) => setFormData({ ...formData, smtpHost: e.currentTarget.value })}
                                        placeholder={t('settings.general.email.smtpHostPlaceholder')}
                                    />
                                    <NumberInput
                                        label={t('settings.general.email.smtpPort')}
                                        value={formData.smtpPort}
                                        onChange={(value) => setFormData({ ...formData, smtpPort: Number(value) || 587 })}
                                        min={1}
                                        max={65535}
                                    />
                                </Group>
                                <Select
                                    label={t('settings.general.email.encryption')}
                                    data={encryptionOptions}
                                    value={formData.smtpEncryption}
                                    onChange={(value) => setFormData({ ...formData, smtpEncryption: value || 'TLS' })}
                                />
                                <Group grow>
                                    <TextInput
                                        label={t('settings.general.email.username')}
                                        value={formData.smtpUsername}
                                        onChange={(e) => setFormData({ ...formData, smtpUsername: e.currentTarget.value })}
                                    />
                                    <TextInput
                                        label={t('settings.general.email.password')}
                                        type="password"
                                        value={formData.smtpPassword}
                                        onChange={(e) => setFormData({ ...formData, smtpPassword: e.currentTarget.value })}
                                    />
                                </Group>
                                <Group grow>
                                    <TextInput
                                        label={t('settings.general.email.fromName')}
                                        value={formData.smtpFromName}
                                        onChange={(e) => setFormData({ ...formData, smtpFromName: e.currentTarget.value })}
                                    />
                                    <TextInput
                                        label={t('settings.general.email.fromEmail')}
                                        type="email"
                                        value={formData.smtpFromEmail}
                                        onChange={(e) => setFormData({ ...formData, smtpFromEmail: e.currentTarget.value })}
                                    />
                                </Group>
                                <Paper p="sm" withBorder bg="gray.0">
                                    <Title order={6} mb="sm">{t('settings.general.email.advanced')}</Title>
                                    <Group grow>
                                        <NumberInput
                                            label={t('settings.general.email.timeout')}
                                            value={formData.smtpTimeout}
                                            onChange={(value) => setFormData({ ...formData, smtpTimeout: Number(value) || 30000 })}
                                            suffix={t('settings.general.email.timeoutSuffix')}
                                        />
                                        <NumberInput
                                            label={t('settings.general.email.retryAttempts')}
                                            value={formData.smtpRetryAttempts}
                                            onChange={(value) => setFormData({ ...formData, smtpRetryAttempts: Number(value) || 3 })}
                                            min={1}
                                            max={10}
                                        />
                                        <NumberInput
                                            label={t('settings.general.email.connectionPool')}
                                            value={formData.smtpConnectionPool}
                                            onChange={(value) => setFormData({ ...formData, smtpConnectionPool: Number(value) || 5 })}
                                            min={1}
                                            max={20}
                                        />
                                    </Group>
                                </Paper>
                                <Button
                                    leftSection={
                                        <ClientIcon>
                                            <IconMail size={16} />
                                        </ClientIcon>
                                    }
                                    variant="light"
                                    onClick={handleTestEmail}
                                    disabled={!formData.smtpEnabled || !formData.smtpHost || !formData.smtpFromEmail}
                                >
                                    {t('settings.general.email.sendTestEmail')}
                                </Button>
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

            <TestEmailModal
                opened={testEmailModalOpened}
                onClose={() => setTestEmailModalOpened(false)}
                defaultEmail={formData.smtpFromEmail}
                smtpSettings={{
                    smtpEnabled: formData.smtpEnabled,
                    smtpHost: formData.smtpHost,
                    smtpFromEmail: formData.smtpFromEmail,
                }}
            />
        </form>
    );
}

