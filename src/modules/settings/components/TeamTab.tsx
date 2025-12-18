'use client';

import { Table, Group, Avatar, Text, Badge, Button, ActionIcon } from '@mantine/core';
import { IconTrash, IconPencil } from '@tabler/icons-react';

const elements = [
    { id: 1, avatar: '', name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
    { id: 2, avatar: '', name: 'Jane Smith', email: 'jane@example.com', role: 'Editor', status: 'Active' },
    { id: 3, avatar: '', name: 'Bob Johnson', email: 'bob@example.com', role: 'Viewer', status: 'Inactive' },
];

export function TeamTab() {
    const rows = elements.map((element) => (
        <Table.Tr key={element.id}>
            <Table.Td>
                <Group gap="sm">
                    <Avatar size={30} src={element.avatar} radius={30} />
                    <Text size="sm" fw={500}>
                        {element.name}
                    </Text>
                </Group>
            </Table.Td>
            <Table.Td>{element.email}</Table.Td>
            <Table.Td>
                <Badge color={element.role === 'Admin' ? 'blue' : 'gray'} variant="light">
                    {element.role}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Badge color={element.status === 'Active' ? 'teal' : 'red'} variant="dot">
                    {element.status}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Group gap={0} justify="flex-end">
                    <ActionIcon variant="subtle" color="gray">
                        <IconPencil size={16} stroke={1.5} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red">
                        <IconTrash size={16} stroke={1.5} />
                    </ActionIcon>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <>
            <Group justify="flex-end" mb="md">
                <Button>Invite Member</Button>
            </Group>
            <Table>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>User</Table.Th>
                        <Table.Th>Email</Table.Th>
                        <Table.Th>Role</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th />
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
            </Table>
        </>
    );
}
