'use client';

import { SimpleGrid, Card, Text, Group, ThemeIcon, UnstyledButton, Box, Title } from '@mantine/core';
import {
    IconMessageChatbot,
    IconPhoto,
    IconCode,
    IconMicrophone,
    IconVideo
} from '@tabler/icons-react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import classes from '../../AIModule.module.css';

export function AIDashboard() {
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) || 'tr';
    const { t } = useTranslation('modules/ai');

    const tools = [
        {
            id: 'text',
            label: 'textGenerator',
            description: 'Generate creative text, essays, and more',
            icon: IconMessageChatbot,
            link: `/${locale}/modules/ai/text`,
            color: 'blue'
        },
        {
            id: 'image',
            label: 'imageGenerator',
            description: 'Create stunning images from text descriptions',
            icon: IconPhoto,
            link: `/${locale}/modules/ai/image`,
            color: 'pink'
        },
        {
            id: 'code',
            label: 'codeGenerator',
            description: 'Generate code snippets and solve programming problems',
            icon: IconCode,
            link: `/${locale}/modules/ai/code`,
            color: 'green'
        },
        {
            id: 'audio',
            label: 'audioGenerator',
            description: 'Convert text to lifelike speech',
            icon: IconMicrophone,
            link: `/${locale}/modules/ai/audio`,
            color: 'orange'
        },
        {
            id: 'video',
            label: 'videoGenerator',
            description: 'Generate videos from text prompts',
            icon: IconVideo,
            link: `/${locale}/modules/ai/video`,
            color: 'red'
        },
    ];

    return (
        <Box p="md">
            <Title order={2} mb="xl">{t('aiStudio')}</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                {tools.map((tool) => (
                    <UnstyledButton
                        key={tool.id}
                        onClick={() => router.push(tool.link)}
                        style={{ display: 'block', height: '100%' }}
                    >
                        <Card
                            padding="lg"
                            radius="md"
                            withBorder
                            {...(classes.dashboardCard ? { className: classes.dashboardCard } : {})}
                            h="100%"
                        >
                            <Group align="flex-start" mb="md">
                                <ThemeIcon
                                    size={48}
                                    radius="md"
                                    variant="light"
                                    color={tool.color}
                                >
                                    <tool.icon size={28} />
                                </ThemeIcon>
                                <Box style={{ flex: 1 }}>
                                    <Text fw={600} size="lg" mb={4}>
                                        {t(tool.label)}
                                    </Text>
                                    <Text size="sm" c="dimmed" lh={1.4}>
                                        {tool.description}
                                    </Text>
                                </Box>
                            </Group>
                        </Card>
                    </UnstyledButton>
                ))}
            </SimpleGrid>
        </Box>
    );
}
