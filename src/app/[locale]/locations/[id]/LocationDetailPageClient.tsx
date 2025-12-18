'use client';

import { useRouter, useParams } from 'next/navigation';
import {
  Container,
  Paper,
  Title,
  Text,
  Group,
  Badge,
  Stack,
  Grid,
  Divider,
  ActionIcon,
  Table,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconEdit,
  IconTrash,
  IconMapPin,
  IconBuilding,
  IconLocation,
} from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useLocation, useDeleteLocation } from '@/hooks/useLocations';
import { useTranslation } from '@/lib/i18n/client';
import { notifications } from '@mantine/notifications';

export function LocationDetailPageClient({ locale }: { locale: string }) {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { t } = useTranslation('modules/locations');
  const { t: tGlobal } = useTranslation('global');

  const { data, isLoading, error } = useLocation(id);
  const deleteLocation = useDeleteLocation();

  const handleDelete = async () => {
    if (window.confirm(t('delete.confirm'))) {
      try {
        await deleteLocation.mutateAsync(id);
        notifications.show({
          title: t('delete.success'),
          message: t('delete.success'),
          color: 'green',
        });
        router.push(`/${locale}/locations`);
      } catch (error) {
        notifications.show({
          title: t('delete.error'),
          message: error instanceof Error ? error.message : t('delete.error'),
          color: 'red',
        });
      }
    }
  };

  if (isLoading) {
    return (
      <Container size="xl" py="xl">
        <Text>Loading...</Text>
      </Container>
    );
  }

  if (error || !data?.location) {
    return (
      <Container size="xl" py="xl">
        <Text c="red">{tGlobal('common.errorLoading')}</Text>
      </Container>
    );
  }

  const location = data.location;

  const getTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      firma: 'blue',
      lokasyon: 'green',
      isletme: 'orange',
      koridor: 'purple',
      oda: 'pink',
    };
    return (
      <Badge color={typeColors[type] || 'gray'} size="lg">
        {t(`types.${type}`) || type}
      </Badge>
    );
  };

  return (
    <Container size="xl" py="xl">
      <CentralPageHeader
        title={location.name}
        description={location.description || undefined}
        namespace="modules/locations"
        icon={<IconMapPin size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'title', href: `/${locale}/locations`, namespace: 'modules/locations' },
          { label: location.name },
        ]}
        actions={[
          {
            label: tGlobal('common.back'),
            icon: <IconArrowLeft size={18} />,
            onClick: () => router.push(`/${locale}/locations`),
            variant: 'default',
          },
          {
            label: tGlobal('common.edit'),
            icon: <IconEdit size={18} />,
            onClick: () => router.push(`/${locale}/locations/${id}/edit`),
            variant: 'light',
          },
          {
            label: tGlobal('common.delete'),
            icon: <IconTrash size={18} />,
            onClick: handleDelete,
            variant: 'light',
            color: 'red',
          },
        ]}
      />

      <Grid mt="md">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper shadow="sm" p="md" radius="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={3}>{location.name}</Title>
                {getTypeBadge(location.type)}
              </Group>

              {location.description && (
                <Text c="dimmed">{location.description}</Text>
              )}

              <Divider />

              <Grid>
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed" mb={4}>
                    {t('form.code')}
                  </Text>
                  <Text fw={500}>{location.code || '-'}</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed" mb={4}>
                    {t('table.status')}
                  </Text>
                  <Badge color={location.isActive ? 'green' : 'gray'}>
                    {location.isActive ? t('status.active') : t('status.inactive')}
                  </Badge>
                </Grid.Col>
              </Grid>

              {(location.address || location.city || location.country) && (
                <>
                  <Divider />
                  <Group gap="xs">
                    <IconLocation size={18} />
                    <Text size="sm" c="dimmed">
                      {[location.address, location.city, location.country, location.postalCode]
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                  </Group>
                </>
              )}

              {location.parent && (
                <>
                  <Divider />
                  <Group gap="xs">
                    <IconBuilding size={18} />
                    <Text size="sm" c="dimmed" mr="xs">
                      {t('table.parent')}:
                    </Text>
                    <Text size="sm" fw={500}>
                      {location.parent.name}
                    </Text>
                    <Badge size="sm" variant="light">
                      {t(`types.${location.parent.type}`)}
                    </Badge>
                  </Group>
                </>
              )}
            </Stack>
          </Paper>

          {location.children && location.children.length > 0 && (
            <Paper shadow="sm" p="md" radius="md" mt="md">
              <Title order={4} mb="md">
                {t('table.children')} ({location.children.length})
              </Title>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('table.name')}</Table.Th>
                    <Table.Th>{t('table.type')}</Table.Th>
                    <Table.Th>{t('table.actions')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {location.children.map((child) => (
                    <Table.Tr key={child.id}>
                      <Table.Td>{child.name}</Table.Td>
                      <Table.Td>{getTypeBadge(child.type)}</Table.Td>
                      <Table.Td>
                        <ActionIcon
                          variant="subtle"
                          onClick={() => router.push(`/${locale}/locations/${child.id}`)}
                        >
                          <IconMapPin size={18} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          )}

        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper shadow="sm" p="md" radius="md">
            <Stack gap="md">
              <Title order={4}>{tGlobal('common.information')}</Title>
              <Divider />
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  {t('table.equipment')}
                </Text>
                <Badge>{location._count?.equipment || 0}</Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  {t('table.children')}
                </Text>
                <Badge>{location._count?.children || 0}</Badge>
              </Group>
              <Divider />
              <Text size="xs" c="dimmed">
                {tGlobal('common.createdAt')}: {new Date(location.createdAt).toLocaleDateString()}
              </Text>
              <Text size="xs" c="dimmed">
                {tGlobal('common.updatedAt')}: {new Date(location.updatedAt).toLocaleDateString()}
              </Text>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
}

