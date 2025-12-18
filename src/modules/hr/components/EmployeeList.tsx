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
  IconUsers,
} from '@tabler/icons-react';
import { useEmployees, useDeleteEmployee } from '@/hooks/useEmployees';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useExport } from '@/lib/export/ExportProvider';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { WorkType } from '@/modules/hr/types/hr';
import type { ExportFormat } from '@/lib/export/types';
import dayjs from 'dayjs';

interface EmployeeListProps {
  locale: string;
}

export function EmployeeList({ locale }: EmployeeListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/hr');
  const { t: tGlobal } = useTranslation('global');
  const { exportToExcel, exportToPDF, exportToCSV, isExporting } = useExport();
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>();
  const [workTypeFilter, setWorkTypeFilter] = useState<WorkType | undefined>();
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);

  const { data, isLoading, error } = useEmployees({
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(departmentFilter ? { department: departmentFilter } : {}),
    ...(workTypeFilter ? { workType: workTypeFilter } : {}),
    ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}),
  });

  const deleteEmployee = useDeleteEmployee();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: t('employees.delete.title'),
      message: t('employees.delete.confirm'),
      confirmLabel: tGlobal('common.delete'),
      confirmColor: 'red',
    });

    if (confirmed) {
      try {
        await deleteEmployee.mutateAsync(id);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('employees.delete.success'),
        });
      } catch (error) {
        showToast({
          type: 'error',
          title: t('messages.error'),
          message: error instanceof Error ? error.message : t('employees.delete.error'),
        });
      }
    }
  };

  const handleExport = async (format: ExportFormat) => {
    if (!data) return;

    try {
      const exportData = {
        columns: [
          t('employees.table.employeeNumber'),
          t('employees.table.name'),
          t('employees.table.email'),
          t('employees.table.department'),
          t('employees.table.position'),
          t('employees.table.workType'),
          t('employees.table.hireDate'),
          t('employees.table.salary'),
        ],
        rows: data.employees.map((employee) => [
          employee.employeeNumber,
          employee.user?.name || '-',
          employee.user?.email || '-',
          employee.department,
          employee.position,
          t(`employees.workTypes.${employee.workType}`) || employee.workType,
          dayjs(employee.hireDate).format('DD.MM.YYYY'),
          employee.salary ? Number(employee.salary).toLocaleString('tr-TR', {
            style: 'currency',
            currency: employee.currency || 'TRY',
          }) : '-',
        ]),
        metadata: {
          title: t('employees.title'),
          description: t('employees.exportDescription'),
          generatedAt: new Date().toISOString(),
        },
      };

      const options = {
        title: t('employees.title'),
        description: t('employees.exportDescription'),
        includeHeader: true,
        includeFooter: true,
        includePageNumbers: true,
        filename: `employees_${dayjs().format('YYYY-MM-DD')}`,
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
        message: t('employees.exportSuccess'),
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('employees.exportError'),
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

  const getWorkTypeBadge = (workType: WorkType) => {
    const workTypeColors: Record<WorkType, string> = {
      full_time: 'blue',
      part_time: 'yellow',
      contract: 'orange',
    };
    return (
      <Badge color={workTypeColors[workType] || 'gray'}>
        {t(`employees.workTypes.${workType}`) || workType}
      </Badge>
    );
  };

  // Get unique departments for filter
  const departments = Array.from(new Set(data.employees.map(emp => emp.department))).sort();

  return (
    <Paper shadow="sm" p="md" radius="md">
      <Group justify="space-between" mb="md">
        <Group>
          <IconUsers size={24} />
          <Text fw={500} size="lg">{t('employees.title')}</Text>
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
            onClick={() => router.push(`/${locale}/modules/hr/employees/create`)}
          >
            {t('actions.newEmployee')}
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
          placeholder={t('employees.filter.department')}
          data={departments.map(dept => ({ value: dept, label: dept }))}
          value={departmentFilter || null}
          onChange={(value) => setDepartmentFilter(value || undefined)}
          clearable
          style={{ width: 150 }}
        />
        <Select
          placeholder={t('employees.filter.workType')}
          data={[
            { value: 'full_time', label: t('employees.workTypes.full_time') },
            { value: 'part_time', label: t('employees.workTypes.part_time') },
            { value: 'contract', label: t('employees.workTypes.contract') },
          ]}
          value={workTypeFilter || null}
          onChange={(value) => setWorkTypeFilter(value as WorkType || undefined)}
          clearable
          style={{ width: 150 }}
        />
        <Select
          placeholder={t('employees.filter.status')}
          data={[
            { value: 'true', label: tGlobal('status.active') },
            { value: 'false', label: tGlobal('status.inactive') },
          ]}
          value={isActiveFilter !== undefined ? isActiveFilter.toString() : null}
          onChange={(value) => setIsActiveFilter(value === null ? undefined : value === 'true')}
          clearable
          style={{ width: 120 }}
        />
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('employees.table.employeeNumber')}</Table.Th>
            <Table.Th>{t('employees.table.name')}</Table.Th>
            <Table.Th>{t('employees.table.email')}</Table.Th>
            <Table.Th>{t('employees.table.department')}</Table.Th>
            <Table.Th>{t('employees.table.position')}</Table.Th>
            <Table.Th>{t('employees.table.workType')}</Table.Th>
            <Table.Th>{t('employees.table.hireDate')}</Table.Th>
            <Table.Th>{t('employees.table.actions')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.employees.map((employee) => (
            <Table.Tr key={employee.id}>
              <Table.Td>{employee.employeeNumber}</Table.Td>
              <Table.Td>{employee.user?.name || '-'}</Table.Td>
              <Table.Td>{employee.user?.email || '-'}</Table.Td>
              <Table.Td>{employee.department}</Table.Td>
              <Table.Td>{employee.position}</Table.Td>
              <Table.Td>{getWorkTypeBadge(employee.workType)}</Table.Td>
              <Table.Td>{dayjs(employee.hireDate).format('DD.MM.YYYY')}</Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <Tooltip label={t('actions.view')}>
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => router.push(`/${locale}/modules/hr/employees/${employee.id}`)}
                    >
                      <IconEye size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t('actions.edit')} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      onClick={() => router.push(`/${locale}/modules/hr/employees/${employee.id}/edit`)}
                    >
                      <IconEdit size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t('actions.delete')}>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => handleDelete(employee.id)}
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







