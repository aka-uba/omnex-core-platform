'use client';

import { Container, Tabs } from '@mantine/core';
import { SetupWizard } from './SetupWizard';
import { SystemStatus } from './SystemStatus';
import { ServerControl } from './ServerControl';
import { Documentation } from './Documentation';
import { IconWand, IconServer, IconBook, IconTerminal2 } from '@tabler/icons-react';

export const dynamic = 'force-dynamic';

export default function SetupPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <Container size="xl" pt="xl">
        <Tabs defaultValue="wizard">
          <Tabs.List>
            <Tabs.Tab value="wizard" leftSection={<IconWand size={18} className="tabler-icon tabler-icon-wand" />}>
              Kurulum Sihirbazı
            </Tabs.Tab>
            <Tabs.Tab value="status" leftSection={<IconServer size={18} className="tabler-icon tabler-icon-server" />}>
              Sistem Durumu
            </Tabs.Tab>
            <Tabs.Tab value="control" leftSection={<IconTerminal2 size={18} className="tabler-icon tabler-icon-terminal" />}>
              Sunucu Yönetimi
            </Tabs.Tab>
            <Tabs.Tab value="docs" leftSection={<IconBook size={18} className="tabler-icon tabler-icon-book" />}>
              Dokümantasyon
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="wizard" pt="xl">
            <SetupWizard />
          </Tabs.Panel>

          <Tabs.Panel value="status" pt="xl">
            <SystemStatus />
          </Tabs.Panel>

          <Tabs.Panel value="control" pt="xl">
            <ServerControl />
          </Tabs.Panel>

          <Tabs.Panel value="docs" pt="xl">
            <Documentation />
          </Tabs.Panel>
        </Tabs>
      </Container>
    </div>
  );
}

