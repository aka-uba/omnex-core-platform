'use client';

import { Container, Stack, Paper, Text, Alert, Group, Badge, SimpleGrid, Card, Divider, Avatar, Box } from '@mantine/core';
import {
  IconBuilding,
  IconMail,
  IconPhone,
  IconWorld,
  IconMapPin,
  IconFileText,
  IconUsers,
  IconCalendar,
  IconEdit,
  IconArrowLeft,
} from '@tabler/icons-react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';
import { MyCompanyPageSkeleton } from '@/app/[locale]/settings/my-company/MyCompanyPageSkeleton';

interface CompanyData {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  status: string;
  logo: string | null;
  logoFile: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  taxNumber: string | null;
  taxOffice: string | null;
  registrationNumber: string | null;
  mersisNumber: string | null;
  iban: string | null;
  bankName: string | null;
  accountHolder: string | null;
  description: string | null;
  foundedYear: number | null;
  employeeCount: number | null;
  capital: string | null;
  createdAt: string;
  updatedAt: string;
  stats: {
    usersCount: number;
    assetsCount: number;
    contentsCount: number;
    websitesCount: number;
  };
}

export default function CompanyViewPage() {
  const params = useParams();
  const router = useRouter();
  const currentLocale = (params?.locale as string) || 'tr';
  const companyId = params?.id as string;
  const { t } = useTranslation('global');

  const { data: company, isLoading, error } = useQuery<CompanyData>({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const response = await fetchWithAuth(`/api/company?companyId=${companyId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch company');
      }
      const result = await response.json();
      return result.data;
    },
    enabled: !!companyId,
  });

  if (isLoading) {
    return <MyCompanyPageSkeleton />;
  }

  if (error || !company) {
    return (
      <Container size="xl" pt="xl">
        <Alert color="red" title={t('error')}>
          {error instanceof Error ? error.message : t('companies.loadError')}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={company.name}
        description={t('companies.viewDescription')}
        namespace="global"
        icon={<IconBuilding size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'navigation.superadmin', href: `/${currentLocale}/superadmin`, namespace: 'global' },
          { label: 'companies.title', href: `/${currentLocale}/management/companies`, namespace: 'global' },
          { label: company.name, namespace: 'global' },
        ]}
        actions={[
          {
            label: t('buttons.back'),
            icon: <IconArrowLeft size={18} />,
            onClick: () => router.push(`/${currentLocale}/management/companies`),
            variant: 'light',
          },
          {
            label: t('buttons.edit'),
            icon: <IconEdit size={18} />,
            onClick: () => router.push(`/${currentLocale}/management/companies/${companyId}/edit`),
            variant: 'filled',
          },
        ]}
      />

      {/* Statistics Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mt="xl">
        <Card withBorder padding="lg" radius="md">
          <Stack gap="xs">
            <Group gap="xs">
              <IconUsers size={20} color="var(--mantine-color-blue-6)" />
              <Text size="sm" c="dimmed">{t('companies.stats.users')}</Text>
            </Group>
            <Text size="xl" fw={700}>{company.stats.usersCount}</Text>
          </Stack>
        </Card>
        <Card withBorder padding="lg" radius="md">
          <Stack gap="xs">
            <Group gap="xs">
              <IconBuilding size={20} color="var(--mantine-color-green-6)" />
              <Text size="sm" c="dimmed">{t('companies.assets')}</Text>
            </Group>
            <Text size="xl" fw={700}>{company.stats.assetsCount}</Text>
          </Stack>
        </Card>
        <Card withBorder padding="lg" radius="md">
          <Stack gap="xs">
            <Group gap="xs">
              <IconFileText size={20} color="var(--mantine-color-violet-6)" />
              <Text size="sm" c="dimmed">{t('companies.contents')}</Text>
            </Group>
            <Text size="xl" fw={700}>{company.stats.contentsCount}</Text>
          </Stack>
        </Card>
        <Card withBorder padding="lg" radius="md">
          <Stack gap="xs">
            <Group gap="xs">
              <IconWorld size={20} color="var(--mantine-color-orange-6)" />
              <Text size="sm" c="dimmed">{t('companies.websites')}</Text>
            </Group>
            <Text size="xl" fw={700}>{company.stats.websitesCount}</Text>
          </Stack>
        </Card>
      </SimpleGrid>

      <Stack gap="md" mt="xl">
        {/* Basic Information */}
        <Paper p="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="lg" fw={600}>
                {t('companies.tabs.basic')}
              </Text>
              <Badge color={company.status === 'Active' || company.status === 'active' ? 'green' : 'gray'}>
                {company.status}
              </Badge>
            </Group>
            <Divider />
            <Group gap="md" align="flex-start">
              <Box>
                {company.logo ? (
                  <Avatar
                    src={company.logo}
                    alt={company.name}
                    size={100}
                    radius="md"
                    style={{
                      border: '1px solid var(--mantine-color-gray-3)',
                      backgroundColor: 'var(--mantine-color-gray-0)',
                    }}
                  />
                ) : (
                  <Avatar
                    size={100}
                    radius="md"
                    style={{
                      border: '1px solid var(--mantine-color-gray-3)',
                      backgroundColor: 'var(--mantine-color-gray-0)',
                    }}
                  >
                    <IconBuilding size={50} color="var(--mantine-color-gray-5)" />
                  </Avatar>
                )}
              </Box>
              <Stack gap="xs" style={{ flex: 1 }}>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <div>
                    <Text size="xs" c="dimmed" mb={4}>
                      {t('companies.name')}
                    </Text>
                    <Text size="sm" fw={500}>{company.name}</Text>
                  </div>
                  {company.industry && (
                    <div>
                      <Text size="xs" c="dimmed" mb={4}>
                        {t('companies.industry')}
                      </Text>
                      <Text size="sm" fw={500}>{company.industry}</Text>
                    </div>
                  )}
                  {company.foundedYear && (
                    <div>
                      <Text size="xs" c="dimmed" mb={4}>
                        {t('companies.foundedYear')}
                      </Text>
                      <Text size="sm" fw={500}>{company.foundedYear}</Text>
                    </div>
                  )}
                  {company.employeeCount && (
                    <div>
                      <Text size="xs" c="dimmed" mb={4}>
                        {t('companies.employeeCount')}
                      </Text>
                      <Text size="sm" fw={500}>{company.employeeCount}</Text>
                    </div>
                  )}
                  {company.capital && (
                    <div>
                      <Text size="xs" c="dimmed" mb={4}>
                        {t('companies.capital')}
                      </Text>
                      <Text size="sm" fw={500}>{company.capital}</Text>
                    </div>
                  )}
                </SimpleGrid>
                {company.description && (
                  <div>
                    <Text size="xs" c="dimmed" mb={4}>
                      {t('companies.description')}
                    </Text>
                    <Text size="sm">{company.description}</Text>
                  </div>
                )}
              </Stack>
            </Group>
          </Stack>
        </Paper>

        {/* Contact Information */}
        <Paper p="md" withBorder>
          <Stack gap="md">
            <Text size="lg" fw={600}>
              {t('companies.tabs.contact')}
            </Text>
            <Divider />
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {company.email && (
                <Group gap="xs">
                  <IconMail size={18} color="var(--mantine-color-gray-6)" />
                  <div>
                    <Text size="xs" c="dimmed">{t('companies.email')}</Text>
                    <Text size="sm" fw={500}>{company.email}</Text>
                  </div>
                </Group>
              )}
              {company.phone && (
                <Group gap="xs">
                  <IconPhone size={18} color="var(--mantine-color-gray-6)" />
                  <div>
                    <Text size="xs" c="dimmed">{t('companies.phone')}</Text>
                    <Text size="sm" fw={500}>{company.phone}</Text>
                  </div>
                </Group>
              )}
              {company.website && (
                <Group gap="xs">
                  <IconWorld size={18} color="var(--mantine-color-gray-6)" />
                  <div>
                    <Text size="xs" c="dimmed">{t('companies.website')}</Text>
                    <Text size="sm" fw={500} component="a" href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" c="blue">
                      {company.website}
                    </Text>
                  </div>
                </Group>
              )}
              {(company.address || company.city || company.country) && (
                <Group gap="xs" align="flex-start">
                  <IconMapPin size={18} color="var(--mantine-color-gray-6)" style={{ marginTop: 2 }} />
                  <div>
                    <Text size="xs" c="dimmed">{t('companies.address')}</Text>
                    <Text size="sm" fw={500}>
                      {[company.address, company.city, company.state, company.postalCode, company.country].filter(Boolean).join(', ')}
                    </Text>
                  </div>
                </Group>
              )}
            </SimpleGrid>
          </Stack>
        </Paper>

        {/* Legal Information */}
        {(company.taxNumber || company.taxOffice || company.registrationNumber || company.mersisNumber) && (
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Text size="lg" fw={600}>
                {t('companies.tabs.legal')}
              </Text>
              <Divider />
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {company.taxNumber && (
                  <div>
                    <Text size="xs" c="dimmed" mb={4}>
                      {t('companies.taxNumber')}
                    </Text>
                    <Text size="sm" fw={500}>{company.taxNumber}</Text>
                  </div>
                )}
                {company.taxOffice && (
                  <div>
                    <Text size="xs" c="dimmed" mb={4}>
                      {t('companies.taxOffice')}
                    </Text>
                    <Text size="sm" fw={500}>{company.taxOffice}</Text>
                  </div>
                )}
                {company.registrationNumber && (
                  <div>
                    <Text size="xs" c="dimmed" mb={4}>
                      {t('companies.registrationNumber')}
                    </Text>
                    <Text size="sm" fw={500}>{company.registrationNumber}</Text>
                  </div>
                )}
                {company.mersisNumber && (
                  <div>
                    <Text size="xs" c="dimmed" mb={4}>
                      {t('companies.mersisNumber')}
                    </Text>
                    <Text size="sm" fw={500}>{company.mersisNumber}</Text>
                  </div>
                )}
              </SimpleGrid>
            </Stack>
          </Paper>
        )}

        {/* Financial Information */}
        {(company.iban || company.bankName || company.accountHolder) && (
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Text size="lg" fw={600}>
                {t('companies.tabs.financial')}
              </Text>
              <Divider />
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {company.iban && (
                  <div>
                    <Text size="xs" c="dimmed" mb={4}>
                      {t('companies.iban')}
                    </Text>
                    <Text size="sm" fw={500}>{company.iban}</Text>
                  </div>
                )}
                {company.bankName && (
                  <div>
                    <Text size="xs" c="dimmed" mb={4}>
                      {t('companies.bankName')}
                    </Text>
                    <Text size="sm" fw={500}>{company.bankName}</Text>
                  </div>
                )}
                {company.accountHolder && (
                  <div>
                    <Text size="xs" c="dimmed" mb={4}>
                      {t('companies.accountHolder')}
                    </Text>
                    <Text size="sm" fw={500}>{company.accountHolder}</Text>
                  </div>
                )}
              </SimpleGrid>
            </Stack>
          </Paper>
        )}

        {/* Metadata */}
        <Paper p="md" withBorder>
          <Stack gap="md">
            <Text size="lg" fw={600}>
              {t('companies.metadata')}
            </Text>
            <Divider />
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Group gap="xs">
                <IconCalendar size={18} color="var(--mantine-color-gray-6)" />
                <div>
                  <Text size="xs" c="dimmed">{t('companies.createdAt')}</Text>
                  <Text size="sm" fw={500}>{new Date(company.createdAt).toLocaleDateString(currentLocale)}</Text>
                </div>
              </Group>
              <Group gap="xs">
                <IconCalendar size={18} color="var(--mantine-color-gray-6)" />
                <div>
                  <Text size="xs" c="dimmed">{t('companies.updatedAt')}</Text>
                  <Text size="sm" fw={500}>{new Date(company.updatedAt).toLocaleDateString(currentLocale)}</Text>
                </div>
              </Group>
            </SimpleGrid>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}







