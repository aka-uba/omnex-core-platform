'use client';

import { Title, Text, Card, SimpleGrid, Button, Group, Badge } from '@mantine/core';
import { IconPlus, IconForms, IconTrash, IconEye } from '@tabler/icons-react';

export default function FormsPage() {
    // Mock data
    const forms = [
        {
            id: '1',
            name: 'Contact Form',
            website: 'My Business Site',
            submissions: 24,
            status: 'active',
        },
        {
            id: '2',
            name: 'Newsletter Signup',
            website: 'Landing Page Campaign',
            submissions: 156,
            status: 'active',
        },
    ];

    return (
        <div className="p-6">
            <Group justify="space-between" mb="lg">
                <div>
                    <Title order={2}>Forms</Title>
                    <Text c="dimmed">Manage contact forms and submissions</Text>
                </div>
                <Button leftSection={<IconPlus size={20} />}>Create New Form</Button>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                {forms.map((form) => (
                    <Card key={form.id} shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between" mb="xs">
                            <Text fw={500}>{form.name}</Text>
                            <Badge color="green">{form.status}</Badge>
                        </Group>

                        <Text size="sm" c="dimmed" mb="xs">
                            Website: {form.website}
                        </Text>

                        <Text size="sm" c="blue" fw={500} mb="md">
                            {form.submissions} submissions
                        </Text>

                        <Group gap="xs">
                            <Button variant="light" color="blue" fullWidth leftSection={<IconEye size={16} />}>
                                View Submissions
                            </Button>
                            <Button variant="light" color="red" leftSection={<IconTrash size={16} />}>
                                Delete
                            </Button>
                        </Group>
                    </Card>
                ))}

                {/* Add New Card */}
                <Card shadow="sm" padding="lg" radius="md" withBorder className="flex flex-col items-center justify-center border-dashed cursor-pointer hover:bg-gray-50">
                    <div className="bg-blue-50 p-4 rounded-full mb-4">
                        <IconForms size={32} className="text-blue-500" />
                    </div>
                    <Text fw={500} ta="center">Create New Form</Text>
                    <Text size="sm" c="dimmed" ta="center">Build custom forms for your website</Text>
                </Card>
            </SimpleGrid>
        </div>
    );
}






