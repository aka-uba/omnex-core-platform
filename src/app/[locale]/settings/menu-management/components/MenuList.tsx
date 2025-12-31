import { useState } from 'react';
import {
    Paper,
    Title,
    Button,
    Stack,
    Group,
    Text,
    ActionIcon,
    Menu as MantineMenu,
    TextInput,
    Modal,
    Badge,
    Skeleton,
    ScrollArea
} from '@mantine/core';
import { AlertModal } from '@/components/modals/AlertModal';
import {
    IconPlus,
    IconDotsVertical,
    IconEdit,
    IconTrash,
    IconCopy,
    IconMenu2
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useTranslation } from '@/lib/i18n/client';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';
import { ClientIcon } from '@/components/common/ClientIcon';

interface Menu {
    id: string;
    name: string;
    slug: string;
    locale: string;
    isActive: boolean;
    items: any[];
}

// Recursive function to count all menu items including children
const countMenuItems = (items: any[]): number => {
    if (!items || items.length === 0) return 0;
    return items.reduce((count, item) => {
        return count + 1 + countMenuItems(item.children || []);
    }, 0);
};

interface MenuListProps {
    menus: Menu[];
    activeMenuId: string | null;
    onSelectMenu: (menuId: string) => void;
    onMenuCreated: () => void;
    onMenuUpdated: () => void;
    onMenuDeleted: () => void;
    isLoading: boolean;
}

