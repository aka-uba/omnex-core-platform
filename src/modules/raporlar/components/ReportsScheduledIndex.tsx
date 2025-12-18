'use client';

import { useState, useMemo } from 'react';
import { Container, Stack, Text, Button, Card, Group, Badge, ActionIcon } from '@mantine/core';
import { IconPlus, IconClock, IconPlayerPlay, IconPlayerPause, IconTrash, IconEdit } from '@tabler/icons-react';
import { useRouter, usePathname } from 'next/navigation';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useReports } from '../hooks/useReports';
import { ReportFilters } from './ReportFilters';
import { useNotification } from '@/hooks/useNotification';
import { DataTableSkeleton } from '@/components/tables/DataTableSkeleton';
import { useTranslation } from '@/lib/i18n/client';
import dayjs from 'dayjs';

interface ScheduledReport {
  id: string;
  name: string;
  type: string;
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
  status: 'active' | 'paused' | 'completed';
  nextRun: string;
  lastRun?: string;
  createdAt: string;
}

export function ReportsScheduledIndex() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation('modules/raporlar');
  const { data: reportsData, isLoading, error } = useReports();
  const { showSuccess, showConfirm } = useNotification();
  const [searchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: dayjs().subtract(30, 'days').toDate(),
    to: dayjs().toDate(),
  });

  const reports = reportsData?.reports || [];
  const loading = isLoading;

  // Mock scheduled reports - In real implementation, this would come from a separate API
  const scheduledReports: ScheduledReport[] = useMemo(() => {
    // For now, we'll create mock scheduled reports based on existing reports
    // In production, this should come from a ScheduledReport model/API
    return reports
      .filter((report: any) => {
        const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (report.typeName || report.type).toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = !selectedType || report.type === selectedType;
        return matchesSearch && matchesType;
      })
      .slice(0, 10)
      .map((report: any, index: number) => ({
        id: report.id,
        name: report.name,
        type: report.typeName || report.type,
        schedule: {
          frequency: ['daily', 'weekly', 'monthly'][index % 3] as 'daily' | 'weekly' | 'monthly',
          time: '09:00',
          dayOfWeek: index % 7,
          dayOfMonth: index % 28 + 1,
        },
        status: ['active', 'paused', 'completed'][index % 3] as 'active' | 'paused' | 'completed',
        nextRun: dayjs().add(index + 1, 'days').toISOString(),
        lastRun: index % 2 === 0 ? dayjs().subtract(index, 'days').toISOString() : '',
        createdAt: report.createdAt,
      }));
  }, [reports, searchQuery, selectedType]);

  const handleCreate = () => {
    const locale = pathname?.split('/')[1] || 'tr';
    router.push(`/${locale}/modules/reports/create`);
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    showConfirm(
      t('scheduled.confirmations.toggleTitle'),
      currentStatus === 'active' 
        ? t('scheduled.confirmations.pauseMessage')
        : t('scheduled.confirmations.activateMessage'),
      async () => {
        // TODO: Implement API call to toggle status
        showSuccess(t('actions.success'), t('scheduled.messages.statusUpdated'));
      }
    );
  };

  const handleDelete = (id: string) => {
    showConfirm(
      t('scheduled.confirmations.deleteTitle'),
      t('scheduled.confirmations.deleteMessage'),
      async () => {
        // TODO: Implement API call to delete scheduled report
        showSuccess(t('actions.success'), t('scheduled.messages.deleted'));
      }
    );
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'green',
      paused: 'yellow',
      completed: 'blue',
    };
    const statusLabels: Record<string, string> = {
      active: t('scheduled.status.active'),
      paused: t('scheduled.status.paused'),
      completed: t('scheduled.status.completed'),
    };
    return (
      <Badge color={colors[status] || 'gray'} variant="light">
        {statusLabels[status] || status}
      </Badge>
    );
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      daily: t('scheduled.frequency.daily'),
      weekly: t('scheduled.frequency.weekly'),
      monthly: t('scheduled.frequency.monthly'),
    };
    return labels[frequency] || frequency;
  };

  return (
    <Container size="xl" py="xl">
      <CentralPageHeader
        title={t('page.scheduled.title')}
        description={t('page.scheduled.description')}
        namespace="modules/raporlar"
        icon={<IconClock size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: '/dashboard', namespace: 'global' },
          { label: 'menu.label', href: '/modules/raporlar', namespace: 'modules/raporlar' },
          { label: 'page.scheduled.title', namespace: 'modules/raporlar' },
        ]}
        actions={[
          {
            label: 'actions.create',
            icon: <IconPlus size={18} />,
            onClick: handleCreate,
            variant: 'filled',
          },
        ]}
      />

      <Stack gap="xl">
        {/* Filters */}
        <ReportFilters
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          reportTypes={[]}
        />

        {/* Scheduled Reports List */}
        {loading ? (
          <DataTableSkeleton columns={6} rows={8} />
        ) : error ? (
          <div className="text-center py-12">
            <Text c="red" size="lg">
              {t('errors.scheduledLoadFailed')}
            </Text>
          </div>
        ) : scheduledReports.length === 0 ? (
          <div className="text-center py-12">
            <Text c="dimmed" size="lg">
              {t('scheduled.empty')}
            </Text>
            <Button
              mt="md"
              leftSection={<IconPlus size={18} />}
              onClick={handleCreate}
            >
              {t('scheduled.createNew')}
            </Button>
          </div>
        ) : (
          <Stack gap="md">
            {scheduledReports.map((scheduled) => (
              <Card
                key={scheduled.id}
                padding="lg"
                radius="md"
                withBorder
                className="bg-white dark:bg-background-dark/50 border-gray-200 dark:border-white/10"
              >
                <Group justify="space-between" align="flex-start">
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <Group justify="space-between">
                      <Text size="lg" fw={600} className="text-gray-900 dark:text-white">
                        {scheduled.name}
                      </Text>
                      {getStatusBadge(scheduled.status)}
                    </Group>
                    <Text size="sm" c="dimmed">
                      {t('scheduled.fields.type')}: {scheduled.type}
                    </Text>
                    <Group gap="md" mt="xs">
                      <Text size="sm">
                        <strong>{t('scheduled.fields.frequency')}:</strong> {getFrequencyLabel(scheduled.schedule.frequency)}
                      </Text>
                      <Text size="sm">
                        <strong>{t('scheduled.fields.time')}:</strong> {scheduled.schedule.time}
                      </Text>
                      <Text size="sm">
                        <strong>{t('scheduled.fields.nextRun')}:</strong>{' '}
                        {dayjs(scheduled.nextRun).format('DD.MM.YYYY HH:mm')}
                      </Text>
                      {scheduled.lastRun && (
                        <Text size="sm">
                          <strong>{t('scheduled.fields.lastRun')}:</strong>{' '}
                          {dayjs(scheduled.lastRun).format('DD.MM.YYYY HH:mm')}
                        </Text>
                      )}
                    </Group>
                  </Stack>
                  <Group gap="xs">
                    <ActionIcon
                      variant="light"
                      color={scheduled.status === 'active' ? 'yellow' : 'green'}
                      onClick={() => handleToggleStatus(scheduled.id, scheduled.status)}
                      title={scheduled.status === 'active' ? t('scheduled.actions.pause') : t('scheduled.actions.activate')}
                    >
                      {scheduled.status === 'active' ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} />}
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={() => {
                        const locale = pathname?.split('/')[1] || 'tr';
                        router.push(`/${locale}/modules/reports/${scheduled.id}/edit`);
                      }}
                      title={t('scheduled.actions.edit')}
                    >
                      <IconEdit size={18} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="red"
                      onClick={() => handleDelete(scheduled.id)}
                      title={t('scheduled.actions.delete')}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}

