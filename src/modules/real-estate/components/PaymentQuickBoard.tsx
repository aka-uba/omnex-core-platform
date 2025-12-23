'use client';

import { useMemo, useCallback } from 'react';
import { Paper, Text, Badge, ActionIcon, Group, Tooltip, Skeleton, useMantineColorScheme } from '@mantine/core';
import { IconCheck, IconEye, IconAlertTriangle, IconClock, IconArrowRight } from '@tabler/icons-react';
import { usePaymentAnalytics, useMarkPaymentAsPaid } from '@/hooks/usePayments';
import { useTranslation } from '@/lib/i18n/client';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import styles from './PaymentQuickBoard.module.css';

interface PaymentQuickBoardProps {
  locale: string;
}

interface QuickPaymentItem {
  id: string;
  apartmentUnitNumber: string;
  propertyName: string;
  propertyAddress: string;
  tenantName: string;
  amount: number;
  dueDate: string;
  daysUntilDue?: number;
  daysOverdue?: number;
  isProjected?: boolean;
  contractId?: string;
}

export function PaymentQuickBoard({ locale }: PaymentQuickBoardProps) {
  const { t } = useTranslation('modules/real-estate');
  const router = useRouter();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  const { data, isLoading, refetch } = usePaymentAnalytics();
  const markAsPaid = useMarkPaymentAsPaid();

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  const handleMarkAsPaid = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAsPaid.mutateAsync({ id, paidDate: new Date() });
      notifications.show({
        title: t('messages.success'),
        message: t('payments.markedAsPaid'),
        color: 'green',
      });
      refetch();
    } catch (error) {
      notifications.show({
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('payments.markAsPaidError'),
        color: 'red',
      });
    }
  }, [markAsPaid, t, refetch]);

  const handleViewPayment = useCallback((payment: QuickPaymentItem) => {
    if (payment.isProjected && payment.contractId) {
      // For projected payments, navigate to contract detail
      router.push(`/${locale}/modules/real-estate/contracts/${payment.contractId}`);
    } else {
      router.push(`/${locale}/modules/real-estate/payments/${payment.id}`);
    }
  }, [router, locale]);

  const upcomingPayments = useMemo(() => {
    return (data?.upcomingPayments || []).slice(0, 8);
  }, [data]);

  const overduePayments = useMemo(() => {
    return (data?.overduePayments || []).slice(0, 8);
  }, [data]);

  const getUrgencyColor = useCallback((days: number, isOverdue: boolean) => {
    if (isOverdue) {
      if (days > 30) return 'red';
      if (days > 14) return 'orange';
      return 'yellow';
    } else {
      if (days <= 3) return 'red';
      if (days <= 7) return 'orange';
      if (days <= 14) return 'yellow';
      return 'blue';
    }
  }, []);

  const renderPaymentRow = useCallback((
    payment: QuickPaymentItem,
    isOverdue: boolean,
    index: number
  ) => {
    const days = isOverdue ? payment.daysOverdue! : payment.daysUntilDue!;
    const urgencyColor = getUrgencyColor(days, isOverdue);
    const isProjected = payment.isProjected === true;

    return (
      <div
        key={payment.id}
        className={`${styles.paymentRow} ${styles[`delay${index}`]}`}
        onClick={() => handleViewPayment(payment)}
      >
        <div className={styles.rowContent}>
          {/* Left: Property, Apartment & Tenant Info */}
          <div className={styles.leftSection}>
            <div className={styles.apartmentBadge}>
              <Text size="sm" fw={600} className={styles.apartmentText}>
                {payment.propertyName} - {payment.apartmentUnitNumber}
              </Text>
            </div>
            <Text size="xs" c="dimmed" className={styles.tenantText} lineClamp={1}>
              {payment.tenantName}
            </Text>
            <div className={styles.metaRow}>
              <Text size="xs" c="dimmed" className={styles.dateText}>
                {dayjs(payment.dueDate).format('DD MMM')}
              </Text>
              {isProjected && (
                <Badge size="xs" variant="outline" color="gray">
                  {t('payments.quickBoard.projected')}
                </Badge>
              )}
            </div>
          </div>

          {/* Center: Amount */}
          <div className={styles.centerSection}>
            <Text size="sm" fw={700} className={styles.amountText}>
              {formatCurrency(payment.amount)}
            </Text>
          </div>

          {/* Right: Days Badge & Actions */}
          <div className={styles.rightSection}>
            <Badge
              color={urgencyColor}
              variant="light"
              size="sm"
              className={`${styles.daysBadge} ${isOverdue ? styles.pulse : ''}`}
            >
              {isOverdue
                ? `${days} ${t('payments.quickBoard.daysLate')}`
                : `${days} ${t('payments.quickBoard.daysLeft')}`
              }
            </Badge>

            <Group gap={4} className={styles.actions}>
              {!isOverdue && !isProjected && (
                <Tooltip label={t('payments.markAsPaid')} withArrow>
                  <ActionIcon
                    variant="light"
                    color="green"
                    size="sm"
                    onClick={(e) => handleMarkAsPaid(payment.id, e)}
                    loading={markAsPaid.isPending}
                  >
                    <IconCheck size={14} />
                  </ActionIcon>
                </Tooltip>
              )}
              <Tooltip label={isProjected ? t('payments.quickBoard.viewContract') : t('actions.view')} withArrow>
                <ActionIcon
                  variant="light"
                  color="blue"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewPayment(payment);
                  }}
                >
                  <IconEye size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </div>
        </div>

        {/* Progress indicator */}
        <div
          className={styles.progressBar}
          style={{
            backgroundColor: `var(--mantine-color-${urgencyColor}-${isDark ? '9' : '2'})`,
            width: isOverdue
              ? `${Math.min(100, (days / 60) * 100)}%`
              : `${Math.max(0, 100 - (days / 30) * 100)}%`
          }}
        />
      </div>
    );
  }, [formatCurrency, getUrgencyColor, handleMarkAsPaid, handleViewPayment, isDark, markAsPaid.isPending, t]);

  const renderEmptyState = useCallback((message: string) => (
    <div className={styles.emptyState}>
      <Text size="sm" c="dimmed" ta="center">
        {message}
      </Text>
    </div>
  ), []);

  const renderSkeleton = useCallback(() => (
    <div className={styles.skeletonContainer}>
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} height={48} radius="md" mb={8} />
      ))}
    </div>
  ), []);

  return (
    <div className={styles.container}>
      {/* Upcoming Payments - Left Column */}
      <Paper
        shadow="sm"
        radius="md"
        withBorder
        className={`${styles.boardPanel} ${styles.upcomingPanel}`}
      >
        <div className={styles.panelHeader}>
          <Group gap="xs">
            <IconClock size={20} className={styles.headerIcon} />
            <div>
              <Text fw={600} size="sm">{t('payments.quickBoard.upcoming')}</Text>
              <Text size="xs" c="dimmed">{t('payments.quickBoard.next30Days')}</Text>
            </div>
          </Group>
          <Badge color="blue" variant="light" size="lg">
            {upcomingPayments.length}
          </Badge>
        </div>

        <div className={styles.scrollContainer}>
          {isLoading ? (
            renderSkeleton()
          ) : upcomingPayments.length === 0 ? (
            renderEmptyState(t('payments.quickBoard.noUpcoming'))
          ) : (
            <div className={styles.paymentList}>
              {upcomingPayments.map((payment, index) =>
                renderPaymentRow(payment, false, index)
              )}
            </div>
          )}
        </div>

        {upcomingPayments.length > 0 && (
          <div
            className={styles.viewAllLink}
            onClick={() => router.push(`/${locale}/modules/real-estate/payments?status=pending`)}
          >
            <Text size="xs" c="blue">{t('dashboard.viewAll')}</Text>
            <IconArrowRight size={14} />
          </div>
        )}
      </Paper>

      {/* Overdue Payments - Right Column */}
      <Paper
        shadow="sm"
        radius="md"
        withBorder
        className={`${styles.boardPanel} ${styles.overduePanel}`}
      >
        <div className={styles.panelHeader}>
          <Group gap="xs">
            <IconAlertTriangle size={20} className={`${styles.headerIcon} ${styles.warningIcon}`} />
            <div>
              <Text fw={600} size="sm">{t('payments.quickBoard.overdue')}</Text>
              <Text size="xs" c="dimmed">{t('payments.quickBoard.requiresAction')}</Text>
            </div>
          </Group>
          <Badge color="red" variant="light" size="lg">
            {overduePayments.length}
          </Badge>
        </div>

        <div className={styles.scrollContainer}>
          {isLoading ? (
            renderSkeleton()
          ) : overduePayments.length === 0 ? (
            renderEmptyState(t('payments.quickBoard.noOverdue'))
          ) : (
            <div className={styles.paymentList}>
              {overduePayments.map((payment, index) =>
                renderPaymentRow(payment, true, index)
              )}
            </div>
          )}
        </div>

        {overduePayments.length > 0 && (
          <div
            className={styles.viewAllLink}
            onClick={() => router.push(`/${locale}/modules/real-estate/payments?status=overdue`)}
          >
            <Text size="xs" c="red">{t('dashboard.viewAll')}</Text>
            <IconArrowRight size={14} />
          </div>
        )}
      </Paper>
    </div>
  );
}
