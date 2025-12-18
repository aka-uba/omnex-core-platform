'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  TextInput,
  Table,
  Badge,
  ActionIcon,
  Group,
  Text,
  Pagination,
  Select,
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconMapPin,
  IconEye,
} from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useLocations, useDeleteLocation } from '@/hooks/useLocations';
import { useTranslation } from '@/lib/i18n/client';
import { LocationsPageSkeleton } from './LocationsPageSkeleton';
import type { LocationType } from '@/lib/schemas/location';

export function LocationsPageClient({ locale }: { locale: string }) {
  const router = useRouter();
  const { t } = useTranslation('modules/locations');
  const { t: tGlobal } = useTranslation('global');
  const [page, setPage] = useState(1);
  const [pageSize] = useState<number>(10);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<LocationType | undefined>();
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>();

  const { data, isLoading, error } = useLocations({
    page,
    pageSize,
    search: search || undefined,
    type: typeFilter,
    isActive: isActiveFilter,
  });

  const deleteLocation = useDeleteLocation();

  const handleDelete = async (id: string) => {
    if (window.confirm(t('delete.confirm'))) {
      try {
        await deleteLocation.mutateAsync(id);
      } catch (error) {
        // Error handling is done by the mutation
      }
    }
  };

  if (isLoading) {
    return <LocationsPageSkeleton />;
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Text c="red">{tGlobal('common.errorLoading')}</Text>
      </Container>
    );
  }

  const getTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      firma: 'blue',
      lokasyon: 'green',
      isletme: 'orange',
      koridor: 'purple',
      oda: 'pink',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`types.${type}`) || type}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge color="green">{t('status.active')}</Badge>
    ) : (
      <Badge color="gray">{t('status.inactive')}</Badge>
    );
  };

  return (
    <Container size="xl" py="xl">
      <CentralPageHeader
        title="title"
        description="description"
        namespace="modules/locations"
        icon={<IconMapPin size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'title', namespace: 'modules/locations' },
        ]}
        actions={[
          {
            label: t('create.button'),
            icon: <IconPlus size={18} />,
            onClick: () => router.push(`/${locale}/locations/create`),
            variant: 'filled',
          },
        ]}
      />

      <Paper shadow="sm" p="md" radius="md">
        {/* Toolbar */}
        <Group justify="space-between" mb="md">
          <TextInput
            placeholder={t('table.searchPlaceholder')}
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1, maxWidth: 400 }}
          />
          <Group gap="xs">
            <Select
              placeholder={t('table.filterType')}
              data={[
                { value: 'firma', label: t('types.firma') },
                { value: 'lokasyon', label: t('types.lokasyon') },
                { value: 'isletme', label: t('types.isletme') },
                { value: 'koridor', label: t('types.koridor') },
                { value: 'oda', label: t('types.oda') },
              ]}
              value={typeFilter}
              onChange={(value) => setTypeFilter(value as LocationType | undefined)}
              clearable
              style={{ width: 150 }}
            />
            <Select
              placeholder={t('table.filterStatus')}
              data={[
                { value: 'true', label: t('status.active') },
                { value: 'false', label: t('status.inactive') },
              ]}
              value={isActiveFilter?.toString()}
              onChange={(value) =>
                setIsActiveFilter(value ? value === 'true' : undefined)
              }
              clearable
              style={{ width: 150 }}
            />
          </Group>
        </Group>

        {/* Table */}
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('table.name')}</Table.Th>
              <Table.Th>{t('table.type')}</Table.Th>
              <Table.Th>{t('table.code')}</Table.Th>
              <Table.Th>{t('table.parent')}</Table.Th>
              <Table.Th>{t('table.equipment')}</Table.Th>
              <Table.Th>{t('table.status')}</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>{t('table.actions')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data?.locations && data.locations.length > 0 ? (
              data.locations.map((location) => (
                <Table.Tr key={location.id}>
                  <Table.Td>
                    <Text fw={500}>{location.name}</Text>
                    {location.description && (
                      <Text size="xs" c="dimmed">
                        {location.description}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>{getTypeBadge(location.type)}</Table.Td>
                  <Table.Td>{location.code || '-'}</Table.Td>
                  <Table.Td>
                    {location.parent ? (
                      <Text size="sm">{location.parent.name}</Text>
                    ) : (
                      <Text size="sm" c="dimmed">
                        {t('table.root')}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color="blue">
                      {location._count?.equipment || 0}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{getStatusBadge(location.isActive)}</Table.Td>
                  <Table.Td>
                    <Group gap="xs" justify="flex-end">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => router.push(`/${locale}/locations/${location.id}`)}
                      >
                        <IconEye size={18} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        onClick={() => router.push(`/${locale}/locations/${location.id}/edit`)}
                      >
                        <IconEdit size={18} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(location.id)}
                        loading={deleteLocation.isPending}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={7} style={{ textAlign: 'center' }}>
                  <Text c="dimmed" py="xl">
                    {t('table.noData')}
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>

        {/* Pagination */}
        {data && data.total > 0 && (
          <Group justify="space-between" mt="md">
            <Text size="sm" c="dimmed">
              {t('table.showing')
                .replace('{{from}}', String((page - 1) * pageSize + 1))
                .replace('{{to}}', String(Math.min(page * pageSize, data.total)))
                .replace('{{total}}', String(data.total))}
            </Text>
            <Pagination
              value={page}
              onChange={setPage}
              total={Math.ceil(data.total / pageSize)}
            />
          </Group>
        )}
      </Paper>
    </Container>
  );
}

