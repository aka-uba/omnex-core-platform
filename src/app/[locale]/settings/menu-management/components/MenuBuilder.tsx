import { useState, useEffect } from 'react';
import {
    Paper,
    Title,
    Button,
    Stack,
    Group,
    Text,
    ActionIcon,
    Badge,
    Tooltip
} from '@mantine/core';
import {
    IconTrash,
    IconGripVertical,
    IconChevronDown,
    IconChevronRight,
    IconEdit,
    IconDeviceFloppy,
    IconArrowRight,
    IconArrowLeft
} from '@tabler/icons-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useTranslation } from '@/lib/i18n/client';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';
import { useParams } from 'next/navigation';

interface MenuItem {
    id: string;
    label: any; // Json
    href: string;
    icon?: string;
    target?: string;
    cssClass?: string;
    parentId?: string | null;
    children?: MenuItem[];
    order: number;
    visible: boolean;
    menuGroup?: string;
    depth?: number; // For UI only
}

interface MenuBuilderProps {
    menuId: string;
    items: MenuItem[];
    onUpdateItems: () => void;
    onEditItem: (item: MenuItem) => void;
}

// Helper to flatten tree for drag and drop
const flattenTree = (items: MenuItem[], depth = 0): MenuItem[] => {
    let flat: MenuItem[] = [];

    // Sort by order
    const sorted = [...items].sort((a, b) => a.order - b.order);

    sorted.forEach(item => {
        flat.push({ ...item, depth });
        if (item.children && item.children.length > 0) {
            flat = flat.concat(flattenTree(item.children, depth + 1));
        }
    });

    return flat;
};

