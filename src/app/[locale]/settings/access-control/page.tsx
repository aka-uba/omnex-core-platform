'use client';

import { useState } from 'react';
import { Container, Tabs, Paper } from '@mantine/core';
import { IconApps, IconMenu2, IconSettings, IconLayout } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { ScopeSelector } from './components/ScopeSelector';
import { ModuleAccessTab } from './components/ModuleAccessTab';
import { MenuVisibilityTab } from './components/MenuVisibilityTab';
import { UIFeaturesTab } from './components/UIFeaturesTab';
import { LayoutCustomizationTab } from './components/LayoutCustomizationTab';

export default function AccessControlPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const { t } = useTranslation('global');
  const [activeTab, setActiveTab] = useState<string | null>('module');
  const [scope, setScope] = useState<{ type: 'tenant' | 'role' | 'user'; id?: string }>({ type: 'tenant' });

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('accessControl.title')}
        description={t('accessControl.description')}
        namespace="global"
        icon={<IconSettings size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'navigation.settings', href: `/${locale}/settings`, namespace: 'global' },
          { label: 'accessControl.title', namespace: 'global' },
        ]}
      />

      <Paper shadow="sm" p="xl" withBorder mt="xl">
        <ScopeSelector lang={locale} onScopeChange={setScope} />

        <Tabs value={activeTab} onChange={setActiveTab} mt="xl">
          <Tabs.List>
            <Tabs.Tab value="module" leftSection={<IconApps size={16} />}>
              {t('accessControl.tabs.module')}
            </Tabs.Tab>
            <Tabs.Tab value="menu" leftSection={<IconMenu2 size={16} />}>
              {t('accessControl.tabs.menu')}
            </Tabs.Tab>
            <Tabs.Tab value="ui" leftSection={<IconSettings size={16} />}>
              {t('accessControl.tabs.ui')}
            </Tabs.Tab>
            <Tabs.Tab value="layout" leftSection={<IconLayout size={16} />}>
              {t('accessControl.tabs.layout')}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="module" pt="xl">
            <ModuleAccessTab scope={scope} />
          </Tabs.Panel>

          <Tabs.Panel value="menu" pt="xl">
            <MenuVisibilityTab lang={locale} scope={scope} />
          </Tabs.Panel>

          <Tabs.Panel value="ui" pt="xl">
            <UIFeaturesTab scope={scope} />
          </Tabs.Panel>

          <Tabs.Panel value="layout" pt="xl">
            <LayoutCustomizationTab scope={scope} />
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Container>
  );
}
