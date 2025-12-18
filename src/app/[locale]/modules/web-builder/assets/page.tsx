'use client';

import { Title, Text, Card, SimpleGrid, Button, Group, Image, Badge } from '@mantine/core';
import { IconPlus, IconPhoto, IconTrash, IconDownload } from '@tabler/icons-react';

export default function AssetsPage() {
    // Mock data
    const assets = [
        {
            id: '1',
            name: 'hero-image.jpg',
            type: 'image',
            size: '2.4 MB',
            website: 'My Business Site',
            url: 'https://via.placeholder.com/300x200',
        },
        {
            id: '2',
            name: 'logo.svg',
            type: 'image',
            size: '45 KB',
            website: 'Landing Page Campaign',
            url: 'https://via.placeholder.com/300x200',
        },
    ];

    return (
        <div className="p-6">
            <Group justify="space-between" mb="lg">
                <div>
                    <Title order={2}>Assets</Title>
                    <Text c="dimmed">Manage images, videos, and documents</Text>
                </div>
                <Button leftSection={<IconPlus size={20} />}>Upload Asset</Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
                {assets.map((asset) => (
                    <Card key={asset.id} shadow="sm" padding="lg" radius="md" withBorder>
                        <Card.Section>
                            <Image
                                src={asset.url}
                                height={160}
                                alt={asset.name}
                            />
                        </Card.Section>

                        <Group justify="space-between" mt="md" mb="xs">
                            <Text fw={500} size="sm" truncate>{asset.name}</Text>
                            <Badge size="sm">{asset.type}</Badge>
                        </Group>

                        <Text size="xs" c="dimmed" mb="xs">
                            {asset.size} • {asset.website}
                        </Text>

                        <Group gap="xs" mt="md">
                            <Button variant="light" color="blue" size="xs" fullWidth leftSection={<IconDownload size={14} />}>
                                Download
                            </Button>
                            <Button variant="light" color="red" size="xs" leftSection={<IconTrash size={14} />}>
                                Delete
                            </Button>
                        </Group>
                    </Card>
                ))}

                {/* Add New Card */}
                <Card shadow="sm" padding="lg" radius="md" withBorder className="flex flex-col items-center justify-center border-dashed cursor-pointer hover:bg-gray-50">
                    <div className="bg-blue-50 p-4 rounded-full mb-4">
                        <IconPhoto size={32} className="text-blue-500" />
                    </div>
                    <Text fw={500} ta="center">Upload Asset</Text>
                    <Text size="sm" c="dimmed" ta="center">Add images or files</Text>
                </Card>
            </SimpleGrid>
        </div>
    );
}






