'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Drawer,
  Paper,
  Table,
  Checkbox,
  Text,
  Group,
  Badge,
  Button,
  Stack,
  Title,
  ActionIcon,
  Tooltip,
  Skeleton,
  Alert,
  Tabs,
  ScrollArea,
  TextInput,
} from '@mantine/core';
import {
  IconHome,
  IconSearch,
  IconCheck,
  IconX,
  IconRefresh,
} from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { useUsageRights, useSeedUsageRights, UsageRight, USAGE_RIGHT_CATEGORIES } from '@/hooks/useUsageRights';

// Type for usage right selection (stored in apartment.usageRights JSON)
export interface ApartmentUsageRight {
  id: string;
  name: string;
  active: boolean;
}

interface UsageRightsPanelProps {
  opened: boolean;
  onClose: () => void;
  locale: string;
  selectedRights: ApartmentUsageRight[];
  onSave: (rights: ApartmentUsageRight[]) => void;
}

export function UsageRightsPanel({
  opened,
  onClose,
  locale,
  selectedRights,
  onSave,
}: UsageRightsPanelProps) {
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const { data, isLoading, error, refetch } = useUsageRights({ isActive: true });
  const seedUsageRights = useSeedUsageRights();

  const [localRights, setLocalRights] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string | null>('all');

  // Initialize local rights from selectedRights
  useEffect(() => {
    if (opened) {
      const initialRights: Record<string, boolean> = {};
      selectedRights.forEach((right) => {
        initialRights[right.id] = right.active;
      });
      setLocalRights(initialRights);
    }
  }, [opened, selectedRights]);

  // Get localized name based on locale
  const getLocalizedName = useCallback((usageRight: UsageRight): string => {
    if (locale === 'tr' && usageRight.nameTr) return usageRight.nameTr;
    if (locale === 'en' && usageRight.nameEn) return usageRight.nameEn;
    return usageRight.name; // Default to German name
  }, [locale]);

  // Handle checkbox toggle
  const handleToggle = useCallback((usageRight: UsageRight) => {
    setLocalRights((prev) => ({
      ...prev,
      [usageRight.id]: !prev[usageRight.id],
    }));
  }, []);

  // Handle select all in category
  const handleSelectAllCategory = useCallback((category: string) => {
    if (!data?.usageRights) return;
    const categoryRights = data.usageRights.filter((ur) => ur.category === category);
    const allSelected = categoryRights.every((ur) => localRights[ur.id]);

    setLocalRights((prev) => {
      const newRights = { ...prev };
      categoryRights.forEach((ur) => {
        newRights[ur.id] = !allSelected;
      });
      return newRights;
    });
  }, [data?.usageRights, localRights]);

  // Filter usage rights by search and category
  const filteredRights = useMemo(() => {
    if (!data?.usageRights) return [];

    let filtered = data.usageRights;

    // Filter by category
    if (activeTab && activeTab !== 'all') {
      filtered = filtered.filter((ur) => ur.category === activeTab);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((ur) =>
        ur.name.toLowerCase().includes(query) ||
        (ur.nameEn?.toLowerCase().includes(query)) ||
        (ur.nameTr?.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [data?.usageRights, activeTab, searchQuery]);

  // Group rights by category for display
  const groupedRights = useMemo(() => {
    const groups: Record<string, UsageRight[]> = {};
    filteredRights.forEach((ur) => {
      if (!groups[ur.category]) {
        groups[ur.category] = [];
      }
      groups[ur.category]?.push(ur);
    });
    return groups;
  }, [filteredRights]);

  // Get category label
  const getCategoryLabel = useCallback((category: string): string => {
    const categoryInfo = USAGE_RIGHT_CATEGORIES.find((c) => c.value === category);
    if (categoryInfo) {
      return t(categoryInfo.labelKey);
    }
    return category;
  }, [t]);

  // Get category badge color
  const getCategoryColor = useCallback((category: string): string => {
    const colors: Record<string, string> = {
      parking: 'blue',
      heating: 'orange',
      security: 'red',
      technology: 'cyan',
      bathroom: 'teal',
      outdoor: 'green',
      storage: 'gray',
      accessibility: 'violet',
      flooring: 'yellow',
      energy: 'lime',
    };
    return colors[category] || 'gray';
  }, []);

  // Count selected rights
  const selectedCount = useMemo(() => {
    return Object.values(localRights).filter(Boolean).length;
  }, [localRights]);

  // Handle save
  const handleSave = useCallback(() => {
    if (!data?.usageRights) return;

    const rights: ApartmentUsageRight[] = data.usageRights.map((ur) => ({
      id: ur.id,
      name: ur.name,
      active: localRights[ur.id] || false,
    }));

    onSave(rights);
    onClose();
  }, [data?.usageRights, localRights, onSave, onClose]);

  // Handle seed
  const handleSeed = useCallback(async () => {
    try {
      await seedUsageRights.mutateAsync();
      refetch();
    } catch (error) {
      console.error('Failed to seed usage rights:', error);
    }
  }, [seedUsageRights, refetch]);

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconHome size={20} />
          <Title order={4}>{t('usageRights.title')}</Title>
        </Group>
      }
      position="right"
      size="lg"
      padding="md"
    >
      <Stack gap="md" h="calc(100vh - 120px)">
        {/* Search */}
        <TextInput
          placeholder={t('usageRights.search')}
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Category Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="all">{t('usageRights.allCategories')}</Tabs.Tab>
            {USAGE_RIGHT_CATEGORIES.map((cat) => (
              <Tabs.Tab key={cat.value} value={cat.value}>
                {t(cat.labelKey)}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>

        {/* Loading State */}
        {isLoading && (
          <Stack gap="xs">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={40} />
            ))}
          </Stack>
        )}

        {/* Error State */}
        {error && (
          <Alert color="red" title={t('messages.error')}>
            {error instanceof Error ? error.message : t('messages.error')}
          </Alert>
        )}

        {/* Empty State - Seed Button */}
        {!isLoading && !error && data?.usageRights?.length === 0 && (
          <Alert color="blue" title={t('usageRights.noRights')}>
            <Stack gap="sm">
              <Text size="sm">{t('usageRights.noRightsDescription')}</Text>
              <Button
                leftSection={<IconRefresh size={16} />}
                onClick={handleSeed}
                loading={seedUsageRights.isPending}
              >
                {t('usageRights.seedDefaults')}
              </Button>
            </Stack>
          </Alert>
        )}

        {/* Usage Rights Table */}
        {!isLoading && !error && data?.usageRights && data.usageRights.length > 0 && (
          <ScrollArea h="calc(100vh - 320px)">
            <Paper withBorder>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ width: 50, textAlign: 'center' }}>#</Table.Th>
                    <Table.Th>{t('usageRights.name')}</Table.Th>
                    <Table.Th style={{ width: 100, textAlign: 'center' }}>
                      {t('usageRights.selection')}
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {activeTab === 'all' ? (
                    // Show grouped by category
                    Object.entries(groupedRights).map(([category, rights]) => (
                      <>
                        <Table.Tr key={`cat-${category}`} style={{ backgroundColor: 'var(--mantine-color-gray-1)' }}>
                          <Table.Td colSpan={2}>
                            <Group gap="xs">
                              <Badge color={getCategoryColor(category)} variant="filled">
                                {getCategoryLabel(category)}
                              </Badge>
                              <Text size="xs" c="dimmed">({rights.length})</Text>
                            </Group>
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'center' }}>
                            <Tooltip label={t('usageRights.selectAll')}>
                              <ActionIcon
                                variant="subtle"
                                size="sm"
                                onClick={() => handleSelectAllCategory(category)}
                              >
                                <IconCheck size={14} />
                              </ActionIcon>
                            </Tooltip>
                          </Table.Td>
                        </Table.Tr>
                        {rights.map((ur, index) => (
                          <Table.Tr key={ur.id}>
                            <Table.Td style={{ textAlign: 'center' }}>
                              <Text size="sm" c="dimmed">{ur.sortOrder}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{getLocalizedName(ur)}</Text>
                            </Table.Td>
                            <Table.Td style={{ textAlign: 'center' }}>
                              <Checkbox
                                checked={localRights[ur.id] || false}
                                onChange={() => handleToggle(ur)}
                              />
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </>
                    ))
                  ) : (
                    // Show flat list for specific category
                    filteredRights.map((ur, index) => (
                      <Table.Tr key={ur.id}>
                        <Table.Td style={{ textAlign: 'center' }}>
                          <Text size="sm" c="dimmed">{ur.sortOrder}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{getLocalizedName(ur)}</Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center' }}>
                          <Checkbox
                            checked={localRights[ur.id] || false}
                            onChange={() => handleToggle(ur)}
                          />
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </ScrollArea>
        )}

        {/* Footer */}
        <Paper p="md" withBorder style={{ marginTop: 'auto' }}>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              {t('usageRights.selectedCount', { count: selectedCount })}
            </Text>
            <Group gap="sm">
              <Button variant="subtle" onClick={onClose} leftSection={<IconX size={16} />}>
                {tGlobal('form.cancel')}
              </Button>
              <Button onClick={handleSave} leftSection={<IconCheck size={16} />}>
                {tGlobal('form.save')}
              </Button>
            </Group>
          </Group>
        </Paper>
      </Stack>
    </Drawer>
  );
}
