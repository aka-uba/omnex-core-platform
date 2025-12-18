'use client';

import { Container, Title, Text, Card, SimpleGrid, Group, RingProgress } from '@mantine/core';
import { IconEye, IconClick, IconUsers, IconTrendingUp } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { DataTable, DataTableColumn } from '@/components/tables/DataTable';
import { useParams } from 'next/navigation';

export default function AnalyticsPage() {
    const params = useParams();
    const currentLocale = (params?.locale as string) || 'tr';

    const stats = [
        { title: 'Total Visitors', value: '12,543', icon: IconUsers, color: 'blue' },
        { title: 'Page Views', value: '45,231', icon: IconEye, color: 'green' },
        { title: 'Click Rate', value: '3.2%', icon: IconClick, color: 'orange' },
        { title: 'Conversion', value: '2.1%', icon: IconTrendingUp, color: 'violet' },
    ];

    const topPages = [
        { page: '/home', views: 15234, bounce: '32%' },
        { page: '/about', views: 8432, bounce: '45%' },
        { page: '/services', views: 6234, bounce: '38%' },
        { page: '/contact', views: 4123, bounce: '28%' },
    ];

    const columns: DataTableColumn[] = [
        {
            key: 'page',
            label: 'Page',
            sortable: true,
            searchable: true,
        },
        {
            key: 'views',
            label: 'Views',
            sortable: true,
            searchable: false,
            render: (value) => value.toLocaleString(),
        },
        {
            key: 'bounce',
            label: 'Bounce Rate',
            sortable: true,
            searchable: false,
        },
    ];

    return (
        <Container size="xl" pt="xl">
            <CentralPageHeader
                title="analytics.title"
                description="analytics.description"
                namespace="modules/web-builder"
                icon={<IconEye size={32} />}
                breadcrumbs={[
                    { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
                    { label: 'title', href: `/${currentLocale}/modules/web-builder`, namespace: 'modules/web-builder' },
                    { label: 'analytics.title', namespace: 'modules/web-builder' },
                ]}
            />

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="xl" mt="xl">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title} shadow="sm" padding="lg" radius="md" withBorder>
                            <Group justify="space-between">
                                <div>
                                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                        {stat.title}
                                    </Text>
                                    <Text fw={700} size="xl">
                                        {stat.value}
                                    </Text>
                                </div>
                                <RingProgress
                                    size={80}
                                    roundCaps
                                    thickness={8}
                                    sections={[{ value: 75, color: stat.color }]}
                                    label={
                                        <div className="flex items-center justify-center">
                                            <Icon size={20} stroke={1.5} />
                                        </div>
                                    }
                                />
                            </Group>
                        </Card>
                    );
                })}
            </SimpleGrid>

            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={4} mb="md">Top Pages</Title>
                <DataTable
                    columns={columns}
                    data={topPages}
                    searchable={true}
                    sortable={true}
                    pageable={true}
                    showColumnSettings={true}
                />
            </Card>
        </Container>
    );
}






