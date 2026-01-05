'use client';

import { Container, Paper, Group, Text, Badge, Stack, Grid, Divider, Anchor, ThemeIcon, Card } from '@mantine/core';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';
import { IconCurrencyDollar, IconEdit, IconBuilding, IconHome, IconUser, IconFileText, IconMapPin } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { usePayment } from '@/hooks/usePayments';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { useCurrency } from '@/hooks/useCurrency';
import dayjs from 'dayjs';
import type { PaymentType, PaymentStatus, PaymentMethod } from '@/modules/real-estate/types/payment';

export function PaymentDetailPageClient({ locale, paymentId }: { locale: string; paymentId: string }) {
  const params = useParams();
  const router = useRouter();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const { formatCurrency, currency } = useCurrency();
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
                        {formatCurrency(Number(payment.totalAmount))}
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
                        {formatCurrency(Number(payment.amount))}
                      </Text>
                    </Grid.Col>
                    {payment.extraCharges && Array.isArray(payment.extraCharges) && payment.extraCharges.length > 0 && (
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Text size="sm" c="dimmed">{t('payments.detail.extraCharges')}</Text>
                        <Stack gap="xs">
                          {payment.extraCharges.map((charge: any, index: number) => (
                            <Text key={index} size="sm">
                              {charge.name}: {formatCurrency(Number(charge.amount))}
                            </Text>
                          ))}
                        </Stack>
                      </Grid.Col>
                    )}
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text size="sm" c="dimmed">{t('payments.detail.totalAmount')}</Text>
                      <Text fw={600} size="lg">
                        {formatCurrency(Number(payment.totalAmount))}
                      </Text>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Text size="sm" c="dimmed">{t('payments.detail.currency')}</Text>
                      <Text fw={500}>{currency}</Text>
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

                {/* Two Column Layout: Related Info (left) + Notes & System Info (right) */}
                <Divider />
                <Grid>
                  {/* Left Column: Related Info */}
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    {(apartment || contract || property) && (
                      <Stack gap="md">
                        <Text fw={600} size="lg">{t('payments.detail.relatedInfo')}</Text>

                        {/* Property -> Apartment -> Tenant hierarchy */}
                        <Card withBorder p="md" radius="md" bg="var(--mantine-color-default-hover)">
                          <Stack gap="sm">
                            {/* Property (Building) */}
                            {property && (
                              <Group gap="sm" align="flex-start">
                                <ThemeIcon variant="light" color="blue" size="lg">
                                  <IconBuilding size={18} />
                                </ThemeIcon>
                                <Stack gap={2} style={{ flex: 1 }}>
                                  <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
                                    {t('properties.title')}
                                  </Text>
                                  <Anchor
                                    href={`/${currentLocale}/modules/real-estate/properties/${property.id}`}
                                    fw={600}
                                    size="md"
                                  >
                                    {property.name || tGlobal('common.noData')}
                                  </Anchor>
                                  {(property.address || property.city) && (
                                    <Group gap="xs">
                                      <IconMapPin size={14} style={{ opacity: 0.7 }} />
                                      <Text size="sm" c="dimmed">
                                        {[property.address, property.city].filter(Boolean).join(', ')}
                                      </Text>
                                    </Group>
                                  )}
                                </Stack>
                              </Group>
                            )}

                            {/* Apartment (Unit) */}
                            {apartment && (
                              <Group gap="sm" align="flex-start" ml={property ? 'xl' : 0}>
                                <ThemeIcon variant="light" color="green" size="lg">
                                  <IconHome size={18} />
                                </ThemeIcon>
                                <Stack gap={2} style={{ flex: 1 }}>
                                  <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
                                    {t('apartments.title')}
                                  </Text>
                                  <Anchor
                                    href={`/${currentLocale}/modules/real-estate/apartments/${apartment.id}`}
                                    fw={600}
                                    size="md"
                                  >
                                    {t('apartments.form.unit')} {apartment.unitNumber}
                                  </Anchor>
                                </Stack>
                              </Group>
                            )}

                            {/* Tenant (from contract) */}
                            {contract?.tenantRecord && (
                              <Group gap="sm" align="flex-start" ml={apartment ? 'xl' : 0}>
                                <ThemeIcon variant="light" color="orange" size="lg">
                                  <IconUser size={18} />
                                </ThemeIcon>
                                <Stack gap={2} style={{ flex: 1 }}>
                                  <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
                                    {t('tenants.title')}
                                  </Text>
                                  <Anchor
                                    href={`/${currentLocale}/modules/real-estate/tenants/${contract.tenantRecord.id}`}
                                    fw={600}
                                    size="md"
                                  >
                                    {(contract.tenantRecord as any).tenantType === 'company' && (contract.tenantRecord as any).companyName
                                      ? (contract.tenantRecord as any).companyName
                                      : [contract.tenantRecord.firstName, contract.tenantRecord.lastName].filter(Boolean).join(' ') || tGlobal('common.noData')}
                                  </Anchor>
                                  {(contract.tenantRecord.email || contract.tenantRecord.phone) && (
                                    <Text size="sm" c="dimmed">
                                      {[contract.tenantRecord.email, contract.tenantRecord.phone].filter(Boolean).join(' • ')}
                                    </Text>
                                  )}
                                </Stack>
                              </Group>
                            )}

                            {/* Contract */}
                            {contract && (
                              <Group gap="sm" align="flex-start" ml={contract?.tenantRecord ? 'xl' : (apartment ? 'xl' : 0)}>
                                <ThemeIcon variant="light" color="violet" size="lg">
                                  <IconFileText size={18} />
                                </ThemeIcon>
                                <Stack gap={2} style={{ flex: 1 }}>
                                  <Text size="xs" c="dimmed" tt="uppercase" fw={500}>
                                    {t('contracts.title')}
                                  </Text>
                                  <Anchor
                                    href={`/${currentLocale}/modules/real-estate/contracts/${contract.id}`}
                                    fw={600}
                                    size="md"
                                  >
                                    {contract.contractNumber || tGlobal('common.noData')}
                                  </Anchor>
                                </Stack>
                              </Group>
                            )}
                          </Stack>
                        </Card>
                      </Stack>
                    )}
                  </Grid.Col>

                  {/* Right Column: Notes & System Info */}
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="md">
                      {/* Notes */}
                      {payment.notes && (
                        <Stack gap="xs">
                          <Text fw={600} size="lg">{t('payments.detail.notes')}</Text>
                          <Card withBorder p="md" radius="md" bg="var(--mantine-color-default-hover)">
                            <Text>{payment.notes}</Text>
                          </Card>
                        </Stack>
                      )}

                      {/* System Information */}
                      <Stack gap="xs">
                        <Text fw={600} size="lg">{t('payments.detail.systemInfo')}</Text>
                        <Card withBorder p="md" radius="md" bg="var(--mantine-color-default-hover)">
                          <Stack gap="sm">
                            <Group justify="space-between">
                              <Text size="sm" c="dimmed">{t('payments.detail.createdAt')}</Text>
                              <Text fw={500}>{dayjs(payment.createdAt).format('DD.MM.YYYY HH:mm')}</Text>
                            </Group>
                            <Group justify="space-between">
                              <Text size="sm" c="dimmed">{t('payments.detail.updatedAt')}</Text>
                              <Text fw={500}>{dayjs(payment.updatedAt).format('DD.MM.YYYY HH:mm')}</Text>
                            </Group>
                            {payment.reminderSent && (
                              <Badge color="blue" variant="light">
                                {t('payments.detail.reminderSent')}
                              </Badge>
                            )}
                          </Stack>
                        </Card>
                      </Stack>
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Stack>
            </Paper>
          );
        })()
      ) : null}
    </Container>
  );
}

