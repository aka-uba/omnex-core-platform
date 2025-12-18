'use client';

import { Container, Paper, Group, Text, Badge, Stack, Grid } from '@mantine/core';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';
import { IconFileText, IconEdit } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useInvoice } from '@/hooks/useInvoices';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import dayjs from 'dayjs';

export function InvoiceDetailPageClient({ locale, invoiceId }: { locale: string; invoiceId: string }) {
  const params = useParams();
  const router = useRouter();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/accounting');
  const { data: invoice, isLoading } = useInvoice(invoiceId);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (!invoice) {
    return (
      <Container size="xl" pt="xl">
        <Text c="red">{t('common.notFound')}</Text>
      </Container>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: 'gray',
      sent: 'blue',
      paid: 'green',
      overdue: 'red',
      cancelled: 'gray',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`invoices.status.${status}`)}
      </Badge>
    );
  };

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={invoice.invoiceNumber}
        description={invoice.subscription?.name || t('invoices.title')}
        namespace="modules/accounting"
        icon={<IconFileText size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/accounting`, namespace: 'modules/accounting' },
          { label: 'invoices.title', href: `/${currentLocale}/modules/accounting/invoices`, namespace: 'modules/accounting' },
          { label: invoice.invoiceNumber, namespace: 'modules/accounting' },
        ]}
        actions={[
          {
            label: t('form.edit'),
            icon: <IconEdit size={18} />,
            onClick: () => {
              router.push(`/${currentLocale}/modules/accounting/invoices/${invoiceId}/edit`);
            },
            variant: 'light',
          },
        ]}
      />
      <Paper shadow="xs" p="md" mt="md">
        <Stack gap="md">
          <Group>
            <Text fw={500} size="lg">{invoice.invoiceNumber}</Text>
            {getStatusBadge(invoice.status)}
            <Badge color={invoice.isActive ? 'green' : 'gray'}>
              {invoice.isActive ? t('status.active') : t('status.inactive')}
            </Badge>
          </Group>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('invoices.form.invoiceDate')}</Text>
              <Text fw={500}>{dayjs(invoice.invoiceDate).format('DD.MM.YYYY')}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('invoices.form.dueDate')}</Text>
              <Text fw={500}>{dayjs(invoice.dueDate).format('DD.MM.YYYY')}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('invoices.form.subtotal')}</Text>
              <Text fw={500}>
                {Number(invoice.subtotal).toLocaleString('tr-TR', {
                  style: 'currency',
                  currency: invoice.currency || 'TRY',
                })}
              </Text>
            </Grid.Col>
            {invoice.taxAmount && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Text size="sm" c="dimmed">{t('invoices.form.taxAmount')}</Text>
                <Text fw={500}>
                  {Number(invoice.taxAmount).toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: invoice.currency || 'TRY',
                  })}
                </Text>
              </Grid.Col>
            )}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('invoices.form.totalAmount')}</Text>
              <Text fw={500} size="lg">
                {Number(invoice.totalAmount).toLocaleString('tr-TR', {
                  style: 'currency',
                  currency: invoice.currency || 'TRY',
                })}
              </Text>
            </Grid.Col>
            {invoice.description && (
              <Grid.Col span={{ base: 12 }}>
                <Text size="sm" c="dimmed">{t('invoices.form.description')}</Text>
                <Text>{invoice.description}</Text>
              </Grid.Col>
            )}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('form.createdAt')}</Text>
              <Text fw={500}>{dayjs(invoice.createdAt).format('DD.MM.YYYY HH:mm')}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text size="sm" c="dimmed">{t('form.updatedAt')}</Text>
              <Text fw={500}>{dayjs(invoice.updatedAt).format('DD.MM.YYYY HH:mm')}</Text>
            </Grid.Col>
          </Grid>
        </Stack>
      </Paper>
    </Container>
  );
}








