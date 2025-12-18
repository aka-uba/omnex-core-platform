'use client';

import { useState, useEffect } from 'react';
import { Container } from '@mantine/core';
import { IconBell } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { NotificationForm } from './components/NotificationForm';
import { useCreateNotification } from './hooks/useNotifications';
import { useRouter, useParams } from 'next/navigation';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useTranslation } from '@/lib/i18n/client';

export function NotificationCreate() {
    const { t } = useTranslation('modules/notifications');
    const params = useParams();
    const router = useRouter();
    const currentLocale = (params?.locale as string) || 'tr';
    const [mounted, setMounted] = useState(false);
    const createMutation = useCreateNotification();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = (values: any) => {
        // Transform snake_case to camelCase and handle data types
        const transformedData: any = {
            title: values.title,
            message: values.message,
            type: values.type,
            priority: values.priority,
            senderId: values.sender_id || undefined,
            locationId: values.location_id || undefined,
            isGlobal: values.is_global || false,
            expiresAt: values.expires_at ? (values.expires_at instanceof Date ? values.expires_at.toISOString() : values.expires_at) : undefined,
            actionUrl: values.action_url || undefined,
            actionText: values.action_text || undefined,
            module: values.module || undefined,
            data: values.data && values.data !== '{}' ? (typeof values.data === 'string' ? JSON.parse(values.data) : values.data) : undefined,
            attachments: values.attachments || undefined,
        };

        // Only include recipientId if not global
        if (!transformedData.isGlobal && values.recipient_id) {
            transformedData.recipientId = values.recipient_id;
        }

        createMutation.mutate(transformedData, {
            onSuccess: () => {
                showToast({
                    type: 'success',
                    title: t('status.success'),
                    message: t('status.created_success'),
                });
                router.push(`/${currentLocale}/modules/notifications`);
            },
            onError: (error: any) => {
                console.error('Notification creation error:', error);
                showToast({
                    type: 'error',
                    title: t('status.error'),
                    message: error?.message || t('status.create_error'),
                });
            },
        });
    };

    return (
        <Container size="md" py="xl">
            <CentralPageHeader
                title={t('create')}
                description={t('description')}
                namespace="modules/notifications"
                icon={mounted ? <IconBell size={32} /> : null}
                breadcrumbs={[
                    { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
                    { label: 'title', href: `/${currentLocale}/modules/notifications`, namespace: 'modules/notifications' },
                    { label: 'create', namespace: 'modules/notifications' },
                ]}
            />
            <NotificationForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
        </Container>
    );
}