export function MenuBuilder({ menuId, items, onUpdateItems, onEditItem }: MenuBuilderProps) {
    const { t: tGlobal } = useTranslation('global');
    const t = (key: string) => tGlobal(`settings.menuManagement.${key}`);
    const { confirm, ConfirmDialog } = useConfirmDialog();
    const params = useParams();
    const locale = (params?.locale as string) || 'tr';
    const [flatItems, setFlatItems] = useState<MenuItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

    useEffect(() => {
        setFlatItems(flattenTree(items));
    }, [items]);

    const toggleExpand = (id: string) => {
        setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Helper to get all descendant indices of an item (children, grandchildren, etc.)
    const getDescendantIndices = (items: MenuItem[], parentIndex: number): number[] => {
        const parentItem = items[parentIndex];
        if (!parentItem) return [];

        const parentDepth = parentItem.depth || 0;
        const descendants: number[] = [];

        // Look at items after the parent
        for (let i = parentIndex + 1; i < items.length; i++) {
            const item = items[i];
            const itemDepth = item?.depth || 0;

            // If depth is greater than parent, it's a descendant
            if (itemDepth > parentDepth) {
                descendants.push(i);
            } else {
                // If depth is same or less, we've exited the subtree
                break;
            }
        }

        return descendants;
    };

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;

        if (sourceIndex === destinationIndex) return;

        const newItems = Array.from(flatItems);

        // Get all descendants of the moved item
        const descendantIndices = getDescendantIndices(newItems, sourceIndex);
        const itemsToMove = [sourceIndex, ...descendantIndices];

        // Extract items to move (in order)
        const movedItems = itemsToMove.map(idx => newItems[idx]).filter(Boolean) as MenuItem[];

        // Remove items from their original positions (from end to start to preserve indices)
        for (let i = itemsToMove.length - 1; i >= 0; i--) {
            const idx = itemsToMove[i];
            if (idx !== undefined) {
                newItems.splice(idx, 1);
            }
        }

        // Calculate adjusted destination index
        // If moving down, we need to account for removed items
        let adjustedDestination = destinationIndex;
        if (destinationIndex > sourceIndex) {
            adjustedDestination = destinationIndex - movedItems.length + 1;
        }

        // Insert all moved items at destination
        newItems.splice(adjustedDestination, 0, ...movedItems);

        setFlatItems(newItems);
    };

    const handleSaveOrder = async () => {
        setIsSaving(true);
        try {
            // Reconstruct tree or send flat list with parentIds updated
            // For simplicity, we'll send a flat list with updated order and parentIds
            // We need to calculate parentIds based on depth


            // This is a simplified logic - in a real app we'd need robust tree reconstruction
            // For now, let's just save the order of the current structure
            // If we want to support changing hierarchy, we need "Indent/Outdent" buttons

            // Let's implement Indent/Outdent logic first

            // Re-calculate orders
            const updates = flatItems.map((item, index) => ({
                id: item.id,
                order: index,
                parentId: item.parentId // This needs to be updated if we change hierarchy
            }));

            const response = await fetchWithAuth(`/api/menus/${menuId}/items/reorder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: updates }),
            });

            const result = await response.json();

            if (result.success) {
                showToast({
                    type: 'success',
                    title: t('success'),
                    message: t('orderSaved'),
                });
                // Trigger menu update event to refresh menus in sidebar/top/mobile
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('menu-updated'));
                }
                onUpdateItems();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            showToast({
                type: 'error',
                title: t('error'),
                message: error instanceof Error ? error.message : t('saveError'),
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleIndent = (index: number) => {
        if (index === 0) return; // Cannot indent first item

        const newItems = [...flatItems];
        const item = newItems[index];
        const prevItem = newItems[index - 1];

        // Can only indent if depth is at most prevItem.depth + 1
        if (!item || (item.depth || 0) > (prevItem?.depth || 0)) return;

        // Update depth
        item.depth = (item.depth || 0) + 1;
        // Update parentId
        item.parentId = prevItem?.id ?? null;

        setFlatItems(newItems);
    };

    const handleOutdent = (index: number) => {
        const newItems = [...flatItems];
        const item = newItems[index];

        if (!item || !item.depth || item.depth === 0) return;

        // Update depth
        item.depth = item.depth - 1;

        // Find new parent
        // Go up the list to find the first item with depth < current depth
        let newParentId = null;
        for (let i = index - 1; i >= 0; i--) {
            if ((newItems[i]?.depth || 0) === item.depth - 1) {
                newParentId = newItems[i]?.id;
                break;
            }
        }
        item.parentId = newParentId ?? null;

        setFlatItems(newItems);
    };

    const handleDelete = async (itemId: string) => {
        const confirmed = await confirm({
            title: tGlobal('modal.delete.title'),
            message: t('confirmDeleteItem'),
            confirmLabel: tGlobal('modal.delete.confirm'),
            confirmColor: 'red',
        });

        if (!confirmed) return;

        try {
            const response = await fetchWithAuth(`/api/menus/${menuId}/items?itemId=${itemId}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (result.success) {
                showToast({
                    type: 'success',
                    title: t('success'),
                    message: t('itemDeleted'),
                });
                // Trigger menu update event to refresh menus in sidebar/top/mobile
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event('menu-updated'));
                }
                onUpdateItems();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            showToast({
                type: 'error',
                title: t('error'),
                message: error instanceof Error ? error.message : t('deleteError'),
            });
        }
    };

    // Helper to get localized label based on current locale
    const getLabel = (item: MenuItem) => {
        if (typeof item.label === 'string') return item.label;
        // Get label for current locale, fallback to tr, then en, then first available
        if (item.label && typeof item.label === 'object') {
            return item.label[locale] || item.label['tr'] || item.label['en'] || item.label['de'] || item.label['ar'] || Object.values(item.label)[0] || 'Untitled';
        }
        return 'Untitled';
    };

    return (
        <Paper p="md" withBorder>
            <Group justify="space-between" mb="md">
                <Title order={4}>{t('menuStructure')}</Title>
                <Button
                    leftSection={<IconDeviceFloppy size={16} />}
                    onClick={handleSaveOrder}
                    loading={isSaving}
                >
                    {t('saveOrder')}
                </Button>
            </Group>

            <Text size="sm" c="dimmed" mb="md">
                {t('dragDropInstructions')}
            </Text>

            {flatItems.length === 0 ? (
                <Paper p="xl" withBorder style={{ borderStyle: 'dashed', textAlign: 'center' }}>
                    <Text c="dimmed">{t('noItemsYet')}</Text>
                    <Text size="xs" c="dimmed" mt={4}>{t('addItemsFromLeft')}</Text>
                </Paper>
            ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="menu-items">
                        {(provided) => (
                            <Stack gap="xs" {...provided.droppableProps} ref={provided.innerRef}>
                                {flatItems.map((item, index) => {
                                    const hasChildren = item.children && item.children.length > 0;
                                    const isExpanded = expandedItems[item.id] !== false; // Default to expanded
                                    const isParent = hasChildren;
                                    // Check if this item is a child (has parentId and depth > 0)
                                    const isChild = item.parentId && (item.depth || 0) > 0;
                                    // Only show if parent is expanded or this is not a child
                                    
                                    // Skip rendering if this is a child and parent is collapsed
                                    if (isChild) {
                                        const parentItem = flatItems.find(f => f.id === item.parentId);
                                        if (parentItem && expandedItems[parentItem.id] === false) {
                                            return null;
                                        }
                                    }
                                    
                                    return (
                                    <Draggable key={item.id} draggableId={item.id} index={index}>
                                        {(provided, snapshot) => (
                                            <Paper
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                withBorder
                                                p="xs"
                                                style={{
                                                    ...provided.draggableProps.style,
                                                    marginLeft: `${(item.depth || 0) * 30}px`,
                                                    backgroundColor: snapshot.isDragging ? 'var(--mantine-color-blue-light)' : undefined,
                                                }}
                                            >
                                                <Group wrap="nowrap">
                                                    <div {...provided.dragHandleProps} style={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}>
                                                        <IconGripVertical size={18} color="gray" />
                                                    </div>

                                                    {isParent && (
                                                        <ActionIcon
                                                            size="sm"
                                                            variant="subtle"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleExpand(item.id);
                                                            }}
                                                        >
                                                            {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                                                        </ActionIcon>
                                                    )}
                                                    {!isParent && <div style={{ width: 24 }} />}

                                                    <div style={{ flex: 1 }}>
                                                        <Group justify="space-between">
                                                            <Group gap="xs">
                                                                <Text fw={500} size="sm">{getLabel(item)}</Text>
                                                                <Badge size="xs" variant="outline" color="gray">{item.menuGroup || 'custom'}</Badge>
                                                                {!item.visible && <Badge size="xs" color="red">{t('hidden')}</Badge>}
                                                            </Group>

                                                            <Group gap={4}>
                                                                <Tooltip label={t('outdent')}>
                                                                    <ActionIcon
                                                                        size="sm"
                                                                        variant="subtle"
                                                                        disabled={!item.depth || item.depth === 0}
                                                                        onClick={() => handleOutdent(index)}
                                                                    >
                                                                        <IconArrowLeft size={14} />
                                                                    </ActionIcon>
                                                                </Tooltip>
                                                                <Tooltip label={t('indent')}>
                                                                    <ActionIcon
                                                                        size="sm"
                                                                        variant="subtle"
                                                                        disabled={index === 0 || (item.depth || 0) > ((flatItems[index - 1]?.depth || 0))}
                                                                        onClick={() => handleIndent(index)}
                                                                    >
                                                                        <IconArrowRight size={14} />
                                                                    </ActionIcon>
                                                                </Tooltip>
                                                                <ActionIcon size="sm" variant="subtle" onClick={() => onEditItem(item)}>
                                                                    <IconEdit size={14} />
                                                                </ActionIcon>
                                                                <ActionIcon size="sm" variant="subtle" color="red" onClick={() => handleDelete(item.id)}>
                                                                    <IconTrash size={14} />
                                                                </ActionIcon>
                                                            </Group>
                                                        </Group>
                                                        <Text size="xs" c="dimmed" truncate>{item.href}</Text>
                                                    </div>
                                                </Group>
                                            </Paper>
                                        )}
                                    </Draggable>
                                    );
                                })}
                                {provided.placeholder}
                            </Stack>
                        )}
                    </Droppable>
                </DragDropContext>
            )}
            <ConfirmDialog />
        </Paper>
    );
}
