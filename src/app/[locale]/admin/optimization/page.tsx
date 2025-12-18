'use client';

import { Container, Paper, Stack, Title, Text, SimpleGrid, Card, Group, Button } from '@mantine/core';
import { IconChartBar, IconServer, IconDatabase, IconArrowRight } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';

export default function OptimizationPage() {
    const params = useParams();
    const router = useRouter();
    const currentLocale = (params?.locale as string) || 'tr';
    const { t } = useTranslation('global');

    const optimizationCards = [
        {
            title: t('optimization.performance.title'),
            description: t('optimization.performance.description'),
            icon: IconChartBar,
            color: 'blue',
            href: `/${currentLocale}/admin/optimization/performance`,
        },
        {
            title: t('optimization.cache.title'),
            description: t('optimization.cache.description'),
            icon: IconServer,
            color: 'violet',
            href: `/${currentLocale}/admin/optimization/cache`,
        },
        {
            title: t('optimization.database.title'),
            description: t('optimization.database.description'),
            icon: IconDatabase,
            color: 'teal',
            href: `/${currentLocale}/admin/optimization/database`,
        },
    ];

    return (
        <Container size="xl" pt="xl">
            <CentralPageHeader
                title={t('optimization.title')}
                description={t('optimization.description')}
                namespace="global"
                icon={<IconChartBar size={32} />}
                breadcrumbs={[
                    { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
                    { label: 'optimization.title', namespace: 'global' },
                ]}
            />

            <Paper p="xl" withBorder mt="xl">
                <Stack gap="lg">
                    <Title order={3}>{t('optimization.title')}</Title>
                    <Text c="dimmed">{t('optimization.description')}</Text>

                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" mt="md">
                        {optimizationCards.map((card) => (
                            <Card
                                key={card.title}
                                withBorder
                                padding="xl"
                                radius="md"
                                shadow="sm"
                                component="a"
                                href={card.href}
                                onClick={(event) => {
                                    event.preventDefault();
                                    router.push(card.href);
                                }}
                                style={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                            >
                                <Stack gap="sm">
                                    <Group>
                                        <card.icon size={28} color={`var(--mantine-color-${card.color}-6)`} />
                                        <Title order={4}>{card.title}</Title>
                                    </Group>
                                    <Text size="sm" c="dimmed">{card.description}</Text>
                                </Stack>
                                <Group justify="flex-end" mt="md">
                                    <Button variant="light" rightSection={<IconArrowRight size={16} />}>
                                        {t('buttons.view')}
                                    </Button>
                                </Group>
                            </Card>
                        ))}
                    </SimpleGrid>
                </Stack>
            </Paper>
        </Container>
    );
}





