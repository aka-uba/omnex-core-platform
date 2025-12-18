'use client';

import { useState, useMemo, useEffect } from 'react';
import { Container, Text, Button, SimpleGrid, TextInput, Select, Stack, Group } from '@mantine/core';
import { IconUpload, IconSearch } from '@tabler/icons-react';
import { useModules } from '@/context/ModuleContext';
import { ModuleCard } from './ModuleCard';
import { ModuleCardSkeleton } from './ModuleCardSkeleton';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { ClientIcon } from '@/components/common/ClientIcon';
import { useTranslation } from '@/lib/i18n/client';
import { useParams } from 'next/navigation';

export function ModuleListing() {
  const { modules, loading } = useModules();
  const { t } = useTranslation('modules/management');
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'tr';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredModules = useMemo(() => {
    return modules.filter((module) => {
      const matchesSearch = module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || module.status === statusFilter;
      
      const matchesCategory = categoryFilter === 'all' || module.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [modules, searchQuery, statusFilter, categoryFilter]);

  const categories = useMemo(() => {
    const cats = new Set(modules.map((m) => m.category).filter((cat): cat is string => Boolean(cat)));
    return Array.from(cats);
  }, [modules]);

  const handleConfigure = (module: any) => {
    // Navigate to module settings
    window.location.href = `/${currentLocale}/${module.slug}/settings`;
  };

  return (
    <Container size="xl" py="xl">
      <CentralPageHeader
        title="listing.title"
        description="listing.description"
        namespace="modules/management"
        breadcrumbs={[
          { label: 'navigation.dashboard', href: '/dashboard', namespace: 'global' },
          { label: 'listing.title', namespace: 'modules/management' },
        ]}
        icon={mounted ? <IconUpload size={32} /> : null}
        actions={[
          {
            label: 'upload.title',
            icon: <ClientIcon><IconUpload size={18} /></ClientIcon>,
            onClick: () => {
              window.location.href = '/modules/upload';
            },
            variant: 'primary',
          },
        ]}
      />

      {/* Controls Bar */}
      <Group gap="md" wrap="wrap">
        <TextInput
          placeholder={t('listing.searchPlaceholder')}
          leftSection={<ClientIcon><IconSearch size={16} /></ClientIcon>}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, minWidth: 280 }}
        />

        <Select
          placeholder={t('listing.statusAll')}
          data={[
            { value: 'all', label: t('listing.all') },
            { value: 'active', label: t('listing.active') },
            { value: 'inactive', label: t('listing.inactive') },
            { value: 'installed', label: t('listing.installed') },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
        />

        <Select
          placeholder={t('listing.categoryAll')}
          data={[
            { value: 'all', label: t('listing.all') },
            ...categories.map((cat) => {
              const translatedCategory = t(`categories.${cat?.toLowerCase()}`);
              return { 
                value: cat, 
                label: translatedCategory !== `categories.${cat?.toLowerCase()}` 
                  ? translatedCategory 
                  : cat 
              };
            }),
          ]}
          value={categoryFilter}
          onChange={setCategoryFilter}
        />
      </Group>

      {/* Module Grid */}
      {loading ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} mt="xl">
          {Array.from({ length: 8 }).map((_, i) => (
            <ModuleCardSkeleton key={i} />
          ))}
        </SimpleGrid>
      ) : filteredModules.length === 0 ? (
        <Stack align="center" justify="center" py="xl" mt="xl" className="border-2 border-dashed rounded-xl">
          <Text size="xl" c="dimmed">
            {t('listing.noModulesFound')}
          </Text>
          <Text size="sm" c="dimmed">
            {t('listing.uploadFirstModule')}
          </Text>
          <Button
            leftSection={<ClientIcon><IconUpload size={18} /></ClientIcon>}
            onClick={() => {
              window.location.href = '/modules/upload';
            }}
          >
            {t('listing.uploadModule')}
          </Button>
        </Stack>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} mt="xl">
          {filteredModules.map((module) => (
            <ModuleCard key={module.id} module={module} onConfigure={handleConfigure} />
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}

