'use client';

import { useEffect, useState } from 'react';
import {
    Stack,
    Group,
    Text,
    Switch,
    Button,
    Alert,
    Accordion,
    SimpleGrid,
    Card,
} from '@mantine/core';
import {
    IconCheck,
    IconAlertCircle,
    IconClick,
    IconTable,
    IconFilter,
    IconDownload
} from '@tabler/icons-react';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { UIFeaturesTabSkeleton } from './UIFeaturesTabSkeleton';

interface UIFeaturesTabProps {
    lang: string;
    scope: { type: 'tenant' | 'role' | 'user'; id?: string };
}

const UI_GROUPS = [
    {
        id: 'buttons',
        label: 'Action Buttons',
        icon: IconClick,
        features: [
            { id: 'create', label: 'Create Button', default: true },
            { id: 'edit', label: 'Edit Button', default: true },
            { id: 'delete', label: 'Delete Button', default: false },
            { id: 'export', label: 'Export Button', default: true },
            { id: 'import', label: 'Import Button', default: false },
        ]
    },
    {
        id: 'datatable',
        label: 'Data Table',
        icon: IconTable,
        features: [
            { id: 'bulk-actions', label: 'Bulk Actions', default: true },
            { id: 'column-visibility', label: 'Column Visibility', default: true },
            { id: 'density-toggle', label: 'Density Toggle', default: true },
            { id: 'fullscreen', label: 'Fullscreen Mode', default: true },
        ]
    },
    {
        id: 'filters',
        label: 'Filtering & Search',
        icon: IconFilter,
        features: [
            { id: 'advanced-filters', label: 'Advanced Filters', default: false },
            { id: 'saved-views', label: 'Saved Views', default: false },
            { id: 'global-search', label: 'Global Search', default: true },
        ]
    },
    {
        id: 'export',
        label: 'Export Options',
        icon: IconDownload,
        features: [
            { id: 'excel', label: 'Excel Export', default: true },
            { id: 'pdf', label: 'PDF Export', default: true },
            { id: 'csv', label: 'CSV Export', default: true },
            { id: 'print', label: 'Print', default: true },
        ]
    }
];

export function UIFeaturesTab({ scope }: Omit<UIFeaturesTabProps, 'lang'>) {
    const { t } = useTranslation('global');
    const {
        configurations,
        loading,
        fetchConfigurations,
        createConfiguration,
        updateConfiguration
    } = useAccessControl({
        type: 'ui',
        ...(scope.type === 'user' && scope.id ? { userId: scope.id } : {}),
        ...(scope.type === 'role' && scope.id ? { roleId: scope.id } : {}),
        autoFetch: false
    });

    const [localConfig, setLocalConfig] = useState<Record<string, any>>({});
    const [saving, setSaving] = useState(false);
    const [currentConfigId, setCurrentConfigId] = useState<string | null>(null);

    // Fetch configs when scope changes
    useEffect(() => {
        fetchConfigurations();
    }, [scope, fetchConfigurations]);

    // Update local state when configs are loaded
    useEffect(() => {
        if (configurations.length > 0) {
            const config = configurations[0];
            setLocalConfig(config?.config || {});
            setCurrentConfigId(config?.id || null);
        } else {
            // Set defaults
            const defaults: Record<string, any> = {};
            UI_GROUPS.forEach(group => {
                defaults[group.id] = {};
                group.features.forEach(feature => {
                    defaults[group.id][feature.id] = feature.default;
                });
            });
            setLocalConfig(defaults);
            setCurrentConfigId(null);
        }
    }, [configurations]);

    const handleToggle = (groupId: string, featureId: string, checked: boolean) => {
        setLocalConfig(prev => ({
            ...prev,
            [groupId]: {
                ...prev[groupId],
                [featureId]: checked
            }
        }));
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
                    type: 'ui',
                    ...(scope.type === 'user' && scope.id ? { userId: scope.id } : {}),
                    ...(scope.type === 'role' && scope.id ? { roleId: scope.id } : {}),
                    config: localConfig
                });
                if (newConfig) {
                    setCurrentConfigId(newConfig.id);
                }
            }

            // Dispatch event to refresh UI and other components
            window.dispatchEvent(new CustomEvent('access-control-saved'));

            showToast({
                type: 'success',
                title: t('notifications.success.title'),
                message: t('accessControl.ui.saveSuccess'),
            });
        } catch (error) {
            showToast({
                type: 'error',
                title: t('notifications.error.title'),
                message: t('accessControl.ui.saveError'),
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading && !localConfig) {
        return <UIFeaturesTabSkeleton />;
    }

    return (
        <Stack gap="lg">
            <Alert icon={<IconAlertCircle size={16} />} title={t('accessControl.scope.title')} color="blue" variant="light">
                {t('accessControl.ui.configuringFor')}
                {scope.type === 'tenant' 
                    ? t('accessControl.scope.tenant')
                    : scope.type === 'role'
                    ? `${t('accessControl.scope.role')} - ${scope.id || '(All)'}`
                    : `${t('accessControl.scope.user')} - ${scope.id || '(All)'}`}
            </Alert>

            <Accordion variant="separated" defaultValue="buttons">
                {UI_GROUPS.map(group => (
                    <Accordion.Item key={group.id} value={group.id}>
                        <Accordion.Control icon={<group.icon size={20} />}>
                            <Text fw={500}>{t(`accessControl.ui.groups.${group.id}`) || group.label}</Text>
                        </Accordion.Control>
                        <Accordion.Panel>
                            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                                {group.features.map(feature => {
                                    const isEnabled = localConfig[group.id]?.[feature.id] ?? feature.default;

                                    return (
                                        <Card key={feature.id} withBorder padding="sm">
                                            <Group justify="space-between">
                                                <Text>{t(`accessControl.ui.features.${feature.id}`) || feature.label}</Text>
                                                <Switch
                                                    checked={isEnabled}
                                                    onChange={(e) => handleToggle(group.id, feature.id, e.currentTarget.checked)}
                                                />
                                            </Group>
                                        </Card>
                                    );
                                })}
                            </SimpleGrid>
                        </Accordion.Panel>
                    </Accordion.Item>
                ))}
            </Accordion>

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
