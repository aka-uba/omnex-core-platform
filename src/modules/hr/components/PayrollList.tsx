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
  IconCurrencyDollar,
} from '@tabler/icons-react';
import { usePayrolls, useDeletePayroll } from '@/hooks/usePayrolls';
import { useEmployees } from '@/hooks/useEmployees';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useExport } from '@/lib/export/ExportProvider';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import type { PayrollStatus } from '@/modules/hr/types/hr';
import type { ExportFormat } from '@/lib/export/types';
import dayjs from 'dayjs';

interface PayrollListProps {
  locale: string;
}

export function PayrollList({ locale }: PayrollListProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/hr');
  const { t: tGlobal } = useTranslation('global');
  const { exportToExcel, exportToPDF, exportToCSV, isExporting } = useExport();
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [employeeIdFilter, setEmployeeIdFilter] = useState<string | undefined>();
  const [periodFilter, setPeriodFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<PayrollStatus | undefined>();

  const { data, isLoading, error } = usePayrolls({
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(employeeIdFilter ? { employeeId: employeeIdFilter } : {}),
    ...(periodFilter ? { period: periodFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  // Fetch employees for filter
  const { data: employeesData } = useEmployees({ page: 1, pageSize: 1000, isActive: true });

  const deletePayroll = useDeletePayroll();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: t('payrolls.delete.title'),
      message: t('payrolls.delete.confirm'),
      confirmLabel: tGlobal('common.delete'),
      confirmColor: 'red',
    });

    if (confirmed) {
      try {
        await deletePayroll.mutateAsync(id);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('payrolls.delete.success'),
        });
      } catch (error) {
        showToast({
          type: 'error',
          title: t('messages.error'),
          message: error instanceof Error ? error.message : t('payrolls.delete.error'),
        });
      }
    }
  };

  const handleExport = async (format: ExportFormat) => {
    if (!data) return;

    try {
      const exportData = {
        columns: [
          t('payrolls.table.employee'),
          t('payrolls.table.period'),
          t('payrolls.table.payDate'),
          t('payrolls.table.grossSalary'),
          t('payrolls.table.deductions'),
          t('payrolls.table.netSalary'),
          t('payrolls.table.status'),
        ],
        rows: data.payrolls.map((payroll) => [
          payroll.employee?.user?.name || payroll.employee?.employeeNumber || '-',
          payroll.period,
          dayjs(payroll.payDate).format('DD.MM.YYYY'),
          Number(payroll.grossSalary).toLocaleString('tr-TR', {
            style: 'currency',
            currency: 'TRY',
          }),
          Number(payroll.deductions).toLocaleString('tr-TR', {
            style: 'currency',
            currency: 'TRY',
          }),
          Number(payroll.netSalary).toLocaleString('tr-TR', {
            style: 'currency',
            currency: 'TRY',
          }),
          t(`payrolls.status.${payroll.status}`) || payroll.status,
        ]),
        metadata: {
          title: t('payrolls.title'),
          description: t('payrolls.exportDescription'),
          generatedAt: new Date().toISOString(),
        },
      };

      const options = {
        title: t('payrolls.title'),
        description: t('payrolls.exportDescription'),
        includeHeader: true,
        includeFooter: true,
        includePageNumbers: true,
        filename: `payrolls_${dayjs().format('YYYY-MM-DD')}`,
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
        message: t('payrolls.exportSuccess'),
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('payrolls.exportError'),
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

  const getStatusBadge = (status: PayrollStatus) => {
    const statusColors: Record<PayrollStatus, string> = {
      draft: 'gray',
      approved: 'blue',
      paid: 'green',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`payrolls.status.${status}`) || status}
      </Badge>
    );
  };

  // Get employees for filter
  const employeeOptions: Array<{ value: string; label: string }> = 
    (employeesData?.employees || []).map((emp) => ({
      value: emp.id,
      label: `${emp.user?.name || '-'} (${emp.employeeNumber})`,
    }));

  // Generate period options (last 12 months)
  const periodOptions = Array.from({ length: 12 }, (_, i) => {
    const date = dayjs().subtract(i, 'month');
    const value = date.format('YYYY-MM');
    const label = date.format('MMMM YYYY');
    return { value, label };
  });

  return (
    <Paper shadow="xs" p="md">
      <Group justify="space-between" mb="md">
        <Group>
          <IconCurrencyDollar size={24} />
          <Text fw={500} size="lg">{t('payrolls.title')}</Text>
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
            onClick={() => router.push(`/${locale}/modules/hr/payrolls/create`)}
          >
            {t('actions.newPayroll')}
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
          placeholder={t('payrolls.filter.employee')}
          data={employeeOptions}
          value={employeeIdFilter || null}
          onChange={(value) => setEmployeeIdFilter(value || undefined)}
          searchable
          clearable
          style={{ width: 200 }}
        />
        <Select
          placeholder={t('payrolls.filter.period')}
          data={periodOptions}
          value={periodFilter || null}
          onChange={(value) => setPeriodFilter(value || undefined)}
          clearable
          style={{ width: 150 }}
        />
        <Select
          placeholder={t('payrolls.filter.status')}
          data={[
            { value: 'draft', label: t('payrolls.status.draft') },
            { value: 'approved', label: t('payrolls.status.approved') },
            { value: 'paid', label: t('payrolls.status.paid') },
          ]}
          value={statusFilter || null}
          onChange={(value) => setStatusFilter(value as PayrollStatus || undefined)}
          clearable
          style={{ width: 150 }}
        />
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t('payrolls.table.employee')}</Table.Th>
            <Table.Th>{t('payrolls.table.period')}</Table.Th>
            <Table.Th>{t('payrolls.table.payDate')}</Table.Th>
            <Table.Th>{t('payrolls.table.grossSalary')}</Table.Th>
            <Table.Th>{t('payrolls.table.deductions')}</Table.Th>
            <Table.Th>{t('payrolls.table.netSalary')}</Table.Th>
            <Table.Th>{t('payrolls.table.status')}</Table.Th>
            <Table.Th>{t('payrolls.table.actions')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.payrolls.map((payroll) => (
            <Table.Tr key={payroll.id}>
              <Table.Td>{payroll.employee?.user?.name || payroll.employee?.employeeNumber || '-'}</Table.Td>
              <Table.Td>{payroll.period}</Table.Td>
              <Table.Td>{dayjs(payroll.payDate).format('DD.MM.YYYY')}</Table.Td>
              <Table.Td>
                {Number(payroll.grossSalary).toLocaleString('tr-TR', {
                  style: 'currency',
                  currency: 'TRY',
                })}
              </Table.Td>
              <Table.Td>
                {Number(payroll.deductions).toLocaleString('tr-TR', {
                  style: 'currency',
                  currency: 'TRY',
                })}
              </Table.Td>
              <Table.Td>
                {Number(payroll.netSalary).toLocaleString('tr-TR', {
                  style: 'currency',
                  currency: 'TRY',
                })}
              </Table.Td>
              <Table.Td>{getStatusBadge(payroll.status)}</Table.Td>
              <Table.Td>
                <Group gap="xs" justify="flex-end">
                  <Tooltip label={t('actions.view')} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => router.push(`/${locale}/modules/hr/payrolls/${payroll.id}`)}
                    >
                      <IconEye size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t('actions.edit')} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      onClick={() => router.push(`/${locale}/modules/hr/payrolls/${payroll.id}/edit`)}
                    >
                      <IconEdit size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t('actions.delete')} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => handleDelete(payroll.id)}
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







