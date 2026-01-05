'use client';

import { useMemo, useCallback } from 'react';
import { Paper, Text, Badge, ActionIcon, Tooltip, Skeleton } from '@mantine/core';
import { IconCheck, IconEye, IconAlertTriangle, IconClock, IconArrowRight } from '@tabler/icons-react';
import { usePaymentAnalytics, useMarkPaymentAsPaid } from '@/hooks/usePayments';
import { useTranslation } from '@/lib/i18n/client';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { useCurrency } from '@/hooks/useCurrency';
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
  const { data, isLoading, refetch } = usePaymentAnalytics();
  const markAsPaid = useMarkPaymentAsPaid();
  const { formatCurrency } = useCurrency();

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

  const getDaysBadgeClass = useCallback((days: number, isOverdue: boolean) => {
    if (isOverdue) {
      return styles.urgent;
    }
    if (days <= 3) return styles.urgent;
    if (days <= 7) return styles.warning;
    return styles.normal;
  }, []);

  const getMonthName = useCallback((date: string) => {
    const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const d = dayjs(date);
    return t(`dashboard.months.${monthKeys[d.month()]}`);
  }, [t]);

  const renderTimelineItem = useCallback((
    payment: QuickPaymentItem,
    isOverdue: boolean,
    index: number
  ) => {
    const days = isOverdue ? payment.daysOverdue! : payment.daysUntilDue!;
    const isProjected = payment.isProjected === true;
    const dueDate = dayjs(payment.dueDate);

    return (
      <div
        key={payment.id}
        className={`${styles.timelineItem} ${isOverdue ? styles.overdue : ''} ${styles[`delay${index}`]}`}
        onClick={() => handleViewPayment(payment)}
      >
        {/* Date Column */}
        <div className={styles.dateColumn}>
          <span className={styles.dateDay}>{dueDate.format('DD')}</span>
          <span className={styles.dateMonth}>{getMonthName(payment.dueDate)}</span>
        </div>

        {/* Timeline Dot */}
        <div className={styles.timelineDot} />

        {/* Card */}
        <div className={styles.timelineCard}>
          {/* Card Header */}
          <div className={styles.cardHeader}>
            <span className={styles.propertyBadge}>
              {payment.propertyName} - {payment.apartmentUnitNumber}
            </span>
            <span className={`${styles.daysBadge} ${getDaysBadgeClass(days, isOverdue)}`}>
              {isOverdue
                ? `${days} ${t('payments.quickBoard.daysLate').toUpperCase()}`
                : `${days} ${t('payments.quickBoard.daysLeft').toUpperCase()}`
              }
            </span>
          </div>

          {/* Card Content */}
          <div className={styles.cardContent}>
            <div className={styles.tenantInfo}>
              <span className={styles.tenantName}>{payment.tenantName}</span>
              <span className={styles.paymentType}>
                {t('payments.quickBoard.rentPayment')}
                {isProjected && (
                  <Badge size="xs" variant="outline" color="gray" className={styles.projectedBadge}>
                    {t('payments.quickBoard.projected')}
                  </Badge>
                )}
              </span>
            </div>
            <div className={styles.amountRow}>
              <span className={styles.amountText}>{formatCurrency(payment.amount)}</span>
              <div className={styles.cardActions}>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [formatCurrency, getDaysBadgeClass, getMonthName, handleMarkAsPaid, handleViewPayment, markAsPaid.isPending, t]);

  const renderEmptyState = useCallback((message: string) => (
    <div className={styles.emptyState}>
      <Text size="sm" c="dimmed" ta="center">
        {message}
      </Text>
    </div>
  ), []);

  const renderSkeleton = useCallback(() => (
    <div className={styles.skeletonContainer}>
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} height={80} radius="md" mb={16} />
      ))}
    </div>
  ), []);

  return (
    <div className={styles.container}>
      {/* Upcoming Payments Panel */}
      <Paper
        shadow="lg"
        radius="lg"
        withBorder
        className={styles.boardPanel}
      >
        {/* Header */}
        <div className={styles.panelHeader}>
          <div className={styles.headerContent}>
            <div className={`${styles.headerIconWrapper} ${styles.blue}`}>
              <IconClock size={20} />
            </div>
            <div className={styles.headerText}>
              <h2>{t('payments.quickBoard.upcoming')}</h2>
              <p>{t('payments.quickBoard.next30Days')}</p>
            </div>
          </div>
          <span className={`${styles.countBadge} ${styles.blue}`}>
            {upcomingPayments.length}
          </span>
        </div>

        {/* Timeline Content */}
        <div className={styles.scrollContainer}>
          {/* Timeline Line */}
          <div className={styles.timelineLine} />

          {isLoading ? (
            renderSkeleton()
          ) : upcomingPayments.length === 0 ? (
            renderEmptyState(t('payments.quickBoard.noUpcoming'))
          ) : (
            <div className={styles.paymentList}>
              {upcomingPayments.map((payment, index) =>
                renderTimelineItem(payment, false, index)
              )}
            </div>
          )}
        </div>

        {/* View All Footer */}
        {upcomingPayments.length > 0 && (
          <div
            className={`${styles.viewAllLink} ${styles.blue}`}
            onClick={() => router.push(`/${locale}/modules/real-estate/payments?status=pending`)}
          >
            <span>{t('dashboard.viewAll')}</span>
            <IconArrowRight size={16} />
          </div>
        )}
      </Paper>

      {/* Overdue Payments Panel */}
      <Paper
        shadow="lg"
        radius="lg"
        withBorder
        className={styles.boardPanel}
      >
        {/* Header */}
        <div className={styles.panelHeader}>
          <div className={styles.headerContent}>
            <div className={`${styles.headerIconWrapper} ${styles.red}`}>
              <IconAlertTriangle size={20} />
            </div>
            <div className={styles.headerText}>
              <h2>{t('payments.quickBoard.overdue')}</h2>
              <p>{t('payments.quickBoard.requiresAction')}</p>
            </div>
          </div>
          <span className={`${styles.countBadge} ${styles.red}`}>
            {overduePayments.length}
          </span>
        </div>

        {/* Timeline Content */}
        <div className={styles.scrollContainer}>
          {/* Timeline Line */}
          <div className={styles.timelineLine} />

          {isLoading ? (
            renderSkeleton()
          ) : overduePayments.length === 0 ? (
            renderEmptyState(t('payments.quickBoard.noOverdue'))
          ) : (
            <div className={styles.paymentList}>
              {overduePayments.map((payment, index) =>
                renderTimelineItem(payment, true, index)
              )}
            </div>
          )}
        </div>

        {/* View All Footer */}
        {overduePayments.length > 0 && (
          <div
            className={`${styles.viewAllLink} ${styles.red}`}
            onClick={() => router.push(`/${locale}/modules/real-estate/payments?status=overdue`)}
          >
            <span>{t('dashboard.viewAll')}</span>
            <IconArrowRight size={16} />
          </div>
        )}
      </Paper>
    </div>
  );
}
