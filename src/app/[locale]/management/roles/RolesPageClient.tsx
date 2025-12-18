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
import { IconSearch, IconPlus, IconEye, IconEdit, IconTrash, IconUsersGroup, IconFile, IconFileSpreadsheet, IconFileText, IconCode, IconPrinter, IconFilter, IconDotsVertical, IconSettings } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useRoles } from '@/hooks/useRoles';
import { useTranslation } from '@/lib/i18n/client';
import { RolesPageSkeleton } from './RolesPageSkeleton';
import { RoleModal } from './RoleModal';
import classes from './RolesPage.module.css';
import { useExport } from '@/lib/export/useExport';
import { ColumnSettingsModal, ColumnSettingsColumn } from '@/components/tables/ColumnSettingsModal';
import { useMemo } from 'react';

export function RolesPageClient({ locale }: { locale: string }) {
  const { t } = useTranslation('modules/roles');
  const { exportToPDF, exportToExcel, exportToCSV, exportToWord, exportToHTML, printData } = useExport();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showColumnSettingsModal, setShowColumnSettingsModal] = useState(false);
  const [columnOrder, setColumnOrder] = useState<string[]>(['roleName', 'description', 'usersAssigned']);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  const { data, isLoading } = useRoles({
    page,
    pageSize: 10,
    ...(search ? { search } : {}),
  });

  // Column definitions
  const columnDefinitions: ColumnSettingsColumn[] = [
    { key: 'roleName', label: t('table.roleName'), sortable: true, searchable: true, filterable: false },
    { key: 'description', label: t('table.description'), sortable: true, searchable: true, filterable: false },
    { key: 'usersAssigned', label: t('table.usersAssigned'), sortable: true, searchable: false, filterable: false },
  ];

  // Get visible columns
  const visibleColumns = columnOrder.filter(key => !hiddenColumns.includes(key));

  // Get filtered data for export
  const filteredData = useMemo(() => {
    if (!data?.roles) return [];
    return data.roles.filter((role) => {
      if (!search) return true;
      return role.name.toLowerCase().includes(search.toLowerCase()) ||
        (role.description || '').toLowerCase().includes(search.toLowerCase());
    });
  }, [data?.roles, search]);

  if (isLoading) {
    return <RolesPageSkeleton />;
  }

  const handleView = (roleId: string) => {
    setSelectedRole(roleId);
    setModalOpen(true);
  };

  const handleEdit = (roleId: string) => {
    setSelectedRole(roleId);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedRole(null);
    setModalOpen(true);
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
      const exportRows = filteredData.map(role => {
        const row: any[] = [];
        visibleColumns.forEach(key => {
          switch (key) {
            case 'roleName':
              row.push(role.name);
              break;
            case 'description':
              row.push(role.description || '');
              break;
            case 'usersAssigned':
              row.push(role.usersCount || 0);
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
          title: t('title'),
          description: t('description'),
        },
      };

      const options = {
        title: t('title'),
        description: t('description'),
        includeHeader: true,
        includeFooter: true,
        includePageNumbers: true,
        filename: `roller_${new Date().toISOString().split('T')[0]}`,
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
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title="title"
        description="description"
        namespace="modules/roles"
        icon={<IconUsersGroup size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${locale}/management/users`, namespace: 'modules/users' },
          { label: 'title', namespace: 'modules/roles' },
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

      <Paper shadow="sm" p="md" radius="md" {...(classes.tableContainer ? { className: classes.tableContainer } : {})}>
        {/* Search and Filters */}
        <Group justify="space-between" wrap="nowrap" gap="md" mb="md" {...(classes.toolbar ? { className: classes.toolbar } : {})} style={{ overflowX: 'auto', width: '100%' }}>
          <TextInput
            placeholder={t('table.searchPlaceholder')}
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            {...(classes.searchInput ? { className: classes.searchInput } : {})}
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
            <Button variant="default" size="sm" style={{ flexShrink: 0 }}>{t('table.allRoles')}</Button>
            <Button variant="default" size="sm" style={{ flexShrink: 0 }}>{t('table.withUsers')}</Button>
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
                {visibleColumns.includes('roleName') && <Table.Th>{t('table.roleName')}</Table.Th>}
                {visibleColumns.includes('description') && <Table.Th>{t('table.description')}</Table.Th>}
                {visibleColumns.includes('usersAssigned') && <Table.Th>{t('table.usersAssigned')}</Table.Th>}
                <Table.Th style={{ textAlign: 'right' }}>{t('table.actions')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(data?.roles || []).map((role) => (
                <Table.Tr key={role.id}>
                  {visibleColumns.includes('roleName') && (
                    <Table.Td>
                      <Text fw={500}>{role.name}</Text>
                    </Table.Td>
                  )}
                  {visibleColumns.includes('description') && (
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {role.description}
                      </Text>
                    </Table.Td>
                  )}
                  {visibleColumns.includes('usersAssigned') && (
                    <Table.Td>
                      <Badge variant="light">{role.usersCount || 0}</Badge>
                    </Table.Td>
                  )}
                  <Table.Td>
                    <Group justify="flex-end" gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => handleView(role.id)}
                        title={t('actions.view')}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        onClick={() => handleEdit(role.id)}
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
          <Group justify="space-between" mt="md" pt="md" {...(classes.pagination ? { className: classes.pagination } : {})}>
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

      <RoleModal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedRole(null);
        }}
        roleId={selectedRole}
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
          setColumnOrder(['roleName', 'description', 'usersAssigned']);
          setHiddenColumns([]);
        }}
      />
    </Container>
  );
}