export function MenuList({
    menus,
    activeMenuId,
    onSelectMenu,
    onMenuCreated,
    onMenuUpdated,
    onMenuDeleted,
    isLoading
}: MenuListProps) {
    const { t } = useTranslation('modules/menu-management');
    const [createModalOpen, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);
    const [editModalOpen, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
    const [deleteModalOpen, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

    const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
    const [formData, setFormData] = useState({ name: '', slug: '', locale: 'tr' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreate = async () => {
        if (!formData.name || !formData.slug) return;

        setIsSubmitting(true);
        try {
            const response = await fetchWithAuth('/api/menus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                showToast({
                    type: 'success',
                    title: t('success'),
                    message: t('menuCreated'),
                });
                closeCreateModal();
                setFormData({ name: '', slug: '', locale: 'tr' });
                onMenuCreated();
                onSelectMenu(result.data.id);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            showToast({
                type: 'error',
                title: t('error'),
                message: error instanceof Error ? error.message : t('createError'),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedMenu || !formData.name || !formData.slug) return;

        setIsSubmitting(true);
        try {
            const response = await fetchWithAuth('/api/menus', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedMenu.id,
                    ...formData
                }),
            });

            const result = await response.json();

            if (result.success) {
                showToast({
                    type: 'success',
                    title: t('success'),
                    message: t('menuUpdated'),
                });
                closeEditModal();
                onMenuUpdated();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            showToast({
                type: 'error',
                title: t('error'),
                message: error instanceof Error ? error.message : t('updateError'),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedMenu) return;

        setIsSubmitting(true);
        try {
            const response = await fetchWithAuth(`/api/menus?id=${selectedMenu.id}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                showToast({
                    type: 'success',
                    title: t('success'),
                    message: t('menuDeleted'),
                });
                closeDeleteModal();
                onMenuDeleted();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            showToast({
                type: 'error',
                title: t('error'),
                message: error instanceof Error ? error.message : t('deleteError'),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDuplicate = async (menu: Menu) => {
        setIsSubmitting(true);
        try {
            const response = await fetchWithAuth(`/api/menus/${menu.id}/duplicate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `${menu.name} (Copy)`,
                    slug: `${menu.slug}-copy-${Date.now()}`
                }),
            });

            const result = await response.json();

            if (result.success) {
                showToast({
                    type: 'success',
                    title: t('success'),
                    message: t('menuDuplicated'),
                });
                onMenuCreated();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            showToast({
                type: 'error',
                title: t('error'),
                message: error instanceof Error ? error.message : t('duplicateError'),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEdit = (menu: Menu) => {
        setSelectedMenu(menu);
        setFormData({ name: menu.name, slug: menu.slug, locale: menu.locale });
        openEditModal();
    };

    const openDelete = (menu: Menu) => {
        setSelectedMenu(menu);
        openDeleteModal();
    };

    return (
        <Paper p="md" withBorder h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
            <Group justify="space-between" mb="md">
                <Title order={4}>{t('menus')}</Title>
                <Button
                    leftSection={
                        <ClientIcon>
                            <IconPlus size={16} />
                        </ClientIcon>
                    }
                    size="xs"
                    onClick={() => {
                        setFormData({ name: '', slug: '', locale: 'tr' });
                        openCreateModal();
                    }}
                >
                    {t('createMenu')}
                </Button>
            </Group>

            {isLoading ? (
                <Stack gap="md" p="md">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Group key={i} gap="md">
                            <Skeleton height={60} width="100%" radius="md" />
                        </Group>
                    ))}
                </Stack>
            ) : (
                <ScrollArea style={{ flex: 1 }}>
                    <Stack gap="xs">
                        {menus.length === 0 ? (
                            <Text c="dimmed" size="sm" ta="center" py="xl">
                                {t('noMenusFound')}
                            </Text>
                        ) : (
                            menus.map((menu) => (
                                <Paper
                                    key={menu.id}
                                    p="sm"
                                    withBorder
                                    style={{
                                        cursor: 'pointer',
                                        backgroundColor: activeMenuId === menu.id ? 'var(--mantine-color-blue-light)' : undefined,
                                        borderColor: activeMenuId === menu.id ? 'var(--mantine-color-blue-filled)' : undefined,
                                    }}
                                    onClick={() => onSelectMenu(menu.id)}
                                >
                                    <Group justify="space-between" wrap="nowrap">
                                        <Group gap="xs" wrap="nowrap">
                                            <IconMenu2 size={18} color={activeMenuId === menu.id ? 'var(--mantine-color-blue-filled)' : 'gray'} />
                                            <div>
                                                <Text size="sm" fw={500}>{menu.name}</Text>
                                                <Group gap={4}>
                                                    <Badge size="xs" variant="light" color="gray">{menu.locale}</Badge>
                                                    <Text size="xs" c="dimmed">{countMenuItems(menu.items)} {t('items')}</Text>
                                                </Group>
                                            </div>
                                        </Group>

                                        <MantineMenu position="bottom-end" withinPortal>
                                            <MantineMenu.Target>
                                                <ActionIcon variant="subtle" size="sm" onClick={(e) => e.stopPropagation()}>
                                                    <IconDotsVertical size={16} />
                                                </ActionIcon>
                                            </MantineMenu.Target>
                                            <MantineMenu.Dropdown>
                                                <MantineMenu.Item
                                                    leftSection={
                                                        <ClientIcon>
                                                            <IconEdit size={14} />
                                                        </ClientIcon>
                                                    }
                                                    onClick={(e) => { e.stopPropagation(); openEdit(menu); }}
                                                >
                                                    {t('edit')}
                                                </MantineMenu.Item>
                                                <MantineMenu.Item
                                                    leftSection={
                                                        <ClientIcon>
                                                            <IconCopy size={14} />
                                                        </ClientIcon>
                                                    }
                                                    onClick={(e) => { e.stopPropagation(); handleDuplicate(menu); }}
                                                >
                                                    {t('duplicate')}
                                                </MantineMenu.Item>
                                                <MantineMenu.Divider />
                                                <MantineMenu.Item
                                                    leftSection={<IconTrash size={14} />}
                                                    color="red"
                                                    onClick={(e) => { e.stopPropagation(); openDelete(menu); }}
                                                >
                                                    {t('delete')}
                                                </MantineMenu.Item>
                                            </MantineMenu.Dropdown>
                                        </MantineMenu>
                                    </Group>
                                </Paper>
                            ))
                        )}
                    </Stack>
                </ScrollArea>
            )}

            {/* Create Modal */}
            <Modal opened={createModalOpen} onClose={closeCreateModal} title={t('createNewMenu')}>
                <Stack>
                    <TextInput
                        label={t('menuName')}
                        placeholder={t('enterMenuName')}
                        required
                        value={formData.name}
                        onChange={(e) => {
                            const name = e.currentTarget.value;
                            // Auto-generate slug from name with Turkish character support
                            const slug = name
                                .toLowerCase()
                                .replace(/ğ/g, 'g')
                                .replace(/ü/g, 'u')
                                .replace(/ş/g, 's')
                                .replace(/ı/g, 'i')
                                .replace(/ö/g, 'o')
                                .replace(/ç/g, 'c')
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/(^-|-$)/g, '');
                            setFormData({ ...formData, name, slug });
                        }}
                    />
                    <TextInput
                        label={t('menuSlug')}
                        placeholder="main-menu"
                        required
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.currentTarget.value })}
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={closeCreateModal}>{t('cancel')}</Button>
                        <Button onClick={handleCreate} loading={isSubmitting}>{t('create')}</Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Edit Modal */}
            <Modal opened={editModalOpen} onClose={closeEditModal} title={t('editMenu')}>
                <Stack>
                    <TextInput
                        label={t('menuName')}
                        placeholder={t('enterMenuName')}
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.currentTarget.value })}
                    />
                    <TextInput
                        label={t('menuSlug')}
                        placeholder="main-menu"
                        required
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.currentTarget.value })}
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="light" onClick={closeEditModal}>{t('cancel')}</Button>
                        <Button onClick={handleUpdate} loading={isSubmitting}>{t('save')}</Button>
                    </Group>
                </Stack>
            </Modal>

            <AlertModal
                opened={deleteModalOpen}
                onClose={closeDeleteModal}
                title={t('deleteMenu')}
                message={`${t('deleteConfirmation')} ${selectedMenu?.name ? `"${selectedMenu.name}"` : 'this item'}?`}
                variant="danger"
                loading={isSubmitting}
                onConfirm={handleDelete}
                confirmLabel={t('delete')}
                cancelLabel={t('cancel')}
            />
        </Paper>
    );
}
