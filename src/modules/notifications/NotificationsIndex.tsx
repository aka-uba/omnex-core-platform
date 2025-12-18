'use client';

import { Container } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/client';
import { NotificationsTable } from './components/NotificationsTable';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { IconPlus, IconBell } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export function NotificationsIndex({ locale }: { locale: string }) {
    const { t } = useTranslation('modules/notifications');
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <Container size="xl" py="xl">
            <CentralPageHeader
                title="dashboard.title"
                description="dashboard.description"
                namespace="modules/notifications"
                icon={mounted ? <IconBell size={32} /> : null}
                breadcrumbs={[
                    { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
                    { label: 'title', namespace: 'modules/notifications' },
                    { label: 'dashboard.title', namespace: 'modules/notifications' },
                ]}
                actions={[
                    {
                        label: t('actions.create'),
                        icon: mounted ? <IconPlus size={18} /> : <span style={{ width: 18, height: 18, display: 'inline-block' }} />,
                        onClick: () => router.push(`/${locale}/modules/notifications/create`),
                        variant: 'filled',
                    },
                ]}
            />
            <NotificationsTable />
        </Container>
    );
}
