'use client';

import { Container, Title, Tabs, Paper } from '@mantine/core';
import { BrandKitTab } from './components/BrandKitTab';
import { TeamTab } from './components/TeamTab';
import { IconPalette, IconUsers, IconCoin } from '@tabler/icons-react';

export function SettingsPage() {
    return (
        <Container size="xl" py="xl">
            <Title order={2} mb="xl">Settings</Title>

            <Paper withBorder radius="md" p="md">
                <Tabs defaultValue="brand">
                    <Tabs.List>
                        <Tabs.Tab value="brand" leftSection={<IconPalette size={14} />}>
                            Brand Kit
                        </Tabs.Tab>
                        <Tabs.Tab value="team" leftSection={<IconUsers size={14} />}>
                            Team
                        </Tabs.Tab>
                        <Tabs.Tab value="finance" leftSection={<IconCoin size={14} />}>
                            Finance
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="brand" pt="xl">
                        <BrandKitTab />
                    </Tabs.Panel>

                    <Tabs.Panel value="team" pt="xl">
                        <TeamTab />
                    </Tabs.Panel>

                    <Tabs.Panel value="finance" pt="xl">
                        Settings for finance module...
                    </Tabs.Panel>
                </Tabs>
            </Paper>
        </Container>
    );
}
