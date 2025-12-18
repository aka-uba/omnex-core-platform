'use client';

import { useEffect, useState } from 'react';
import {
    Stack,
    Group,
    Text,
    Switch,
    Button,
    Alert,
    Paper,
    Badge
} from '@mantine/core';
import {
    IconCheck,
    IconAlertCircle,
    IconGripVertical,
    IconEye,
    IconEyeOff
} from '@tabler/icons-react';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { MenuVisibilityTabSkeleton } from './MenuVisibilityTabSkeleton';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useQuery } from '@tanstack/react-query';

interface MenuVisibilityTabProps {
    lang: string;
    scope: { type: 'tenant' | 'role' | 'user'; id?: string };
}

interface MenuItemData {
    id: string;
    label: string;
    group: string;
    visible: boolean;
    order: number;
    href?: string;
    moduleSlug?: string;
}

export function MenuVisibilityTab({ scope, lang }: MenuVisibilityTabProps) {
    const { t } = useTranslation('global');
    const locale = lang || 'tr';

    // Fetch real menu items from menu-resolver API
    const { data: menuData, isLoading: menuDataLoading } = useQuery<{ success: boolean; data: { menu: any } }>({
        queryKey: ['menu-resolver', 'sidebar'],
        queryFn: async () => {
            const { fetchWithAuth } = await import('@/lib/api/fetchWithAuth');
            const response = await fetchWithAuth('/api/menu-resolver/sidebar');
            return response.json();
        },
    });

    // Fetch modules for additional menu items
    const { data: modulesData } = useQuery<{ success: boolean; modules: any[] }>({
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
        type: 'menu',
        ...(scope.type === 'user' && scope.id ? { userId: scope.id } : {}),
        ...(scope.type === 'role' && scope.id ? { roleId: scope.id } : {}),
        autoFetch: false
    });

    const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
    const [saving, setSaving] = useState(false);
    const [currentConfigId, setCurrentConfigId] = useState<string | null>(null);

    // Helper to get localized label
    const getLocalizedLabel = (label: any): string => {
        if (typeof label === 'string') return label;
        if (typeof label === 'object' && label !== null) {
            return label[locale] || label['en'] || label['tr'] || Object.values(label)[0] || '';
        }
        return '';
    };

    // Build menu items from API data
    useEffect(() => {
        if (menuDataLoading) return;

        const items: MenuItemData[] = [];

        // Add items from menu-resolver
        if (menuData?.success && menuData.data?.menu?.items) {
            menuData.data.menu.items.forEach((item: any, index: number) => {
                items.push({
                    id: item.id || `menu-${index}`,
                    label: getLocalizedLabel(item.label),
                    group: item.menuGroup || 'General',
                    visible: true,
                    order: item.order || index,
                    href: item.href,
                    moduleSlug: item.moduleSlug,
                });

                // Add children
                if (item.children?.length) {
                    item.children.forEach((child: any, childIndex: number) => {
                        items.push({
                            id: child.id || `menu-${index}-${childIndex}`,
                            label: `  └ ${getLocalizedLabel(child.label)}`,
                            group: item.menuGroup || 'General',
                            visible: true,
                            order: (item.order || index) + (childIndex + 1) * 0.1,
                            href: child.href,
                            moduleSlug: item.moduleSlug,
                        });
                    });
                }
            });
        }

        // Add modules that might not be in menu-resolver
        if (modulesData?.modules) {
            modulesData.modules.forEach((module: any, index: number) => {
                const existingItem = items.find(i => i.moduleSlug === module.slug);
                if (!existingItem && module.status === 'active') {
                    items.push({
                        id: `module-${module.slug}`,
                        label: module.name,
                        group: 'Modules',
                        visible: true,
                        order: 100 + index,
                        moduleSlug: module.slug,
                    });
                }
            });
        }

        // Sort by order
        items.sort((a, b) => a.order - b.order);

        setMenuItems(items);
    }, [menuData, modulesData, menuDataLoading, locale]);

    // Fetch configs when scope changes
    useEffect(() => {
        fetchConfigurations();
    }, [scope, fetchConfigurations]);

    // Update visibility from saved config
    useEffect(() => {
        if (configurations.length > 0 && menuItems.length > 0) {
            const config = configurations[0];
            const savedItems = config?.config?.items || [];
            setCurrentConfigId(config?.id ?? null);

            if (savedItems.length > 0) {
                // Merge saved visibility with current items
                setMenuItems(prev => prev.map(item => {
                    const savedItem = savedItems.find((s: any) => s.id === item.id);
                    return savedItem ? { ...item, visible: savedItem.visible, order: savedItem.order ?? item.order } : item;
                }).sort((a, b) => a.order - b.order));
            }
        } else if (configurations.length === 0) {
            setCurrentConfigId(null);
        }
    }, [configurations]);

    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const items = Array.from(menuItems);
        const [reorderedItem] = items.splice(result.source.index, 1);
        if (reorderedItem) {
            items.splice(result.destination.index, 0, reorderedItem);
        }

        // Update order property
        const updatedItems = items.map((item, index) => ({
            ...item,
            order: index
        }));

        setMenuItems(updatedItems);
    };

    const handleVisibilityToggle = (id: string) => {
        setMenuItems(prev => prev.map(item =>
            item.id === id ? { ...item, visible: !item.visible } : item
        ));
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            const configData = {
                items: menuItems.map(({ id, visible, order }) => ({ id, visible, order }))
            };

            if (currentConfigId) {
                await updateConfiguration(currentConfigId, {
                    config: configData
                });
            } else {
                const newConfig = await createConfiguration({
                    type: 'menu',
                    ...(scope.type === 'user' && scope.id ? { userId: scope.id } : {}),
                    ...(scope.type === 'role' && scope.id ? { roleId: scope.id } : {}),
                    config: configData
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
                message: t('accessControl.menu.saveSuccess'),
            });
        } catch (error) {
            showToast({
                type: 'error',
                title: t('notifications.error.title'),
                message: t('accessControl.menu.saveError'),
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading && !currentConfigId) {
        return <MenuVisibilityTabSkeleton />;
    }

    return (
        <Stack gap="lg">
            <Alert icon={<IconAlertCircle size={16} />} title={t('accessControl.scope.title')} color="blue" variant="light">
                {t('accessControl.menu.configuringFor')}
                {scope.type === 'tenant' 
                    ? t('accessControl.scope.tenant')
                    : scope.type === 'role'
                    ? `${t('accessControl.scope.role')} - ${scope.id || '(All)'}`
                    : `${t('accessControl.scope.user')} - ${scope.id || '(All)'}`}
            </Alert>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="menu-items">
                    {(provided) => (
                        <Stack
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            gap="xs"
                        >
                            {menuItems.map((item, index) => (
                                <Draggable key={item.id} draggableId={item.id} index={index}>
                                    {(provided, snapshot) => (
                                        <Paper
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            withBorder
                                            p="sm"
                                            bg={snapshot.isDragging ? 'var(--mantine-color-gray-0)' : 'white'}
                                            style={{
                                                ...provided.draggableProps.style,
                                                opacity: item.visible ? 1 : 0.6
                                            }}
                                        >
                                            <Group justify="space-between">
                                                <Group>
                                                    <div {...provided.dragHandleProps} style={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}>
                                                        <IconGripVertical size={18} color="gray" />
                                                    </div>
                                                    <Text fw={500}>{item.label}</Text>
                                                    <Badge variant="light" color="gray">{item.group}</Badge>
                                                </Group>

                                                <Group>
                                                    <Switch
                                                        checked={item.visible}
                                                        onChange={() => handleVisibilityToggle(item.id)}
                                                        onLabel={<IconEye size={14} />}
                                                        offLabel={<IconEyeOff size={14} />}
                                                    />
                                                </Group>
                                            </Group>
                                        </Paper>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </Stack>
                    )}
                </Droppable>
            </DragDropContext>

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
