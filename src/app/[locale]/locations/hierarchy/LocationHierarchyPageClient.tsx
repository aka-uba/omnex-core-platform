'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Button,
  Group,
  Stack,
  Text,
  ActionIcon,
  Badge,
  Modal,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft,
  IconMapPin,
  IconChevronRight,
  IconChevronDown,
  IconEdit,
  IconTrash,
  IconPlus,
  IconGripVertical,
} from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useLocations, useUpdateLocation, useDeleteLocation } from '@/hooks/useLocations';
import { useTranslation } from '@/lib/i18n/client';
import { DndContext, closestCenter, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface LocationNode {
  id: string;
  name: string;
  type: string;
  code?: string | null;
  isActive: boolean;
  children: LocationNode[];
}

export function LocationHierarchyPageClient({ locale }: { locale: string }) {
  const router = useRouter();
  const { t } = useTranslation('modules/locations');
  const { t: tGlobal } = useTranslation('global');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [_editModalOpened, setEditModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);

  const { data, isLoading, refetch } = useLocations({ page: 1, pageSize: 1000 });
  const updateLocation = useUpdateLocation();
  const deleteLocation = useDeleteLocation();

  // Build tree structure from flat list
  const locationTree = useMemo(() => {
    if (!data?.locations) return [];

    const locations = data.locations;
    const locationMap = new Map<string, LocationNode>();
    const roots: LocationNode[] = [];

    // Create nodes
    locations.forEach((loc) => {
      locationMap.set(loc.id, {
        id: loc.id,
        name: loc.name,
        type: loc.type,
        code: loc.code,
        isActive: loc.isActive,
        children: [],
      });
    });

    // Build tree
    locations.forEach((loc) => {
      const node = locationMap.get(loc.id)!;
      if (loc.parentId && locationMap.has(loc.parentId)) {
        locationMap.get(loc.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [data?.locations]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const draggedId = active.id as string;
    const newParentId = over.id as string;

    try {
      await updateLocation.mutateAsync({
        id: draggedId,
        data: { parentId: newParentId },
      });

      notifications.show({
        title: t('hierarchy.moveSuccess'),
        message: t('hierarchy.moveSuccess'),
        color: 'green',
      });

      refetch();
    } catch (error) {
      notifications.show({
        title: t('hierarchy.moveError'),
        message: error instanceof Error ? error.message : t('hierarchy.moveError'),
        color: 'red',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedNode) return;

    try {
      await deleteLocation.mutateAsync(selectedNode);
      notifications.show({
        title: t('delete.success'),
        message: t('delete.success'),
        color: 'green',
      });
      setDeleteModalOpened(false);
      setSelectedNode(null);
      refetch();
    } catch (error) {
      notifications.show({
        title: t('delete.error'),
        message: error instanceof Error ? error.message : t('delete.error'),
        color: 'red',
      });
    }
  };

  const getTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      firma: 'blue',
      lokasyon: 'green',
      isletme: 'orange',
      koridor: 'purple',
      oda: 'pink',
    };
    return (
      <Badge color={typeColors[type] || 'gray'} size="sm">
        {t(`types.${type}`) || type}
      </Badge>
    );
  };

  const renderNode = (node: LocationNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <LocationTreeNode
        key={node.id}
        node={node}
        level={level}
        isExpanded={isExpanded}
        hasChildren={hasChildren}
        onToggle={() => toggleNode(node.id)}
        onEdit={() => {
          setSelectedNode(node.id);
          setEditModalOpened(true);
        }}
        onDelete={() => {
          setSelectedNode(node.id);
          setDeleteModalOpened(true);
        }}
        getTypeBadge={getTypeBadge}
        t={t}
      >
        {isExpanded && hasChildren && (
          <Stack gap={4} ml={32}>
            {node.children.map((child) => renderNode(child, level + 1))}
          </Stack>
        )}
      </LocationTreeNode>
    );
  };

  if (isLoading) {
    return (
      <Container size="xl" py="xl">
        <Text>Loading...</Text>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <CentralPageHeader
        title="hierarchy.title"
        description="hierarchy.description"
        namespace="modules/locations"
        icon={<IconMapPin size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${locale}/locations`, namespace: 'modules/locations' },
          { label: 'hierarchy.title', namespace: 'modules/locations' },
        ]}
        actions={[
          {
            label: tGlobal('common.back'),
            icon: <IconArrowLeft size={18} />,
            onClick: () => router.push(`/${locale}/locations`),
            variant: 'default',
          },
          {
            label: t('create.button'),
            icon: <IconPlus size={18} />,
            onClick: () => router.push(`/${locale}/locations/create`),
            variant: 'filled',
          },
        ]}
      />

      <Paper shadow="sm" p="md" radius="md">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Stack gap={4}>
            {locationTree.length > 0 ? (
              locationTree.map((node) => renderNode(node))
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                {t('hierarchy.noData')}
              </Text>
            )}
          </Stack>
        </DndContext>
      </Paper>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setSelectedNode(null);
        }}
        title={t('delete.confirm')}
        centered
      >
        <Stack gap="md">
          <Text>{t('delete.confirmMessage')}</Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                setDeleteModalOpened(false);
                setSelectedNode(null);
              }}
            >
              {t('form.cancel')}
            </Button>
            <Button color="red" onClick={handleDelete} loading={deleteLocation.isPending}>
              {tGlobal('common.delete')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}

interface LocationTreeNodeProps {
  node: LocationNode;
  level: number;
  isExpanded: boolean;
  hasChildren: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getTypeBadge: (type: string) => React.ReactNode;
  t: (key: string) => string;
  children?: React.ReactNode;
}

function LocationTreeNode({
  node,
  level,
  isExpanded,
  hasChildren,
  onToggle,
  onEdit,
  onDelete,
  getTypeBadge,
  t,
  children,
}: LocationTreeNodeProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: node.id,
    data: { type: 'location', node },
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: node.id,
    data: { type: 'location', accepts: ['location'] },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setDroppableRef}>
      <Paper
        ref={setNodeRef}
        style={style}
        p="sm"
        radius="md"
        withBorder
        className={isOver ? 'bg-blue-50' : ''}
        ml={level * 24}
      >
        <Group justify="space-between" gap="xs">
          <Group gap="xs" style={{ flex: 1 }}>
            <div {...listeners} {...attributes} style={{ cursor: 'grab' }}>
              <IconGripVertical size={16} />
            </div>
            {hasChildren && (
              <ActionIcon variant="subtle" size="sm" onClick={onToggle}>
                {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
              </ActionIcon>
            )}
            {!hasChildren && <div style={{ width: 24 }} />}
            <IconMapPin size={18} />
            <Text fw={500} style={{ flex: 1 }}>
              {node.name}
            </Text>
            {node.code && (
              <Text size="sm" c="dimmed">
                ({node.code})
              </Text>
            )}
            {getTypeBadge(node.type)}
            {!node.isActive && (
              <Badge color="gray" variant="light" size="sm">
                {t('status.inactive')}
              </Badge>
            )}
          </Group>
          <Group gap="xs">
            <ActionIcon variant="subtle" size="sm" onClick={onEdit}>
              <IconEdit size={16} />
            </ActionIcon>
            <ActionIcon variant="subtle" size="sm" color="red" onClick={onDelete}>
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        </Group>
      </Paper>
      {children}
    </div>
  );
}

