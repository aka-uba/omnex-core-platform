'use client';

import React from 'react';
import { Stack, Group, NumberInput, Button, Paper, Title, Switch, Textarea } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/client';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { ClientIcon } from '@/components/common/ClientIcon';

interface SecurityTabProps {
    settings: any;
    onSave: (settings: any) => void;
    saving: boolean;
}

export function SecurityTab({ settings, onSave, saving }: SecurityTabProps) {
    const { t } = useTranslation('global');
    const [formData, setFormData] = React.useState({
        // Session Management
        sessionTimeout: settings.sessionTimeout || 30,
        maxConcurrentSessions: settings.maxConcurrentSessions || 5,
        rememberMeDuration: settings.rememberMeDuration || 30,

        // Password Policy
        passwordMinLength: settings.passwordMinLength || 8,
        passwordRequireUppercase: settings.passwordRequireUppercase ?? true,
        passwordRequireLowercase: settings.passwordRequireLowercase ?? true,
        passwordRequireNumbers: settings.passwordRequireNumbers ?? true,
        passwordRequireSpecial: settings.passwordRequireSpecial ?? false,
        passwordExpirationDays: settings.passwordExpirationDays || null,

        // Two-Factor Authentication
        twoFactorEnabled: settings.twoFactorEnabled ?? false,
        twoFactorRequiredForAdmins: settings.twoFactorRequiredForAdmins ?? false,

        // Login Security
        maxLoginAttempts: settings.maxLoginAttempts || 5,
        lockoutDuration: settings.lockoutDuration || 15,
        ipWhitelist: Array.isArray(settings.ipWhitelist) ? settings.ipWhitelist.join('\n') : '',

        // API Security
        apiRateLimit: settings.apiRateLimit || 100,
        apiKeyExpiration: settings.apiKeyExpiration || null,
    });

    // Update formData when settings prop changes (e.g., after API fetch)
    React.useEffect(() => {
        setFormData({
            sessionTimeout: settings.sessionTimeout || 30,
            maxConcurrentSessions: settings.maxConcurrentSessions || 5,
            rememberMeDuration: settings.rememberMeDuration || 30,
            passwordMinLength: settings.passwordMinLength || 8,
            passwordRequireUppercase: settings.passwordRequireUppercase ?? true,
            passwordRequireLowercase: settings.passwordRequireLowercase ?? true,
            passwordRequireNumbers: settings.passwordRequireNumbers ?? true,
            passwordRequireSpecial: settings.passwordRequireSpecial ?? false,
            passwordExpirationDays: settings.passwordExpirationDays || null,
            twoFactorEnabled: settings.twoFactorEnabled ?? false,
            twoFactorRequiredForAdmins: settings.twoFactorRequiredForAdmins ?? false,
            maxLoginAttempts: settings.maxLoginAttempts || 5,
            lockoutDuration: settings.lockoutDuration || 15,
            ipWhitelist: Array.isArray(settings.ipWhitelist) ? settings.ipWhitelist.join('\n') : '',
            apiRateLimit: settings.apiRateLimit || 100,
            apiKeyExpiration: settings.apiKeyExpiration || null,
        });
    }, [settings]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const submitData = {
            ...formData,
            ipWhitelist: formData.ipWhitelist ? formData.ipWhitelist.split('\n').filter((ip: string) => ip.trim()) : [],
        };
        onSave(submitData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stack gap="lg">
                {/* Session Management */}
                <Paper p="md" withBorder>
                    <Title order={5} mb="md">{t('settings.general.security.sessionManagement')}</Title>
                    <Stack gap="md">
                        <NumberInput
                            label={t('settings.general.security.sessionTimeout')}
                            value={formData.sessionTimeout}
                            onChange={(value) => setFormData({ ...formData, sessionTimeout: Number(value) || 30 })}
                            suffix={t('settings.general.security.minutesSuffix')}
                            min={1}
                            max={1440}
                        />
                        <NumberInput
                            label={t('settings.general.security.maxConcurrentSessions')}
                            value={formData.maxConcurrentSessions}
                            onChange={(value) => setFormData({ ...formData, maxConcurrentSessions: Number(value) || 5 })}
                            min={1}
                            max={20}
                        />
                        <NumberInput
                            label={t('settings.general.security.rememberMeDuration')}
                            value={formData.rememberMeDuration}
                            onChange={(value) => setFormData({ ...formData, rememberMeDuration: Number(value) || 30 })}
                            suffix={t('settings.general.security.daysSuffix')}
                            min={1}
                            max={365}
                        />
                    </Stack>
                </Paper>

                {/* Password Policy */}
                <Paper p="md" withBorder>
                    <Title order={5} mb="md">{t('settings.general.security.passwordPolicy')}</Title>
                    <Stack gap="md">
                        <NumberInput
                            label={t('settings.general.security.passwordMinLength')}
                            value={formData.passwordMinLength}
                            onChange={(value) => setFormData({ ...formData, passwordMinLength: Number(value) || 8 })}
                            min={4}
                            max={128}
                        />
                        <Switch
                            label={t('settings.general.security.requireUppercase')}
                            checked={formData.passwordRequireUppercase}
                            onChange={(e) => setFormData({ ...formData, passwordRequireUppercase: e.currentTarget.checked })}
                        />
                        <Switch
                            label={t('settings.general.security.requireLowercase')}
                            checked={formData.passwordRequireLowercase}
                            onChange={(e) => setFormData({ ...formData, passwordRequireLowercase: e.currentTarget.checked })}
                        />
                        <Switch
                            label={t('settings.general.security.requireNumbers')}
                            checked={formData.passwordRequireNumbers}
                            onChange={(e) => setFormData({ ...formData, passwordRequireNumbers: e.currentTarget.checked })}
                        />
                        <Switch
                            label={t('settings.general.security.requireSpecial')}
                            checked={formData.passwordRequireSpecial}
                            onChange={(e) => setFormData({ ...formData, passwordRequireSpecial: e.currentTarget.checked })}
                        />
                        <NumberInput
                            label={t('settings.general.security.passwordExpiration')}
                            value={formData.passwordExpirationDays || undefined}
                            onChange={(value) => setFormData({ ...formData, passwordExpirationDays: value ? Number(value) : null })}
                            suffix={t('settings.general.security.daysSuffix')}
                            placeholder={t('settings.general.security.noExpiration')}
                            min={1}
                            max={365}
                        />
                    </Stack>
                </Paper>

                {/* Two-Factor Authentication */}
                <Paper p="md" withBorder>
                    <Title order={5} mb="md">{t('settings.general.security.twoFactorAuth')}</Title>
                    <Stack gap="md">
                        <Switch
                            label={t('settings.general.security.enable2FA')}
                            checked={formData.twoFactorEnabled}
                            onChange={(e) => setFormData({ ...formData, twoFactorEnabled: e.currentTarget.checked })}
                        />
                        {formData.twoFactorEnabled && (
                            <Switch
                                label={t('settings.general.security.require2FAForAdmins')}
                                checked={formData.twoFactorRequiredForAdmins}
                                onChange={(e) => setFormData({ ...formData, twoFactorRequiredForAdmins: e.currentTarget.checked })}
                            />
                        )}
                    </Stack>
                </Paper>

                {/* Login Security */}
                <Paper p="md" withBorder>
                    <Title order={5} mb="md">{t('settings.general.security.loginSecurity')}</Title>
                    <Stack gap="md">
                        <NumberInput
                            label={t('settings.general.security.maxLoginAttempts')}
                            value={formData.maxLoginAttempts}
                            onChange={(value) => setFormData({ ...formData, maxLoginAttempts: Number(value) || 5 })}
                            min={1}
                            max={20}
                        />
                        <NumberInput
                            label={t('settings.general.security.lockoutDuration')}
                            value={formData.lockoutDuration}
                            onChange={(value) => setFormData({ ...formData, lockoutDuration: Number(value) || 15 })}
                            suffix={t('settings.general.security.minutesSuffix')}
                            min={1}
                            max={1440}
                        />
                        <Textarea
                            label={t('settings.general.security.ipWhitelist')}
                            value={formData.ipWhitelist}
                            onChange={(e) => setFormData({ ...formData, ipWhitelist: e.currentTarget.value })}
                            placeholder={t('settings.general.security.ipWhitelistPlaceholder')}
                            description={t('settings.general.security.ipWhitelistDescription')}
                            minRows={3}
                        />
                    </Stack>
                </Paper>

                {/* API Security */}
                <Paper p="md" withBorder>
                    <Title order={5} mb="md">{t('settings.general.security.apiSecurity')}</Title>
                    <Stack gap="md">
                        <NumberInput
                            label={t('settings.general.security.apiRateLimit')}
                            value={formData.apiRateLimit}
                            onChange={(value) => setFormData({ ...formData, apiRateLimit: Number(value) || 100 })}
                            suffix={t('settings.general.security.requestsPerMinuteSuffix')}
                            min={1}
                            max={10000}
                        />
                        <NumberInput
                            label={t('settings.general.security.apiKeyExpiration')}
                            value={formData.apiKeyExpiration || undefined}
                            onChange={(value) => setFormData({ ...formData, apiKeyExpiration: value ? Number(value) : null })}
                            suffix={t('settings.general.security.daysSuffix')}
                            placeholder={t('settings.general.security.noExpiration')}
                            min={1}
                            max={365}
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

