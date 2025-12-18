'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Paper,
  TextInput,
  Button,
  Table,
  Badge,
  ActionIcon,
  Group,
  Text,
  Pagination,
  Select,
  Menu,
  Loader,
  Tooltip,
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconDownload,
  IconCalendar,
} from '@tabler/icons-react';
import { useLeaves, useDeleteLeave } from '@/hooks/useLeaves';
import { useEmployees } from '@/hooks/useEmployees';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useExport } from '@/lib/export/ExportProvider';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { LeaveType, LeaveStatus } from '@/modules/hr/types/hr';
import type { ExportFormat } from '@/lib/export/types';
import dayjs from 'dayjs';

interface LeaveListProps {
  locale: string;
}

export function LeaveList({ locale }: LeaveListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/hr');
  const { t: tGlobal } = useTranslation('global');
  const { exportToExcel, exportToPDF, exportToCSV, isExporting } = useExport();
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [employeeIdFilter, setEmployeeIdFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<LeaveType | undefined>();
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | undefined>();

  const { data, isLoading, error } = useLeaves({
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(employeeIdFilter ? { employeeId: employeeIdFilter } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  // Fetch employees for filter
  const { data: employeesData } = useEmployees({ page: 1, pageSize: 1000, isActive: true });

  const deleteLeave = useDeleteLeave();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: t('leaves.delete.title'),
      message: t('leaves.delete.confirm'),
      confirmLabel: tGlobal('common.delete'),
      confirmColor: 'red',
    });

    if (confirmed) {
      try {
        await deleteLeave.mutateAsync(id);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('leaves.delete.success'),
        });
      } catch (error) {
        showToast({
          type: 'error',
          title: t('messages.error'),
          message: error instanceof Error ? error.message : t('leaves.delete.error'),
        });
      }
    }
  };

  const handleExport = async (format: ExportFormat) => {
    if (!data) return;

    try {
      const exportData = {
        columns: [
          t('leaves.table.employee'),
          t('leaves.table.type'),
          t('leaves.table.startDate'),
          t('leaves.table.endDate'),
          t('leaves.table.days'),
          t('leaves.table.status'),
          t('leaves.table.reason'),
        ],
        rows: data.leaves.map((leave) => [
          leave.employee?.user?.name || leave.employee?.employeeNumber || '-',
          t(`leaves.types.${leave.type}`) || leave.type,
          dayjs(leave.startDate).format('DD.MM.YYYY'),
          dayjs(leave.endDate).format('DD.MM.YYYY'),
          leave.days.toString(),
          t(`leaves.status.${leave.status}`) || leave.status,
          leave.reason || '-',
        ]),
        metadata: {
          title: t('leaves.title'),
          description: t('leaves.exportDescription'),
          generatedAt: new Date().toISOString(),
        },
      };

      const options = {
        title: t('leaves.title'),
        description: t('leaves.exportDescription'),
        includeHeader: true,
        includeFooter: true,
        includePageNumbers: true,
        filename: `leaves_${dayjs().format('YYYY-MM-DD')}`,
      };

      switch (format) {
        case 'excel':
          await exportToExcel(exportData, options);
          break;
        case 'pdf':
          await exportToPDF(exportData, options);
          break;
        case 'csv':
          await exportToCSV(exportData, options);
          break;
      }

      showToast({
        type: 'success',
        title: t('messages.success'),
        message: t('leaves.exportSuccess'),
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('leaves.exportError'),
      });
    }
  };

  if (isLoading) {
    return (
      <Paper shadow="sm" p="md" radius="md">
        <Loader />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper shadow="sm" p="md" radius="md">
        <Text c="red">{tGlobal('common.errorLoading')}</Text>
      </Paper>
    );
  }

  if (!data) {
    return (
      <Paper shadow="sm" p="md" radius="md">
        <Text>{tGlobal('common.noData')}</Text>
      </Paper>
    );
  }

  const getTypeBadge = (type: LeaveType) => {
    const typeColors: Record<LeaveType, string> = {
      annual: 'blue',
      sick: 'red',
      unpaid: 'orange',
      maternity: 'purple',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`leaves.types.${type}`) || type}
      </Badge>
    );
  };

  const getStatusBadge = (status: LeaveStatus) => {
    const statusColors: Record<LeaveStatus, string> = {
      pending: 'yellow',
      approved: 'green',
      rejected: 'red',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`leaves.status.${status}`) || status}
      </Badge>
    );
  };

  // Get employees for filter
  const employeeOptions: Array<{ value: string; label: string }> = 
    (employeesData?.employees || []).map((emp) => ({
      value: emp.id,
      label: `${emp.user?.name || '-'} (${emp.employeeNumber})`,
    }));

  return (
    <Paper shadow="xs" p="md">
      <Group justify="space-between" mb="md">
        <Group>
          <IconCalendar size={24} />
          <Text fw={500} size="lg">{t('leaves.title')}</Text>
        </Group>
        <Group>
          <Menu>
            <Menu.Target>
              <Button
                leftSection={<IconDownload size={16} />}
                variant="light"
                loading={isExporting}
              >
                {t('export.title')}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => handleExport('excel')}>
                {t('export.excel')}
              </Menu.Item>
              <Menu.Item onClick={() => handleExport('pdf')}>
                {t('export.pdf')}
              </Menu.Item>
              <Menu.Item onClick={() => handleExport('csv')}>
                {t('export.csv')}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => router.push(`/${locale}/modules/hr/leaves/create`)}
          >
            {t('actions.newLeave')}
          </Button>
        </Group>
      </Group>

      <Group mb="md" gap="xs">
        <TextInput
          placeholder={t('search.placeholder')}
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <Select
          placeholder={t('leaves.filter.employee')}
          data={employeeOptions}
          value={employeeIdFilter || null}
          onChange={(value) => setEmployeeIdFilter(value || undefined)}
          searchable
          clearable
          style={{ width: 200 }}
        />
        <Select
          placeholder={t('leaves.filter.type')}
          data={[
            { value: 'annual', label: t('leaves.types.annual') },
            { value: 'sick', label: t('leaves.types.sick') },
            { value: 'unpaid', label: t('leaves.types.unpaid') },
            { value: 'maternity', label: t('leaves.types.maternity') },
          ]}
          value={typeFilter || null}
          onChange={(value) => setTypeFilter(value as LeaveType || undefined)}
          clearable
          style={{ width: 150 }}
        />
        <Select
          placeholder={t('leaves.filter.status')}
          data={[
            { value: 'pending', label: t('leaves.status.pending') },
            { value: 'approved', label: t('leaves.status.approved') },
            { value: 'rejected', label: t('leaves.status.rejected') },
          ]}
          value={statusFilter || null}
          onChange={(value) => setStatusFilter(value as LeaveStatus || undefined)}
          clearable
          style={{ width: 150 }}
        />
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('leaves.table.employee')}</Table.Th>
            <Table.Th>{t('leaves.table.type')}</Table.Th>
            <Table.Th>{t('leaves.table.startDate')}</Table.Th>
            <Table.Th>{t('leaves.table.endDate')}</Table.Th>
            <Table.Th>{t('leaves.table.days')}</Table.Th>
            <Table.Th>{t('leaves.table.status')}</Table.Th>
            <Table.Th>{t('leaves.table.actions')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.leaves.map((leave) => (
            <Table.Tr key={leave.id}>
              <Table.Td>{leave.employee?.user?.name || leave.employee?.employeeNumber || '-'}</Table.Td>
              <Table.Td>{getTypeBadge(leave.type)}</Table.Td>
              <Table.Td>{dayjs(leave.startDate).format('DD.MM.YYYY')}</Table.Td>
              <Table.Td>{dayjs(leave.endDate).format('DD.MM.YYYY')}</Table.Td>
              <Table.Td>{leave.days}</Table.Td>
              <Table.Td>{getStatusBadge(leave.status)}</Table.Td>
              <Table.Td>
                <Group gap="xs" justify="flex-end">
                  <Tooltip label={t('actions.view')} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => router.push(`/${locale}/modules/hr/leaves/${leave.id}`)}
                    >
                      <IconEye size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t('actions.edit')} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      onClick={() => router.push(`/${locale}/modules/hr/leaves/${leave.id}/edit`)}
                    >
                      <IconEdit size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t('actions.delete')} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => handleDelete(leave.id)}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {data.total > 0 && (
        <Group justify="space-between" mt="md">
          <Text size="sm" c="dimmed">
            {t('pagination.showing')} {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, data.total)} {t('pagination.of')} {data.total}
          </Text>
          <Pagination
            value={page}
            onChange={setPage}
            total={Math.ceil(data.total / pageSize)}
          />
        </Group>
      )}
      <ConfirmDialog />
    </Paper>
  );
}







