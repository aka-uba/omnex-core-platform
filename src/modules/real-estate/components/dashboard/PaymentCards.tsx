'use client';

import { useMemo, useCallback } from 'react';
import { Paper, Text, Badge, ActionIcon, Tooltip, Skeleton } from '@mantine/core';
import { IconCheck, IconEye, IconAlertTriangle, IconClock, IconArrowRight, IconCalendar } from '@tabler/icons-react';
import { usePaymentAnalytics, useMarkPaymentAsPaid } from '@/hooks/usePayments';
import { useTranslation } from '@/lib/i18n/client';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import styles from './PaymentCards.module.css';

interface PaymentCardsProps {
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

export function PaymentCards({ locale }: PaymentCardsProps) {
  const { t } = useTranslation('modules/real-estate');
  const router = useRouter();
  const { data, isLoading, refetch } = usePaymentAnalytics();
  const markAsPaid = useMarkPaymentAsPaid();

  const formatCurrency = useCallback((amount: number, currency?: string) => {
    const localeMap: Record<string, string> = {
      tr: 'tr-TR',
      en: 'en-US',
      de: 'de-DE',
      ar: 'ar-SA',
    };
    const currencyMap: Record<string, string> = {
      tr: 'TRY',
      en: 'USD',
      de: 'EUR',
      ar: 'SAR',
    };
    return new Intl.NumberFormat(localeMap[locale] || 'en-US', {
      style: 'currency',
      currency: currency || currencyMap[locale] || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, [locale]);

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
    if (isOverdue) return styles.urgent;
    if (days <= 3) return styles.urgent;
    if (days <= 7) return styles.warning;
    return styles.normal;
  }, []);

  const getMonthName = useCallback((date: string) => {
    const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const d = dayjs(date);
    return t(`dashboard.months.${monthKeys[d.month()]}`);
  }, [t]);

  const renderPaymentCard = useCallback((
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
        className={`${styles.paymentCard} ${isOverdue ? styles.overdueCard : styles.upcomingCard} ${styles[`delay${index}`]}`}
        onClick={() => handleViewPayment(payment)}
      >
        {/* Bottom gradient line */}
        <div className={`${styles.gradientLine} ${isOverdue ? styles.redGradient : styles.blueGradient}`} />

        <div className={styles.cardContent}>
          {/* Left side */}
          <div className={styles.leftContent}>
            <span className={styles.propertyBadge}>
              {payment.propertyName} - {payment.apartmentUnitNumber}
            </span>
            <div className={styles.tenantInfo}>
              <h3 className={styles.tenantName}>{payment.tenantName}</h3>
              <p className={styles.dateInfo}>
                <IconCalendar size={14} />
                {dueDate.format('DD')} {getMonthName(payment.dueDate)}
                {isProjected && (
                  <Badge size="xs" variant="outline" color="gray" ml={8}>
                    {t('payments.quickBoard.projected')}
                  </Badge>
                )}
              </p>
            </div>
          </div>

          {/* Right side - amount, days badge and actions */}
          <div className={styles.rightContent}>
            <div className={styles.amountInfo}>
              <span className={styles.amountText}>{formatCurrency(payment.amount)}</span>
              <span className={`${styles.daysBadge} ${getDaysBadgeClass(days, isOverdue)}`}>
                {isOverdue
                  ? `${days} ${t('payments.quickBoard.daysLate').toUpperCase()}`
                  : `${days} ${t('payments.quickBoard.daysLeft').toUpperCase()}`
                }
              </span>
            </div>
            {/* Actions */}
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
        <Skeleton key={i} height={100} radius="lg" mb={16} />
      ))}
    </div>
  ), []);

  return (
    <div className={styles.container}>
      {/* Upcoming Payments Panel */}
      <Paper
        shadow="lg"
        radius="xl"
        withBorder
        className={styles.boardPanel}
      >
        {/* Header */}
        <div className={styles.panelHeader}>
          <div className={styles.headerContent}>
            <div className={`${styles.headerIconWrapper} ${styles.blue}`}>
              <IconClock size={24} />
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

        {/* Cards Container */}
        <div className={styles.scrollContainer}>
          {isLoading ? (
            renderSkeleton()
          ) : upcomingPayments.length === 0 ? (
            renderEmptyState(t('payments.quickBoard.noUpcoming'))
          ) : (
            <div className={styles.cardList}>
              {upcomingPayments.map((payment, index) =>
                renderPaymentCard(payment, false, index)
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
            <IconArrowRight size={18} />
          </div>
        )}
      </Paper>

      {/* Overdue Payments Panel */}
      <Paper
        shadow="lg"
        radius="xl"
        withBorder
        className={styles.boardPanel}
      >
        {/* Header */}
        <div className={styles.panelHeader}>
          <div className={styles.headerContent}>
            <div className={`${styles.headerIconWrapper} ${styles.red}`}>
              <IconAlertTriangle size={24} />
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

        {/* Cards Container */}
        <div className={styles.scrollContainer}>
          {isLoading ? (
            renderSkeleton()
          ) : overduePayments.length === 0 ? (
            renderEmptyState(t('payments.quickBoard.noOverdue'))
          ) : (
            <div className={styles.cardList}>
              {overduePayments.map((payment, index) =>
                renderPaymentCard(payment, true, index)
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
            <IconArrowRight size={18} />
          </div>
        )}
      </Paper>
    </div>
  );
}
