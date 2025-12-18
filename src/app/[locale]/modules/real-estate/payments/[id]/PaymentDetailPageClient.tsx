'use client';

import { Container, Paper, Group, Text, Badge, Stack, Grid, Divider } from '@mantine/core';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';
import { IconCurrencyDollar, IconEdit } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { usePayment } from '@/hooks/usePayments';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import dayjs from 'dayjs';
import type { PaymentType, PaymentStatus, PaymentMethod } from '@/modules/real-estate/types/payment';

export function PaymentDetailPageClient({ locale, paymentId }: { locale: string; paymentId: string }) {
  const params = useParams();
  const router = useRouter();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const { data: payment, isLoading, error } = usePayment(paymentId);

  if (error || (!isLoading && !payment)) {
    return (
      <Container size="xl" pt="xl">
        <CentralPageHeader
          title={t('payments.detail.title')}
          description={t('payments.detail.description')}
          namespace="modules/real-estate"
          icon={<IconCurrencyDollar size={32} />}
          breadcrumbs={[
            { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
            { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
            { label: t('payments.title'), href: `/${currentLocale}/modules/real-estate/payments`, namespace: 'modules/real-estate' },
            { label: t('payments.detail.title'), namespace: 'modules/real-estate' },
          ]}
        />
        <Text c="red" mt="md">{tGlobal('common.notFound')}</Text>
      </Container>
    );
  }

  const getTypeBadge = (type: PaymentType) => {
    const typeColors: Record<PaymentType, string> = {
      rent: 'blue',
      deposit: 'green',
      fee: 'orange',
      maintenance: 'purple',
      utility: 'cyan',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`payments.types.${type}`) || type}
      </Badge>
    );
  };

  const getStatusBadge = (status: PaymentStatus) => {
    const statusColors: Record<PaymentStatus, string> = {
      pending: 'yellow',
      paid: 'green',
      overdue: 'red',
      cancelled: 'gray',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`payments.status.${status}`) || status}
      </Badge>
    );
  };

  const getPaymentMethodLabel = (method: PaymentMethod | null | undefined) => {
    if (!method) return tGlobal('common.noData');
    // Map snake_case to camelCase for i18n keys
    const methodKey = method === 'bank_transfer' ? 'bankTransfer' : method;
    return t(`payments.methods.${methodKey}`);
  };

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('payments.detail.title')}
        description={t('payments.detail.description')}
        namespace="modules/real-estate"
        icon={<IconCurrencyDollar size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('payments.title'), href: `/${currentLocale}/modules/real-estate/payments`, namespace: 'modules/real-estate' },
          { label: t('payments.detail.title'), namespace: 'modules/real-estate' },
        ]}
        actions={
          !isLoading && payment ? [
            {
              label: t('actions.edit'),
              icon: <IconEdit size={18} />,
              onClick: () => {
                router.push(`/${currentLocale}/modules/real-estate/payments/${paymentId}/edit`);
              },
              variant: 'light',
            },
          ] : []
        }
      />

      {isLoading ? (
        <DetailPageSkeleton />
      ) : payment ? (
        (() => {
          const apartment = (payment as any).apartment;
          const contract = (payment as any).contract;
          const property = apartment?.property;

          return (
            <Paper shadow="xs" p="md" mt="md">
              <Stack gap="xl">
                {/* Header Section */}
                <Group justify="space-between" align="flex-start">
                  <Stack gap="xs">
                    <Group>
                      <Text fw={700} size="xl">
                        {Number(payment.totalAmount).toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: payment.currency || 'TRY',
                        })}
                      </Text>
                      {getTypeBadge(payment.type)}
                      {getStatusBadge(payment.status)}
                    </Group>
                    {payment.isAutoGenerated && (
                      <Badge color="blue" variant="light">
                        {t('payments.autoGenerated')}
                      </Badge>
                    )}
                  </Stack>
                </Group>

                <Divider />

                {/* Payment Information */}
                <Stack gap="md">
                  <Text fw={600} size="lg">{t('payments.detail.paymentInfo')}</Text>
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text size="sm" c="dimmed">{t('payments.detail.type')}</Text>
                      <Text fw={500} component="div">{getTypeBadge(payment.type)}</Text>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text size="sm" c="dimmed">{t('payments.detail.status')}</Text>
                      <Text fw={500} component="div">{getStatusBadge(payment.status)}</Text>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text size="sm" c="dimmed">{t('payments.detail.amount')}</Text>
                      <Text fw={500}>
                        {Number(payment.amount).toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: payment.currency || 'TRY',
                        })}
                      </Text>
                    </Grid.Col>
                    {payment.extraCharges && Array.isArray(payment.extraCharges) && payment.extraCharges.length > 0 && (
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Text size="sm" c="dimmed">{t('payments.detail.extraCharges')}</Text>
                        <Stack gap="xs">
                          {payment.extraCharges.map((charge: any, index: number) => (
                            <Text key={index} size="sm">
                              {charge.name}: {Number(charge.amount).toLocaleString('tr-TR', {
                                style: 'currency',
                                currency: payment.currency || 'TRY',
                              })}
                            </Text>
                          ))}
                        </Stack>
                      </Grid.Col>
                    )}
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text size="sm" c="dimmed">{t('payments.detail.totalAmount')}</Text>
                      <Text fw={600} size="lg">
                        {Number(payment.totalAmount).toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: payment.currency || 'TRY',
                        })}
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text size="sm" c="dimmed">{t('payments.detail.currency')}</Text>
                      <Text fw={500}>{payment.currency || 'TRY'}</Text>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text size="sm" c="dimmed">{t('payments.detail.dueDate')}</Text>
                      <Text fw={500}>{dayjs(payment.dueDate).format('DD.MM.YYYY')}</Text>
                    </Grid.Col>
                    {payment.paidDate && (
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Text size="sm" c="dimmed">{t('payments.detail.paidDate')}</Text>
                        <Text fw={500}>{dayjs(payment.paidDate).format('DD.MM.YYYY')}</Text>
                      </Grid.Col>
                    )}
                    {payment.paymentMethod && (
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Text size="sm" c="dimmed">{t('payments.detail.paymentMethod')}</Text>
                        <Text fw={500}>{getPaymentMethodLabel(payment.paymentMethod)}</Text>
                      </Grid.Col>
                    )}
                    {payment.receiptNumber && (
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Text size="sm" c="dimmed">{t('payments.detail.receiptNumber')}</Text>
                        <Text fw={500}>{payment.receiptNumber}</Text>
                      </Grid.Col>
                    )}
                  </Grid>
                </Stack>

                {/* Related Information */}
                {(apartment || contract) && (
                  <>
                    <Divider />
                    <Stack gap="md">
                      <Text fw={600} size="lg">{t('payments.detail.relatedInfo')}</Text>
                      <Grid>
                        {apartment && (
                          <>
                            <Grid.Col span={{ base: 12, md: 6 }}>
                              <Text size="sm" c="dimmed">{t('payments.detail.apartment')}</Text>
                              <Text fw={500}>{apartment.unitNumber || tGlobal('common.noData')}</Text>
                            </Grid.Col>
                            {property && (
                              <Grid.Col span={{ base: 12, md: 6 }}>
                                <Text size="sm" c="dimmed">{t('payments.detail.property')}</Text>
                                <Text fw={500}>{property.name || property.address || tGlobal('common.noData')}</Text>
                              </Grid.Col>
                            )}
                          </>
                        )}
                        {contract && (
                          <Grid.Col span={{ base: 12, md: 6 }}>
                            <Text size="sm" c="dimmed">{t('payments.detail.contract')}</Text>
                            <Text fw={500}>{contract.contractNumber || tGlobal('common.noData')}</Text>
                          </Grid.Col>
                        )}
                      </Grid>
                    </Stack>
                  </>
                )}

                {/* Notes */}
                {payment.notes && (
                  <>
                    <Divider />
                    <Stack gap="md">
                      <Text fw={600} size="lg">{t('payments.detail.notes')}</Text>
                      <Text>{payment.notes}</Text>
                    </Stack>
                  </>
                )}

                {/* System Information */}
                <Divider />
                <Stack gap="md">
                  <Text fw={600} size="lg">{t('payments.detail.systemInfo')}</Text>
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text size="sm" c="dimmed">{t('payments.detail.createdAt')}</Text>
                      <Text fw={500}>{dayjs(payment.createdAt).format('DD.MM.YYYY HH:mm')}</Text>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text size="sm" c="dimmed">{t('payments.detail.updatedAt')}</Text>
                      <Text fw={500}>{dayjs(payment.updatedAt).format('DD.MM.YYYY HH:mm')}</Text>
                    </Grid.Col>
                    {payment.reminderSent && (
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Badge color="blue" variant="light">
                          {t('payments.detail.reminderSent')}
                        </Badge>
                      </Grid.Col>
                    )}
                  </Grid>
                </Stack>
              </Stack>
            </Paper>
          );
        })()
      ) : null}
    </Container>
  );
}

