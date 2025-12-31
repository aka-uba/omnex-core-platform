'use client';

import { Container, Paper, Group, Text, Badge, Stack, Grid } from '@mantine/core';
import { IconPackage, IconEdit } from '@tabler/icons-react';
import { useLicensePackage } from '@/hooks/useLicensePackages';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';

interface LicensePackageDetailPageClientProps {
  locale: string;
  packageId: string;
}

export function LicensePackageDetailPageClient({ locale, packageId }: LicensePackageDetailPageClientProps) {
  const params = useParams();
  const router = useRouter();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/license');
  const { t: tGlobal } = useTranslation('global');
  const { data: pkg, isLoading } = useLicensePackage(packageId);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (!pkg) {
    return (
      <Container size="xl" pt="xl">
        <Text c="red">{t('packages.notFound')}</Text>
      </Container>
    );
  }

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={pkg.name}
        description={pkg.description || ''}
        namespace="modules/license"
        icon={<IconPackage size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'packages.title', href: `/${currentLocale}/modules/license/packages`, namespace: 'modules/license' },
          { label: pkg.name },
        ]}
        actions={[
          {
            label: tGlobal('common.edit'),
            icon: <IconEdit size={18} />,
            onClick: () => {
              router.push(`/${currentLocale}/modules/license/packages/${packageId}/edit`);
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
              <IconPackage size={32} />
              <Text size="xl" fw={700}>
                {pkg.name}
              </Text>
            </Group>
            <Badge color={pkg.isActive ? 'green' : 'red'} size="lg">
              {pkg.isActive ? (tGlobal('common.active')) : (tGlobal('common.inactive'))}
            </Badge>
          </Group>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  {t('packages.table.description')}
                </Text>
                <Text>{pkg.description || '-'}</Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  {t('packages.table.basePrice')}
                </Text>
                <Text fw={500}>
                  {pkg.basePrice.toLocaleString()} {pkg.currency}
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  {t('packages.table.billingCycle')}
                </Text>
                <Badge variant="light">
                  {t(`packages.billingCycles.${pkg.billingCycle}`) || pkg.billingCycle}
                </Badge>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  {t('packages.table.maxUsers')}
                </Text>
                <Text>{pkg.maxUsers || '-'}</Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  {t('packages.table.maxStorage')}
                </Text>
                <Text>{pkg.maxStorage || '-'}</Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={12}>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  {t('packages.table.modules')}
                </Text>
                <Group gap="xs">
                  {pkg.modules.map((module: string) => (
                    <Badge key={module} variant="light">
                      {module}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            </Grid.Col>
          </Grid>
        </Stack>
      </Paper>
    </Container>
  );
}

