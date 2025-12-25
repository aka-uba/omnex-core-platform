'use client';

import { useState } from 'react';
import {
  Container,
  Paper,
  TextInput,
  Button,
  Table,
  ActionIcon,
  Group,
  Text,
  Pagination,
  Badge,
} from '@mantine/core';
import { IconSearch, IconPlus, IconFilterOff, IconEye, IconEdit, IconTrash, IconShieldLock, IconFile, IconFileSpreadsheet, IconFileText, IconCode, IconPrinter, IconFilter, IconDotsVertical, IconSettings } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { usePermissions } from '@/hooks/usePermissions';
import { useTranslation } from '@/lib/i18n/client';
import { PermissionsPageSkeleton } from './PermissionsPageSkeleton';
import { PermissionModal } from './PermissionModal';
import classes from './PermissionsPage.module.css';
import { useExport } from '@/lib/export/useExport';
import { ColumnSettingsModal, ColumnSettingsColumn } from '@/components/tables/ColumnSettingsModal';
import { useMemo } from 'react';

export function PermissionsPageClient({ locale }: { locale: string }) {
  const { t } = useTranslation('modules/permissions');
  const { exportToPDF, exportToExcel, exportToCSV, exportToWord, exportToHTML, printData } = useExport();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [moduleFilter, setModuleFilter] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<string | null>(null);
  const [showColumnSettingsModal, setShowColumnSettingsModal] = useState(false);
  const [columnOrder, setColumnOrder] = useState<string[]>(['permissionKey', 'name', 'description', 'category', 'module']);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  const { data, isLoading } = usePermissions({
    page,
    pageSize: 10,
    search: search || undefined,
    category: categoryFilter,
    module: moduleFilter,
  });

  // Column definitions
  const columnDefinitions: ColumnSettingsColumn[] = [
    { key: 'permissionKey', label: t('table.permissionKey'), sortable: true, searchable: true, filterable: false },
    { key: 'name', label: t('table.name'), sortable: true, searchable: true, filterable: false },
    { key: 'description', label: t('table.description'), sortable: true, searchable: true, filterable: false },
    { key: 'category', label: t('table.category'), sortable: true, searchable: true, filterable: true },
    { key: 'module', label: t('table.module'), sortable: true, searchable: true, filterable: true },
  ];

  // Get visible columns
  const visibleColumns = columnOrder.filter(key => !hiddenColumns.includes(key));

  // Get filtered data for export
  const filteredData = useMemo(() => {
    if (!data?.permissions) return [];
    return data.permissions.filter((permission) => {
      const matchesSearch = !search || 
        permission.permissionKey.toLowerCase().includes(search.toLowerCase()) ||
        permission.name.toLowerCase().includes(search.toLowerCase()) ||
        (permission.description || '').toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !categoryFilter || permission.category === categoryFilter;
      const matchesModule = !moduleFilter || permission.module === moduleFilter;
      return matchesSearch && matchesCategory && matchesModule;
    });
  }, [data?.permissions, search, categoryFilter, moduleFilter]);

  if (isLoading) {
    return <PermissionsPageSkeleton />;
  }

  const handleView = (permissionId: string) => {
    setSelectedPermission(permissionId);
    setModalOpen(true);
  };

  const handleEdit = (permissionId: string) => {
    setSelectedPermission(permissionId);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedPermission(null);
    setModalOpen(true);
  };

  const clearFilters = () => {
    setCategoryFilter(undefined);
    setModuleFilter(undefined);
  };

  // Handle export
  const handleExport = async (format: 'pdf' | 'excel' | 'csv' | 'word' | 'html' | 'print') => {
    if (filteredData.length === 0) return;

    try {
      // Prepare columns based on visible columns
      const exportColumns = visibleColumns.map(key => {
        const col = columnDefinitions.find(c => c.key === key);
        return col ? col.label : key;
      });

      // Prepare rows based on visible columns
      const exportRows = filteredData.map(permission => {
        const row: any[] = [];
        visibleColumns.forEach(key => {
          switch (key) {
            case 'permissionKey':
              row.push(permission.permissionKey);
              break;
            case 'name':
              row.push(permission.name);
              break;
            case 'description':
              row.push(permission.description || '');
              break;
            case 'category':
              row.push(permission.category);
              break;
            case 'module':
              row.push(permission.module || '');
              break;
            default:
              row.push('');
          }
        });
        return row;
      });

      const exportData = {
        columns: exportColumns,
        rows: exportRows,
        metadata: {
          title: 'İzinler',
          description: 'İzin Listesi',
        },
      };

      const options = {
        title: 'İzinler',
        description: 'İzin Listesi',
        includeHeader: true,
        includeFooter: true,
        includePageNumbers: true,
        filename: `izinler_${new Date().toISOString().split('T')[0]}`,
      };

      switch (format) {
        case 'pdf':
          await exportToPDF(exportData, options);
          break;
        case 'excel':
          await exportToExcel(exportData, options);
          break;
        case 'csv':
          await exportToCSV(exportData, options);
          break;
        case 'word':
          await exportToWord(exportData, options);
          break;
        case 'html':
          await exportToHTML(exportData, options);
          break;
        case 'print':
          await printData(exportData, options);
          break;
      }
    } catch (error) {
      // Export error - silently fail
    }
  };

  return (
    <Container size="xl" py="xl">
      <CentralPageHeader
        title="title"
        description="description"
        namespace="modules/permissions"
        icon={<IconShieldLock size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${locale}/management/users`, namespace: 'modules/users' },
          { label: 'title', namespace: 'modules/permissions' },
        ]}
        actions={[
          {
            label: t('create.button'),
            icon: <IconPlus size={18} />,
            onClick: handleCreate,
            variant: 'filled',
          },
        ]}
      />

      <Paper shadow="sm" p="md" radius="md" className={classes.tableContainer}>
        {/* Search and Filters */}
        <Group justify="space-between" wrap="nowrap" gap="md" mb="md" className={classes.toolbar} style={{ overflowX: 'auto', width: '100%' }}>
          <TextInput
            placeholder={t('table.searchPlaceholder')}
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            className={classes.searchInput}
            style={{ flex: 1, minWidth: 200, flexShrink: 1 }}
          />
          <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
            {/* Export Icons */}
            <ActionIcon variant="subtle" color="red" size="lg" title="PDF" onClick={() => handleExport('pdf')} style={{ flexShrink: 0 }}>
              <IconFile size={18} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="green" size="lg" title="Excel" onClick={() => handleExport('excel')} style={{ flexShrink: 0 }}>
              <IconFileSpreadsheet size={18} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="blue" size="lg" title="CSV" onClick={() => handleExport('csv')} style={{ flexShrink: 0 }}>
              <IconFileText size={18} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="blue" size="lg" title="Word" onClick={() => handleExport('word')} style={{ flexShrink: 0 }}>
              <IconFileText size={18} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="orange" size="lg" title="HTML" onClick={() => handleExport('html')} style={{ flexShrink: 0 }}>
              <IconCode size={18} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="gray" size="lg" title="Yazdır" onClick={() => handleExport('print')} style={{ flexShrink: 0 }}>
              <IconPrinter size={18} />
            </ActionIcon>
            <Button variant="default" size="sm" style={{ flexShrink: 0 }}>{t('table.categoryFilter')}</Button>
            <Button variant="default" size="sm" style={{ flexShrink: 0 }}>{t('table.moduleFilter')}</Button>
            <Button
              variant="light"
              leftSection={<IconFilterOff size={16} />}
              onClick={clearFilters}
              size="sm"
              style={{ flexShrink: 0 }}
            >
              {t('table.clearFilters')}
            </Button>
            <Button
              variant="default"
              leftSection={<IconFilter size={16} />}
              rightSection={<IconDotsVertical size={16} />}
              size="sm"
              style={{ flexShrink: 0 }}
            >
              Filtreler
            </Button>
            <ActionIcon
              variant="default"
              size="lg"
              title="Sütun Ayarları"
              onClick={() => setShowColumnSettingsModal(true)}
              style={{ flexShrink: 0 }}
            >
              <IconSettings size={20} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Table */}
        <div className={classes.tableWrapper}>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                {visibleColumns.includes('permissionKey') && <Table.Th>{t('table.permissionKey')}</Table.Th>}
                {visibleColumns.includes('name') && <Table.Th>{t('table.name')}</Table.Th>}
                {visibleColumns.includes('description') && <Table.Th>{t('table.description')}</Table.Th>}
                {visibleColumns.includes('category') && <Table.Th>{t('table.category')}</Table.Th>}
                {visibleColumns.includes('module') && <Table.Th>{t('table.module')}</Table.Th>}
                <Table.Th style={{ textAlign: 'right' }}>{t('table.actions')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data?.permissions.map((permission) => (
                <Table.Tr key={permission.id}>
                  {visibleColumns.includes('permissionKey') && (
                    <Table.Td>
                      <Text size="xs" ff="monospace" c="dimmed">
                        {permission.permissionKey}
                      </Text>
                    </Table.Td>
                  )}
                  {visibleColumns.includes('name') && (
                    <Table.Td>
                      <Text fw={500}>{permission.name}</Text>
                    </Table.Td>
                  )}
                  {visibleColumns.includes('description') && (
                    <Table.Td>
                      <Text size="sm" c="dimmed" lineClamp={1}>
                        {permission.description}
                      </Text>
                    </Table.Td>
                  )}
                  {visibleColumns.includes('category') && (
                    <Table.Td>
                      <Text size="sm">{permission.category}</Text>
                    </Table.Td>
                  )}
                  {visibleColumns.includes('module') && (
                    <Table.Td>
                      {permission.module && (
                        <Badge variant="light" color="blue">
                          {permission.module}
                        </Badge>
                      )}
                    </Table.Td>
                  )}
                  <Table.Td>
                    <Group justify="flex-end" gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => handleView(permission.id)}
                        title={t('actions.view')}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        onClick={() => handleEdit(permission.id)}
                        title={t('actions.edit')}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        title={t('actions.delete')}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>

        {/* Pagination */}
        {data && data.total > 0 && (
          <Group justify="space-between" mt="md" pt="md" className={classes.pagination}>
            <Text size="sm" c="dimmed">
              Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, data.total)} of {data.total} results
            </Text>
            <Pagination
              value={page}
              onChange={setPage}
              total={Math.ceil(data.total / 10)}
            />
          </Group>
        )}
      </Paper>

      <PermissionModal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedPermission(null);
        }}
        permissionId={selectedPermission}
      />

      {/* Column Settings Modal */}
      <ColumnSettingsModal
        opened={showColumnSettingsModal}
        onClose={() => setShowColumnSettingsModal(false)}
        columns={columnOrder
          .map((key) => {
            const col = columnDefinitions.find((c) => c.key === key);
            if (!col) return null;
            return {
              ...col,
              hidden: hiddenColumns.includes(key),
            } as ColumnSettingsColumn;
          })
          .filter((col): col is ColumnSettingsColumn => col !== null)}
        onColumnReorder={(newColumns) => {
          const newOrder = newColumns.map((col) => col.key);
          setColumnOrder(newOrder);
          const newHidden = newColumns.filter((col) => col.hidden).map((col) => col.key);
          setHiddenColumns(newHidden);
        }}
        onColumnToggle={(columnKey, visible) => {
          // Handled in onColumnReorder
        }}
        onReset={() => {
          setColumnOrder(['permissionKey', 'name', 'description', 'category', 'module']);
          setHiddenColumns([]);
        }}
      />
    </Container>
  );
}

