'use client';

import { Card, Text, Badge, Button, Group } from '@mantine/core';
import Link from 'next/link';
import { IconArrowRight } from '@tabler/icons-react';

interface GeneratorCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    badge?: string;
}

export function GeneratorCard({ title, description, icon, href, badge }: GeneratorCardProps) {
    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section>
                {/* Placeholder for image or gradient */}
                <div style={{ height: 100, background: 'var(--mantine-color-blue-light)' }} />
            </Card.Section>

            <Group justify="space-between" mt="md" mb="xs">
                <Text fw={500}>{title}</Text>
                {badge && <Badge color="pink">{badge}</Badge>}
            </Group>

            <Text size="sm" c="dimmed" h={60}>
                {description}
            </Text>

            <Button component={Link} href={href} variant="light" color="blue" fullWidth mt="md" radius="md" rightSection={<IconArrowRight size={14} />}>
                Open Generator
            </Button>
        </Card>
    );
}
