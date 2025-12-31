'use client';

import { Container, Stack, Text, Loader, Alert, Badge, Group, Button, TextInput, Card, SimpleGrid } from '@mantine/core';
import { IconDatabase, IconSearch, IconRefresh, IconServer, IconCheck } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { DataTable, DataTableColumn } from '@/components/tables/DataTable';
import { FilterOption } from '@/components/tables/FilterModal';
import { useState, useMemo } from 'react';
import { showToast } from '@/modules/notifications/components/ToastNotification';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  dbName: string;
  currentDb: string;
  allDatabases: string[];
  status: string;
}

interface TenantsResponse {
  tenants: Tenant[];
  total: number;
  page: number;
  pageSize: number;
}

interface DatabaseInfo {
  name: string;
  type: 'core' | 'tenant';
  tenantName?: string;
  tenantSlug?: string;
  tenantId?: string;
  isCurrent?: boolean;
  year?: number;
}

export default function DatabaseManagementPage() {
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'tr';
  const { t } = useTranslation('global');
  const [search, setSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<TenantsResponse>({
    queryKey: ['tenants-all'],
    queryFn: async () => {
      // Get all tenants without pagination
      const response = await fetch('/api/tenants?page=1&pageSize=1000');
      if (!response.ok) {
        throw new Error('Failed to fetch tenants');
      }
      const result = await response.json();
      return result.data;
    },
  });

  // Extract all databases from tenants and add core database
  const databases = useMemo<DatabaseInfo[]>(() => {
    const dbMap = new Map<string, DatabaseInfo>();
    
    // Add core database
    dbMap.set('omnex_core', {
      name: 'omnex_core',
      type: 'core',
    });

    // Add all tenant databases
    data?.tenants.forEach((tenant) => {
      tenant.allDatabases?.forEach((dbName) => {
        if (!dbMap.has(dbName)) {
          const yearMatch = dbName.match(/_(\d{4})$/);
          dbMap.set(dbName, {
            name: dbName,
            type: 'tenant',
            tenantName: tenant.name,
            tenantSlug: tenant.slug,
            tenantId: tenant.id,
            isCurrent: dbName === tenant.currentDb,
            ...(yearMatch && yearMatch[1] ? { year: parseInt(yearMatch[1]) } : {}),
          });
        }
      });
    });

    return Array.from(dbMap.values()).sort((a, b) => {
      // Core database first
      if (a.type === 'core') return -1;
      if (b.type === 'core') return 1;
      
      // Then by tenant name
      if (a.tenantName && b.tenantName) {
        const nameCompare = a.tenantName.localeCompare(b.tenantName);
        if (nameCompare !== 0) return nameCompare;
      }
      
      // Then by year (descending)
      if (a.year && b.year) {
        return b.year - a.year;
      }
      
      // Finally by name
      return a.name.localeCompare(b.name);
    });
  }, [data]);

  const filteredDatabases = useMemo(() => {
    if (!search) return databases;
    const searchLower = search.toLowerCase();
    return databases.filter((db) => 
      db.name.toLowerCase().includes(searchLower) ||
      db.tenantName?.toLowerCase().includes(searchLower) ||
      db.tenantSlug?.toLowerCase().includes(searchLower) ||
      db.year?.toString().includes(searchLower)
    );
  }, [databases, search]);

  const filterOptions: FilterOption[] = [
    {
      key: 'type',
      label: t('databases.table.type'),
      type: 'select',
      options: [
        { value: 'core', label: t('databases.core') },
        { value: 'tenant', label: t('databases.tenant') },
      ],
    },
  ];

  const columns: DataTableColumn[] = [
    {
      key: 'name',
      label: t('databases.table.name'),
      sortable: true,
      searchable: true,
      render: (value, row) => {
        const db = row as DatabaseInfo;
        return (
          <Group gap="xs">
            <IconDatabase size={16} />
            <Text fw={500} size="sm">{value}</Text>
            {db.type === 'core' && (
              <Badge color="violet" variant="light" size="sm">
                {t('databases.core')}
              </Badge>
            )}
          </Group>
        );
      },
    },
    {
      key: 'type',
      label: t('databases.table.type'),
      sortable: true,
      render: (value) => {
        const typeLabels = {
          core: t('databases.core'),
          tenant: t('databases.tenant'),
        };
        const typeColors = {
          core: 'violet',
          tenant: 'blue',
        };
        return (
          <Badge color={typeColors[value as keyof typeof typeColors]} variant="light">
            {typeLabels[value as keyof typeof typeLabels]}
          </Badge>
        );
      },
    },
    {
      key: 'tenantName',
      label: t('databases.table.tenant'),
      sortable: true,
      searchable: true,
      render: (value, row) => {
        const db = row as DatabaseInfo;
        if (db.type === 'core') {
          return <Text size="sm" c="dimmed">-</Text>;
        }
        return (
          <Group gap="xs">
            <Text size="sm">{value || '-'}</Text>
            {db.isCurrent && (
              <Badge color="green" variant="light" size="xs">
                {t('databases.current')}
              </Badge>
            )}
          </Group>
        );
      },
    },
    {
      key: 'year',
      label: t('databases.table.year'),
      sortable: true,
      render: (value) => (
        <Text size="sm">{value ? value.toString() : '-'}</Text>
      ),
    },
    {
      key: 'status',
      label: t('databases.table.status'),
      render: (value, row) => {
        const db = row as DatabaseInfo;
        if (db.type === 'core') {
          return (
            <Badge color="green" variant="light">
              {t('databases.active')}
            </Badge>
          );
        }
        return (
          <Badge color={db.isCurrent ? 'green' : 'gray'} variant="light">
            {db.isCurrent 
              ? t('databases.current')
              : t('databases.inactive')
            }
          </Badge>
        );
      },
    },
  ];

  const stats = useMemo(() => {
    const coreCount = databases.filter(db => db.type === 'core').length;
    const tenantCount = databases.filter(db => db.type === 'tenant').length;
    const activeCount = databases.filter(db => db.isCurrent || db.type === 'core').length;
    
    return {
      total: databases.length,
      core: coreCount,
      tenant: tenantCount,
      active: activeCount,
    };
  }, [databases]);

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('databases.title')}
        description={t('databases.description')}
        namespace="global"
        icon={<IconDatabase size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'tenants.title', href: `/${currentLocale}/admin/tenants`, namespace: 'global' },
          { label: 'databases.title', namespace: 'global' },
        ]}
      />

      {/* Statistics Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mt="xl">
        <Card withBorder padding="lg" radius="md">
          <Stack gap="xs">
            <Text size="sm" c="dimmed">{t('databases.stats.total')}</Text>
            <Text size="xl" fw={700}>{stats.total}</Text>
          </Stack>
        </Card>
        <Card withBorder padding="lg" radius="md">
          <Stack gap="xs">
            <Group gap="xs">
              <IconServer size={20} color="var(--mantine-color-violet-6)" />
              <Text size="sm" c="dimmed">{t('databases.stats.core')}</Text>
            </Group>
            <Text size="xl" fw={700}>{stats.core}</Text>
          </Stack>
        </Card>
        <Card withBorder padding="lg" radius="md">
          <Stack gap="xs">
            <Group gap="xs">
              <IconDatabase size={20} color="var(--mantine-color-blue-6)" />
              <Text size="sm" c="dimmed">{t('databases.stats.tenant')}</Text>
            </Group>
            <Text size="xl" fw={700}>{stats.tenant}</Text>
          </Stack>
        </Card>
        <Card withBorder padding="lg" radius="md">
          <Stack gap="xs">
            <Group gap="xs">
              <IconCheck size={20} color="var(--mantine-color-green-6)" />
              <Text size="sm" c="dimmed">{t('databases.stats.active')}</Text>
            </Group>
            <Text size="xl" fw={700}>{stats.active}</Text>
          </Stack>
        </Card>
      </SimpleGrid>

      <Stack gap="md" mt="xl">
        <Group>
          <TextInput
            placeholder={t('databases.search')}
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Button
            leftSection={<IconRefresh size={16} style={isRefreshing ? { animation: 'spin 1s linear infinite' } : undefined} />}
            onClick={async () => {
              setIsRefreshing(true);
              await refetch();
              setIsRefreshing(false);
            }}
            variant="light"
            loading={isRefreshing}
          >
            {t('buttons.refresh')}
          </Button>
        </Group>

        {isLoading ? (
          <Loader />
        ) : error ? (
          <Alert color="red" title={t('common.error')}>
            {error instanceof Error ? error.message : t('databases.loadError')}
          </Alert>
        ) : (
          <DataTable
            data={filteredDatabases}
            columns={columns}
            searchable={true}
            sortable={true}
            pageable={true}
            defaultPageSize={25}
            pageSizeOptions={[10, 25, 50, 100]}
            emptyMessage={t('databases.noDatabases')}
            filters={filterOptions}
            onFilter={(filters) => {
              // Filter logic can be added here if needed
            }}
            showExportIcons={true}
            onExport={(format) => {
              // Export functionality
              showToast({
                type: 'info',
                title: t('export'),
                message: `${format.toUpperCase()} formatında dışa aktarma yakında eklenecek`,
              });
            }}
          />
        )}
      </Stack>
    </Container>
  );
}

