'use client';

import { Title, Button, Card, Text, Group, SimpleGrid, Badge, ActionIcon } from '@mantine/core';
import { IconPlus, IconPencil, IconTrash, IconExternalLink } from '@tabler/icons-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function WebsitesPage() {
    const params = useParams();
    const locale = (params?.locale as string) || 'tr';
    
    // Mock data for now
    const websites = [
        {
            id: '1',
            name: 'My Business Site',
            domain: 'business.omnex.com',
            status: 'published',
            updatedAt: '2 hours ago',
        },
        {
            id: '2',
            name: 'Landing Page Campaign',
            domain: 'campaign.omnex.com',
            status: 'draft',
            updatedAt: '1 day ago',
        },
    ];

    return (
        <div className="p-6">
            <Group justify="space-between" mb="lg">
                <div>
                    <Title order={2}>Websites</Title>
                    <Text c="dimmed">Manage your websites and landing pages</Text>
                </div>
                <Button leftSection={<IconPlus size={20} />}>Create New Website</Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                {websites.map((site) => (
                    <Card key={site.id} shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between" mb="xs">
                            <Text fw={500}>{site.name}</Text>
                            <Badge color={site.status === 'published' ? 'green' : 'yellow'}>
                                {site.status}
                            </Badge>
                        </Group>

                        <Text size="sm" c="dimmed" mb="md">
                            {site.domain}
                        </Text>

                        <Text size="xs" c="dimmed" mb="xl">
                            Last updated: {site.updatedAt}
                        </Text>

                        <Group gap="xs">
                            <Button
                                component={Link}
                                href={`/${locale}/web-builder/builder/${site.id}/home`}
                                variant="light"
                                color="blue"
                                fullWidth
                                leftSection={<IconPencil size={16} />}
                            >
                                Edit
                            </Button>
                            <ActionIcon variant="light" color="red" size="lg">
                                <IconTrash size={18} />
                            </ActionIcon>
                            <ActionIcon variant="light" color="gray" size="lg">
                                <IconExternalLink size={18} />
                            </ActionIcon>
                        </Group>
                    </Card>
                ))}

                {/* Add New Card */}
                <Card shadow="sm" padding="lg" radius="md" withBorder className="flex flex-col items-center justify-center border-dashed cursor-pointer hover:bg-gray-50">
                    <div className="bg-blue-50 p-4 rounded-full mb-4">
                        <IconPlus size={32} className="text-blue-500" />
                    </div>
                    <Text fw={500} ta="center">Create New Website</Text>
                    <Text size="sm" c="dimmed" ta="center">Start from scratch or use a template</Text>
                </Card>
            </SimpleGrid>
        </div>
    );
}






