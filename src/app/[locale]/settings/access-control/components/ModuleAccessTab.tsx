'use client';

import { useEffect, useState } from 'react';
import {
    Stack,
    Group,
    Text,
    Switch,
    Card,
    SimpleGrid,
    ThemeIcon,
    Checkbox,
    Button,
    Alert
} from '@mantine/core';
import {
    IconCheck,
    IconAlertCircle
} from '@tabler/icons-react';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useQuery } from '@tanstack/react-query';
import { ModuleIcon } from '@/lib/modules/icon-loader';
import { ModuleAccessTabSkeleton } from './ModuleAccessTabSkeleton';

interface ModuleAccessTabProps {
    scope: { type: 'tenant' | 'role' | 'user'; id?: string };
}

interface Module {
    id: string;
    slug: string;
    name: string;
    description?: string;
    icon?: string;
    status: string;
    metadata?: {
        color?: string;
        features?: string[];
    };
}

export function ModuleAccessTab({ scope }: ModuleAccessTabProps) {
    const { t } = useTranslation('global');
    // Fetch modules from API
    const { data: modulesData, isLoading: modulesLoading } = useQuery<{ success: boolean; modules: Module[] }>({
        queryKey: ['modules'],
        queryFn: async () => {
            const response = await fetch('/api/modules');
            return response.json();
        },
    });

    const {
        configurations,
        loading,
        fetchConfigurations,
        createConfiguration,
        updateConfiguration
    } = useAccessControl({
        type: 'module',
        ...(scope.type === 'user' && scope.id ? { userId: scope.id } : {}),
        ...(scope.type === 'role' && scope.id ? { roleId: scope.id } : {}),
        autoFetch: false
    });

    const [localConfig, setLocalConfig] = useState<Record<string, any>>({});
    const [saving, setSaving] = useState(false);
    const [currentConfigId, setCurrentConfigId] = useState<string | null>(null);

    // Get available modules from API response
    const availableModules = modulesData?.modules || [];

    // Fetch configs when scope changes
    useEffect(() => {
        fetchConfigurations();
    }, [scope, fetchConfigurations]);

    // Update local state when configs are loaded
    useEffect(() => {
        if (configurations.length > 0) {
            // Find the most relevant config based on scope
            const config = configurations[0]; // API returns sorted by priority
            setLocalConfig(config?.config || {});
            setCurrentConfigId(config?.id ?? null);
        } else {
            setLocalConfig({});
            setCurrentConfigId(null);
        }
    }, [configurations]);

    const handleModuleToggle = (slug: string, checked: boolean) => {
        setLocalConfig(prev => ({
            ...prev,
            [slug]: {
                ...prev[slug],
                enabled: checked
            }
        }));
    };

    const handleFeatureToggle = (moduleSlug: string, feature: string, checked: boolean) => {
        setLocalConfig(prev => {
            const moduleConfig = prev[moduleSlug] || { features: [] };
            const currentFeatures = moduleConfig.features || [];

            let newFeatures;
            if (checked) {
                newFeatures = [...currentFeatures, feature];
            } else {
                newFeatures = currentFeatures.filter((f: string) => f !== feature);
            }

            return {
                ...prev,
                [moduleSlug]: {
                    ...moduleConfig,
                    features: newFeatures
                }
            };
        });
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            if (currentConfigId) {
                await updateConfiguration(currentConfigId, {
                    config: localConfig
                });
            } else {
                const newConfig = await createConfiguration({
                    type: 'module',
                    ...(scope.type === 'user' && scope.id ? { userId: scope.id } : {}),
                    ...(scope.type === 'role' && scope.id ? { roleId: scope.id } : {}),
                    config: localConfig
                });
                if (newConfig) {
                    setCurrentConfigId(newConfig.id);
                }
            }

            // Dispatch event to refresh menu and other components
            window.dispatchEvent(new CustomEvent('access-control-saved'));

            showToast({
                type: 'success',
                title: t('notifications.success.title'),
                message: t('accessControl.modules.saveSuccess'),
            });
        } catch (error) {
            showToast({
                type: 'error',
                title: t('notifications.error.title'),
                message: t('accessControl.modules.saveError'),
            });
        } finally {
            setSaving(false);
        }
    };

    if ((loading && !localConfig) || modulesLoading) {
        return <ModuleAccessTabSkeleton />;
    }

    if (!availableModules.length) {
        return (
            <Alert icon={<IconAlertCircle size={16} />} title={t('accessControl.modules.noModules')} color="yellow" variant="light">
                {t('accessControl.modules.noModulesDescription')}
            </Alert>
        );
    }

    return (
        <Stack gap="lg">
            <Alert icon={<IconAlertCircle size={16} />} title={t('accessControl.scope.title')} color="blue" variant="light">
                {t('accessControl.scope.configuringFor')}
                {scope.type === 'tenant' 
                    ? t('accessControl.scope.tenant')
                    : scope.type === 'role'
                    ? `${t('accessControl.scope.role')} - ${scope.id || '(All)'}`
                    : `${t('accessControl.scope.user')} - ${scope.id || '(All)'}`}
            </Alert>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                {availableModules.map((module) => {
                    const isEnabled = localConfig[module.slug]?.enabled ?? false;
                    const activeFeatures = localConfig[module.slug]?.features || [];
                    const moduleColor = module.metadata?.color || 'blue';
                    const moduleFeatures = module.metadata?.features || [];

                    return (
                        <Card key={module.slug} withBorder padding="lg" radius="md" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <Stack gap="md" style={{ flex: 1 }}>
                                {/* Icon and Title Section */}
                                <Group gap="sm" align="flex-start">
                                    <ThemeIcon color={moduleColor} variant="light">
                                        <ModuleIcon {...(module.icon ? { icon: module.icon, iconName: module.icon } : {})} size={20} />
                                    </ThemeIcon>
                                    <div style={{ flex: 1 }}>
                                        <Text fw={600}>{module.name}</Text>
                                        {module.description && (
                                            <Text c="dimmed" mt={4}>{module.description}</Text>
                                        )}
                                    </div>
                                </Group>

                                {/* Features Section */}
                                {isEnabled && moduleFeatures.length > 0 && (
                                    <Stack gap="xs" mt="sm">
                                        <Text fw={500} c="dimmed">
                                            {t('accessControl.modules.features')}
                                        </Text>
                                        {moduleFeatures.map(feature => (
                                            <Checkbox
                                                key={feature}
                                                label={t(`accessControl.modules.feature.${feature}`) || feature.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                                checked={activeFeatures.includes(feature)}
                                                onChange={(e) => handleFeatureToggle(module.slug, feature, e.currentTarget.checked)}
                                            />
                                        ))}
                                    </Stack>
                                )}

                                {/* Switch at bottom right */}
                                <Group justify="flex-end" pt="md" style={{ marginTop: 'auto' }}>
                                    <Switch
                                        checked={isEnabled}
                                        onChange={(e) => handleModuleToggle(module.slug, e.currentTarget.checked)}
                                        label={isEnabled
                                            ? t('accessControl.modules.enabled')
                                            : t('accessControl.modules.disabled')
                                        }
                                        color={isEnabled ? 'teal' : 'gray'}
                                        styles={{
                                            track: {
                                                backgroundColor: isEnabled ? undefined : 'var(--mantine-color-gray-6)',
                                            },
                                            label: {
                                                color: isEnabled ? 'var(--mantine-color-teal-6)' : 'var(--mantine-color-gray-6)',
                                            }
                                        }}
                                    />
                                </Group>
                            </Stack>
                        </Card>
                    );
                })}
            </SimpleGrid>

            <Group justify="flex-end" mt="xl">
                <Button
                    onClick={handleSave}
                    loading={saving}
                    leftSection={<IconCheck size={16} />}
                >
                    {t('buttons.save')}
                </Button>
            </Group>
        </Stack>
    );
}
