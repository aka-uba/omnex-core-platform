'use client';

import { Container, Stack, Text, Alert, Badge, Group, Button, TextInput, Card, SimpleGrid, ActionIcon, Tooltip } from '@mantine/core';
import { IconBuilding, IconSearch, IconRefresh, IconPlus, IconEdit, IconTrash, IconEye, IconChevronDown, IconChevronRight, IconUsers, IconWorld, IconBriefcase } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { DataTable, DataTableColumn } from '@/components/tables/DataTable';
import { FilterOption } from '@/components/tables/FilterModal';
import { useState, useMemo } from 'react';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { CompanySettingsPageSkeleton } from './CompanySettingsPageSkeleton';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

interface Company {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  usersCount: number;
  assetsCount: number;
  contentsCount: number;
  websitesCount: number;
}

interface CurrentTenant {
  id: string;
  name: string;
  slug: string;
  subdomain: string | null;
  customDomain: string | null;
  status: string;
  dbName: string;
  createdAt: string;
}

interface CompaniesResponse {
  companies: Company[];
  total: number;
  currentTenant: CurrentTenant | null;
}

export default function CompanySettingsPage() {
  const params = useParams();
  const router = useRouter();
  const currentLocale = (params?.locale as string) || 'tr';
  const { t } = useTranslation('global');
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data, isLoading, error, refetch } = useQuery<CompaniesResponse>({
    queryKey: ['companies', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('pageSize', '1000'); // Get all for hierarchical view
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/companies?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }
      const result = await response.json();
      return result.data;
    },
  });

  // Build hierarchical structure
  const hierarchicalData = useMemo(() => {
    if (!data) return [];

    const result: Array<Company & { level: number; isMain: boolean }> = [];

    // Add current tenant as main company
    if (data.currentTenant) {
      result.push({
        id: data.currentTenant.id,
        name: data.currentTenant.name,
        industry: null,
        website: data.currentTenant.customDomain || data.currentTenant.subdomain || null,
        status: data.currentTenant.status,
        createdAt: data.currentTenant.createdAt,
        updatedAt: data.currentTenant.createdAt,
        usersCount: 0,
        assetsCount: 0,
        contentsCount: 0,
        websitesCount: 0,
        level: 0,
        isMain: true,
      });
    }

    // Add all companies as children (level 1)
    data.companies.forEach((company) => {
      result.push({
        ...company,
        level: 1,
        isMain: false,
      });
    });

    return result;
  }, [data]);

  const filteredData = useMemo(() => {
    if (!search) return hierarchicalData;
    const searchLower = search.toLowerCase();
    return hierarchicalData.filter((item) => 
      item.name.toLowerCase().includes(searchLower) ||
      item.industry?.toLowerCase().includes(searchLower) ||
      item.website?.toLowerCase().includes(searchLower)
    );
  }, [hierarchicalData, search]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: t('companies.table.status'),
      type: 'select',
      options: [
        { value: 'Active', label: t('companies.active') },
        { value: 'Inactive', label: t('companies.inactive') },
      ],
    },
  ];

  const columns: DataTableColumn[] = [
    {
      key: 'name',
      label: t('companies.table.name'),
      sortable: true,
      searchable: true,
      render: (value, row) => {
        const company = row as Company & { level: number; isMain: boolean };
        const indent = company.level * 24;
        const isExpanded = expandedRows.has(company.id);
        const hasChildren = company.level === 0 && (data?.companies?.length ?? 0) > 0;

        return (
          <Group gap="xs" style={{ paddingLeft: `${indent}px` }}>
            {hasChildren && (
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRow(company.id);
                }}
              >
                {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
              </ActionIcon>
            )}
            {!hasChildren && <div style={{ width: 24 }} />}
            <IconBuilding size={18} color={company.isMain ? 'var(--mantine-color-violet-6)' : 'var(--mantine-color-blue-6)'} />
            <Text fw={company.isMain ? 700 : 500} size="sm">
              {value}
            </Text>
            {company.isMain && (
              <Badge color="violet" variant="light" size="sm">
                {t('companies.main')}
              </Badge>
            )}
          </Group>
        );
      },
    },
    {
      key: 'industry',
      label: t('companies.table.industry'),
      sortable: true,
      searchable: true,
      render: (value) => (
        <Text size="sm">{value || '-'}</Text>
      ),
    },
    {
      key: 'website',
      label: t('companies.table.website'),
      sortable: true,
      searchable: true,
      render: (value) => {
        if (!value) return <Text size="sm" c="dimmed">-</Text>;
        return (
          <Group gap="xs">
            <IconWorld size={14} />
            <Text size="sm" component="a" href={value.startsWith('http') ? value : `https://${value}`} target="_blank" c="blue">
              {value}
            </Text>
          </Group>
        );
      },
    },
    {
      key: 'status',
      label: t('companies.table.status'),
      sortable: true,
      render: (value) => {
        const color = value === 'Active' || value === 'active' ? 'green' : 'gray';
        return (
          <Badge color={color} variant="light">
            {value}
          </Badge>
        );
      },
    },
    {
      key: 'usersCount',
      label: t('companies.table.users'),
      sortable: true,
      render: (value, row) => {
        const company = row as Company & { level: number; isMain: boolean };
        if (company.isMain) return <Text size="sm" c="dimmed">-</Text>;
        return (
          <Group gap={4}>
            <IconUsers size={14} />
            <Text size="sm">{value}</Text>
          </Group>
        );
      },
    },
    {
      key: 'stats',
      label: t('companies.table.stats'),
      render: (value, row) => {
        const company = row as Company & { level: number; isMain: boolean };
        if (company.isMain) return <Text size="sm" c="dimmed">-</Text>;
        return (
          <Group gap="xs">
            {company.assetsCount > 0 && (
              <Tooltip label={t('companies.assets')}>
                <Badge variant="light" size="sm">{company.assetsCount}</Badge>
              </Tooltip>
            )}
            {company.contentsCount > 0 && (
              <Tooltip label={t('companies.contents')}>
                <Badge variant="light" size="sm">{company.contentsCount}</Badge>
              </Tooltip>
            )}
            {company.websitesCount > 0 && (
              <Tooltip label={t('companies.websites')}>
                <Badge variant="light" size="sm">{company.websitesCount}</Badge>
              </Tooltip>
            )}
          </Group>
        );
      },
    },
    {
      key: 'createdAt',
      label: t('companies.table.createdAt'),
      sortable: true,
      render: (value) => (
        <Text size="sm">{new Date(value as string).toLocaleDateString(currentLocale)}</Text>
      ),
    },
    {
      key: 'actions',
      label: t('companies.table.actions'),
      sortable: false,
      render: (value, row) => {
        const company = row as Company & { level: number; isMain: boolean };
        if (company.isMain) return <Text size="sm" c="dimmed">-</Text>;
        return (
          <Group gap="xs">
            <Tooltip label={t('buttons.view')}>
              <ActionIcon variant="subtle" onClick={() => {
                showToast({
                  type: 'info',
                  title: t('companies.viewing'),
                  message: `${company.name} - ${t('companies.comingSoon')}`,
                });
              }}>
                <IconEye size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t('buttons.edit')}>
              <ActionIcon variant="subtle" color="blue" onClick={() => {
                showToast({
                  type: 'info',
                  title: t('companies.editing'),
                  message: `${company.name} - ${t('companies.comingSoon')}`,
                });
              }}>
                <IconEdit size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t('buttons.delete')}>
              <ActionIcon variant="subtle" color="red" onClick={async () => {
                const confirmed = await confirm({
                  title: t('common.confirm'),
                  message: t('companies.confirmDelete'),
                  confirmLabel: t('common.delete'),
                  confirmColor: 'red',
                });
                if (confirmed) {
                  showToast({
                    type: 'warning',
                    title: t('companies.deleting'),
                    message: `${company.name} - ${t('companies.comingSoon')}`,
                  });
                }
              }}>
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        );
      },
    },
  ];

  const stats = useMemo(() => {
    if (!data) return { total: 0, active: 0, users: 0, totalStats: 0 };
    
    const active = data.companies.filter(c => c.status === 'Active' || c.status === 'active').length;
    const users = data.companies.reduce((sum, c) => sum + c.usersCount, 0);
    const totalStats = data.companies.reduce((sum, c) => sum + c.assetsCount + c.contentsCount + c.websitesCount, 0);
    
    return {
      total: data.companies?.length ?? 0,
      active,
      users,
      totalStats,
    };
  }, [data]);

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('companies.title')}
        description={t('companies.description')}
        namespace="global"
        icon={<IconBuilding size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'navigation.settings', href: `/${currentLocale}/settings`, namespace: 'global' },
          { label: 'companies.title', namespace: 'global' },
        ]}
        actions={[
          {
            label: t('companies.create'),
            icon: <IconPlus size={18} />,
            onClick: () => router.push(`/${currentLocale}/settings/add-company`),
            variant: 'filled',
          },
        ]}
      />

      {/* Statistics Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mt="xl">
        <Card withBorder padding="lg" radius="md">
          <Stack gap="xs">
            <Group gap="xs">
              <IconBuilding size={20} color="var(--mantine-color-blue-6)" />
              <Text size="sm" c="dimmed">{t('companies.stats.total')}</Text>
            </Group>
            <Text size="xl" fw={700}>{stats.total}</Text>
          </Stack>
        </Card>
        <Card withBorder padding="lg" radius="md">
          <Stack gap="xs">
            <Group gap="xs">
              <IconBriefcase size={20} color="var(--mantine-color-green-6)" />
              <Text size="sm" c="dimmed">{t('companies.stats.active')}</Text>
            </Group>
            <Text size="xl" fw={700}>{stats.active}</Text>
          </Stack>
        </Card>
        <Card withBorder padding="lg" radius="md">
          <Stack gap="xs">
            <Group gap="xs">
              <IconUsers size={20} color="var(--mantine-color-violet-6)" />
              <Text size="sm" c="dimmed">{t('companies.stats.users')}</Text>
            </Group>
            <Text size="xl" fw={700}>{stats.users}</Text>
          </Stack>
        </Card>
        <Card withBorder padding="lg" radius="md">
          <Stack gap="xs">
            <Group gap="xs">
              <IconWorld size={20} color="var(--mantine-color-orange-6)" />
              <Text size="sm" c="dimmed">{t('companies.stats.totalStats')}</Text>
            </Group>
            <Text size="xl" fw={700}>{stats.totalStats}</Text>
          </Stack>
        </Card>
      </SimpleGrid>

      <Stack gap="md" mt="xl">
        <Group>
          <TextInput
            placeholder={t('companies.search')}
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Button
            leftSection={<IconRefresh size={16} />}
            onClick={() => refetch()}
            variant="light"
          >
            {t('buttons.refresh')}
          </Button>
        </Group>

        {isLoading ? (
          <CompanySettingsPageSkeleton />
        ) : error ? (
          <Alert color="red" title={t('common.error')}>
            {error instanceof Error ? error.message : t('companies.loadError')}
          </Alert>
        ) : (
          <DataTable
            data={filteredData}
            columns={columns}
            searchable={true}
            sortable={true}
            pageable={true}
            defaultPageSize={25}
            pageSizeOptions={[10, 25, 50, 100]}
            emptyMessage={t('companies.noCompanies')}
            filters={filterOptions}
            onFilter={(filters) => {
              if (filters.status) setStatusFilter(filters.status);
              else setStatusFilter(null);
            }}
            showExportIcons={true}
            onExport={(format) => {
              // Export functionality
              showToast({
                type: 'info',
                title: t('actions.export'),
                message: t('exportComingSoon', { format: format.toUpperCase() }),
              });
            }}
          />
        )}
      </Stack>
      <ConfirmDialog />
    </Container>
  );
}

