'use client';

import { useEffect, useState } from 'react';
import {
    Stack,
    Group,
    Switch,
    Button,
    Alert,
    Tabs,
    ColorInput,
    NumberInput,
    Radio
} from '@mantine/core';
import {
    IconCheck,
    IconAlertCircle,
    IconLayoutSidebar,
    IconLayoutNavbar,
    IconLayoutBottombar,
    IconMaximize
} from '@tabler/icons-react';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { LayoutCustomizationTabSkeleton } from './LayoutCustomizationTabSkeleton';

interface LayoutCustomizationTabProps {
    lang: string;
    scope: { type: 'tenant' | 'role' | 'user'; id?: string };
}

const DEFAULT_LAYOUT_CONFIG = {
    sidebar: {
        width: 280,
        background: '#ffffff',
        collapsed: false,
        position: 'left'
    },
    topLayout: {
        height: 64,
        background: '#ffffff',
        sticky: true
    },
    contentArea: {
        maxWidth: 1200,
        padding: 24,
        background: '#f8f9fa'
    },
    footer: {
        visible: true,
        height: 60,
        background: '#ffffff'
    }
};

export function LayoutCustomizationTab({ scope }: Omit<LayoutCustomizationTabProps, 'lang'>) {
    const { t } = useTranslation('global');
    const {
        configurations,
        loading,
        fetchConfigurations,
        createConfiguration,
        updateConfiguration
    } = useAccessControl({
        type: 'layout',
        ...(scope.type === 'user' && scope.id ? { userId: scope.id } : {}),
        ...(scope.type === 'role' && scope.id ? { roleId: scope.id } : {}),
        autoFetch: false
    });

    const [localConfig, setLocalConfig] = useState<any>(DEFAULT_LAYOUT_CONFIG);
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
            // Merge with defaults to ensure all fields exist
            setLocalConfig({
                ...DEFAULT_LAYOUT_CONFIG,
                ...config?.config,
                sidebar: { ...DEFAULT_LAYOUT_CONFIG.sidebar, ...(config?.config.sidebar || {}) },
                topLayout: { ...DEFAULT_LAYOUT_CONFIG.topLayout, ...(config?.config.topLayout || {}) },
                contentArea: { ...DEFAULT_LAYOUT_CONFIG.contentArea, ...(config?.config.contentArea || {}) },
                footer: { ...DEFAULT_LAYOUT_CONFIG.footer, ...(config?.config.footer || {}) },
            });
            setCurrentConfigId(config?.id ?? null);
        } else {
            setLocalConfig(DEFAULT_LAYOUT_CONFIG);
            setCurrentConfigId(null);
        }
    }, [configurations]);

    const updateConfig = (section: string, key: string, value: any) => {
        setLocalConfig((prev: any) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
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
                    type: 'layout',
                    ...(scope.type === 'user' && scope.id ? { userId: scope.id } : {}),
                    ...(scope.type === 'role' && scope.id ? { roleId: scope.id } : {}),
                    config: localConfig
                });
                if (newConfig) {
                    setCurrentConfigId(newConfig.id);
                }
            }

            // Dispatch event to refresh layout and other components
            window.dispatchEvent(new CustomEvent('access-control-saved'));

            showToast({
                type: 'success',
                title: t('notifications.success.title'),
                message: t('accessControl.layout.saveSuccess'),
            });
        } catch (error) {
            showToast({
                type: 'error',
                title: t('notifications.error.title'),
                message: t('accessControl.layout.saveError'),
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading && !currentConfigId) {
        return <LayoutCustomizationTabSkeleton />;
    }

    return (
        <Stack gap="lg">
            <Alert icon={<IconAlertCircle size={16} />} title={t('accessControl.scope.title')} color="blue" variant="light">
                {t('accessControl.layout.configuringFor')}
                {scope.type === 'tenant' 
                    ? t('accessControl.scope.tenant')
                    : scope.type === 'role'
                    ? `${t('accessControl.scope.role')} - ${scope.id || '(All)'}`
                    : `${t('accessControl.scope.user')} - ${scope.id || '(All)'}`}
            </Alert>

            <Tabs defaultValue="sidebar">
                <Tabs.List>
                    <Tabs.Tab value="sidebar" leftSection={<IconLayoutSidebar size={16} />}>
                        {t('accessControl.layout.sidebar')}
                    </Tabs.Tab>
                    <Tabs.Tab value="top" leftSection={<IconLayoutNavbar size={16} />}>
                        {t('accessControl.layout.topLayout')}
                    </Tabs.Tab>
                    <Tabs.Tab value="content" leftSection={<IconMaximize size={16} />}>
                        {t('accessControl.layout.contentArea')}
                    </Tabs.Tab>
                    <Tabs.Tab value="footer" leftSection={<IconLayoutBottombar size={16} />}>
                        {t('accessControl.layout.footer')}
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="sidebar" pt="md">
                    <Stack gap="md" maw={400}>
                        <NumberInput
                            label={t('accessControl.layout.width')}
                            value={localConfig.sidebar.width}
                            onChange={(val) => updateConfig('sidebar', 'width', val)}
                            min={200}
                            max={400}
                        />
                        <ColorInput
                            label={t('accessControl.layout.backgroundColor')}
                            value={localConfig.sidebar.background}
                            onChange={(val) => updateConfig('sidebar', 'background', val)}
                        />
                        <Radio.Group
                            label={t('accessControl.layout.position')}
                            value={localConfig.sidebar.position}
                            onChange={(val) => updateConfig('sidebar', 'position', val)}
                        >
                            <Group mt="xs">
                                <Radio value="left" label={t('accessControl.layout.left')} />
                                <Radio value="right" label={t('accessControl.layout.right')} />
                            </Group>
                        </Radio.Group>
                        <Switch
                            label={t('accessControl.layout.collapsed')}
                            checked={localConfig.sidebar.collapsed}
                            onChange={(e) => updateConfig('sidebar', 'collapsed', e.currentTarget.checked)}
                        />
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="top" pt="md">
                    <Stack gap="md" maw={400}>
                        <NumberInput
                            label={t('accessControl.layout.height')}
                            value={localConfig.topLayout.height}
                            onChange={(val) => updateConfig('topLayout', 'height', val)}
                            min={40}
                            max={120}
                        />
                        <ColorInput
                            label={t('accessControl.layout.backgroundColor')}
                            value={localConfig.topLayout.background}
                            onChange={(val) => updateConfig('topLayout', 'background', val)}
                        />
                        <Switch
                            label={t('accessControl.layout.sticky')}
                            checked={localConfig.topLayout.sticky}
                            onChange={(e) => updateConfig('topLayout', 'sticky', e.currentTarget.checked)}
                        />
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="content" pt="md">
                    <Stack gap="md" maw={400}>
                        <NumberInput
                            label={t('accessControl.layout.maxWidth')}
                            description={t('accessControl.layout.maxWidthDescription')}
                            value={localConfig.contentArea.maxWidth}
                            onChange={(val) => updateConfig('contentArea', 'maxWidth', val)}
                            min={0}
                            max={3000}
                        />
                        <NumberInput
                            label={t('accessControl.layout.padding')}
                            value={localConfig.contentArea.padding}
                            onChange={(val) => updateConfig('contentArea', 'padding', val)}
                            min={0}
                            max={100}
                        />
                        <ColorInput
                            label={t('accessControl.layout.backgroundColor')}
                            value={localConfig.contentArea.background}
                            onChange={(val) => updateConfig('contentArea', 'background', val)}
                        />
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="footer" pt="md">
                    <Stack gap="md" maw={400}>
                        <Switch
                            label={t('accessControl.layout.visible')}
                            checked={localConfig.footer.visible}
                            onChange={(e) => updateConfig('footer', 'visible', e.currentTarget.checked)}
                        />
                        {localConfig.footer.visible && (
                            <>
                                <NumberInput
                                    label={t('accessControl.layout.height')}
                                    value={localConfig.footer.height}
                                    onChange={(val) => updateConfig('footer', 'height', val)}
                                    min={20}
                                    max={200}
                                />
                                <ColorInput
                                    label={t('accessControl.layout.backgroundColor')}
                                    value={localConfig.footer.background}
                                    onChange={(val) => updateConfig('footer', 'background', val)}
                                />
                            </>
                        )}
                    </Stack>
                </Tabs.Panel>
            </Tabs>

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
