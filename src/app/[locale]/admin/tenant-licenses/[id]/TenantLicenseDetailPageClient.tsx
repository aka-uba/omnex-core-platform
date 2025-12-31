'use client';

import { Container, Paper, Group, Text, Badge, Stack, Grid } from '@mantine/core';
import { IconUsers, IconEdit } from '@tabler/icons-react';
import { useTenantLicense } from '@/hooks/useTenantLicenses';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import dayjs from 'dayjs';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { LicensePaymentHistory } from '@/modules/license/components/LicensePaymentHistory';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';

interface TenantLicenseDetailPageClientProps {
  locale: string;
  licenseId: string;
}

export function TenantLicenseDetailPageClient({ locale, licenseId }: TenantLicenseDetailPageClientProps) {
  const params = useParams();
  const router = useRouter();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/license');
  const { t: tGlobal } = useTranslation('global');
  const { data: license, isLoading } = useTenantLicense(licenseId);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (!license) {
    return (
      <Container size="xl" pt="xl">
        <Text c="red">{t('tenantLicenses.notFound')}</Text>
      </Container>
    );
  }

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={license.package?.name || license.id}
        description={license.tenant?.name || license.tenantId}
        namespace="modules/license"
        icon={<IconUsers size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'tenantLicenses.title', href: `/${currentLocale}/modules/license/tenants`, namespace: 'modules/license' },
          { label: license.package?.name || license.id },
        ]}
        actions={[
          {
            label: tGlobal('common.edit'),
            icon: <IconEdit size={18} />,
            onClick: () => {
              router.push(`/${currentLocale}/modules/license/tenants/${licenseId}/edit`);
            },
            variant: 'filled',
            color: 'blue',
          },
        ]}
      />
      <Paper p="xl">
        <Stack gap="md">
          <Group justify="space-between">
            <Group gap="xs">
              <IconUsers size={32} />
              <Text size="xl" fw={700}>
                {license.package?.name || '-'}
              </Text>
            </Group>
            <Group gap="xs">
              <Badge
                color={
                  license.status === 'active'
                    ? 'green'
                    : license.status === 'expired'
                    ? 'red'
                    : license.status === 'suspended'
                    ? 'orange'
                    : 'gray'
                }
                size="lg"
              >
                {t(`tenantLicenses.status.${license.status}`) || license.status}
              </Badge>
              <Badge
                color={
                  license.paymentStatus === 'paid'
                    ? 'green'
                    : license.paymentStatus === 'pending'
                    ? 'yellow'
                    : 'red'
                }
                size="lg"
              >
                {t(`tenantLicenses.paymentStatus.${license.paymentStatus}`) || license.paymentStatus}
              </Badge>
            </Group>
          </Group>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  {t('tenantLicenses.table.tenant')}
                </Text>
                <Text fw={500}>{license.tenant?.name || license.tenantId}</Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  {t('tenantLicenses.table.package')}
                </Text>
                <Text fw={500}>{license.package?.name || '-'}</Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  {t('tenantLicenses.table.startDate')}
                </Text>
                <Text>{dayjs(license.startDate).format('DD/MM/YYYY')}</Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  {t('tenantLicenses.table.endDate')}
                </Text>
                <Text>{dayjs(license.endDate).format('DD/MM/YYYY')}</Text>
              </Stack>
            </Grid.Col>
            {license.renewalDate && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">
                    {t('tenantLicenses.form.renewalDate')}
                  </Text>
                  <Text>{dayjs(license.renewalDate).format('DD/MM/YYYY')}</Text>
                </Stack>
              </Grid.Col>
            )}
            {license.notes && (
              <Grid.Col span={12}>
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">
                    {t('tenantLicenses.form.notes')}
                  </Text>
                  <Text>{license.notes}</Text>
                </Stack>
              </Grid.Col>
            )}
          </Grid>
        </Stack>
      </Paper>

      {license.payments && license.payments.length > 0 && (
        <Paper p="xl">
          <Stack gap="md">
            <Text size="lg" fw={600}>
              {t('myLicense.paymentHistory')}
            </Text>
            <LicensePaymentHistory locale={currentLocale} licenseId={licenseId} />
          </Stack>
        </Paper>
      )}
    </Container>
  );
}


