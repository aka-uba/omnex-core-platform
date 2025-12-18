'use client';

import React from 'react';
import { Stack, Group, Switch, Button, Paper, Title, Accordion, Text } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/client';
import { IconDeviceFloppy, IconBox } from '@tabler/icons-react';
import { ClientIcon } from '@/components/common/ClientIcon';

interface ModuleNotificationsTabProps {
    settings: any;
    modules: any[];
    onSave: (settings: any) => void;
    saving: boolean;
}

export function ModuleNotificationsTab({ settings, modules, onSave, saving }: ModuleNotificationsTabProps) {
    const { t } = useTranslation('global');
    const [formData, setFormData] = React.useState(() => {
        const moduleSettings = settings.moduleSettings || {};
        return modules.reduce((acc, module) => {
            acc[module.slug] = {
                enabled: moduleSettings[module.slug]?.enabled ?? true,
                channels: {
                    email: moduleSettings[module.slug]?.channels?.email ?? true,
                    push: moduleSettings[module.slug]?.channels?.push ?? true,
                    sms: moduleSettings[module.slug]?.channels?.sms ?? false,
                },
                types: moduleSettings[module.slug]?.types || {},
            };
            return acc;
        }, {} as Record<string, any>);
    });

    const handleModuleToggle = (moduleSlug: string, enabled: boolean) => {
        setFormData((prev: any) => ({
            ...prev,
            [moduleSlug]: {
                ...prev[moduleSlug],
                enabled,
            },
        }));
    };

    const handleChannelToggle = (moduleSlug: string, channel: 'email' | 'push' | 'sms', enabled: boolean) => {
        setFormData((prev: any) => ({
            ...prev,
            [moduleSlug]: {
                ...prev[moduleSlug],
                channels: {
                    ...prev[moduleSlug]?.channels,
                    [channel]: enabled,
                },
            },
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ moduleSettings: formData });
    };

    if (modules.length === 0) {
        return (
            <Paper p="md" withBorder>
                <Text c="dimmed">{t('settings.notifications.modules.noModules')}</Text>
            </Paper>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <Stack gap="lg">
                <Paper p="md" withBorder>
                    <Title order={5} mb="md">{t('settings.notifications.modules.title')}</Title>
                    <Text size="sm" c="dimmed" mb="lg">
                        {t('settings.notifications.modules.description')}
                    </Text>

                    <Accordion variant="separated">
                        {modules.map((module) => {
                            const moduleData = formData[module.slug] || {

                                channels: { email: true, push: true, sms: false },
                                types: {},
                            };

                            return (
                                <Accordion.Item key={module.slug} value={module.slug}>
                                    <Accordion.Control>
                                        <Group>
                                            <IconBox size={20} />
                                            <div>
                                                <Text fw={500}>{module.name}</Text>
                                                <Text size="xs" c="dimmed">
                                                    {module.description || module.slug}
                                                </Text>
                                            </div>
                                        </Group>
                                    </Accordion.Control>
                                    <Accordion.Panel>
                                        <Stack gap="md">
                                            <Switch
                                                label={t('settings.notifications.modules.enableModule')}
                                                description={t('settings.notifications.modules.enableModuleDescription') || `Enable notifications for ${module.name}`}
                                                checked={moduleData.enabled}
                                                onChange={(e) => handleModuleToggle(module.slug, e.currentTarget.checked)}
                                            />

                                            {moduleData.enabled && (
                                                <>
                                                    <Paper p="sm" withBorder bg="gray.0">
                                                        <Title order={6} mb="sm">{t('settings.notifications.modules.channels')}</Title>
                                                        <Stack gap="sm">
                                                            <Switch
                                                                label={t('settings.notifications.modules.channelEmail')}
                                                                checked={moduleData.channels.email}
                                                                onChange={(e) => handleChannelToggle(module.slug, 'email', e.currentTarget.checked)}
                                                            />
                                                            <Switch
                                                                label={t('settings.notifications.modules.channelPush')}
                                                                checked={moduleData.channels.push}
                                                                onChange={(e) => handleChannelToggle(module.slug, 'push', e.currentTarget.checked)}
                                                            />
                                                            <Switch
                                                                label={t('settings.notifications.modules.channelSMS')}
                                                                checked={moduleData.channels.sms}
                                                                onChange={(e) => handleChannelToggle(module.slug, 'sms', e.currentTarget.checked)}
                                                            />
                                                        </Stack>
                                                    </Paper>

                                                    {module.notificationSettings && module.notificationSettings.length > 0 && (
                                                        <Paper p="sm" withBorder bg="gray.0">
                                                            <Title order={6} mb="sm">{t('settings.notifications.modules.notificationTypes')}</Title>
                                                            <Stack gap="sm">
                                                                {module.notificationSettings.map((setting: any) => {
                                                                    const typeKey = setting.key;
                                                                    const typeEnabled = moduleData.types[typeKey]?.enabled ?? setting.defaultValue ?? true;
                                                                    
                                                                    return (
                                                                        <Switch
                                                                            key={typeKey}
                                                                            label={setting.label}
                                                                            description={setting.description}
                                                                            checked={typeEnabled}
                                                                            onChange={(e) => {
                                                                                setFormData((prev: any) => ({
                                                                                    ...prev,
                                                                                    [module.slug]: {
                                                                                        ...prev[module.slug],
                                                                                        types: {
                                                                                            ...prev[module.slug]?.types,
                                                                                            [typeKey]: {
                                                                                                enabled: e.currentTarget.checked,
                                                                                            },
                                                                                        },
                                                                                    },
                                                                                }));
                                                                            }}
                                                                        />
                                                                    );
                                                                })}
                                                            </Stack>
                                                        </Paper>
                                                    )}
                                                </>
                                            )}
                                        </Stack>
                                    </Accordion.Panel>
                                </Accordion.Item>
                            );
                        })}
                    </Accordion>
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

