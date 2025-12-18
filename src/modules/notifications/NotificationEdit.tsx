'use client';

import { Container } from '@mantine/core';
import { NotificationEditSkeleton } from './components/NotificationEditSkeleton';
import { NotificationForm } from './components/NotificationForm';
import { useNotification, useUpdateNotification } from './hooks/useNotifications';
import { useRouter, usePathname } from 'next/navigation';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useTranslation } from '@/lib/i18n/client';

interface NotificationEditProps {
    id: string;
}

export function NotificationEdit({ id }: NotificationEditProps) {
    const { t } = useTranslation('modules/notifications');
    const router = useRouter();
    const pathname = usePathname();
    const locale = pathname?.split('/')[1] || 'tr';
    const { data: notification, isLoading } = useNotification(id);
    const updateMutation = useUpdateNotification();

    const handleSubmit = (values: any) => {
        updateMutation.mutate({ id, data: values }, {
            onSuccess: () => {
                showToast({
                    type: 'success',
                    title: t('status.success'),
                    message: 'Notification updated successfully',
                });
                router.push(`/${locale}/modules/notifications/dashboard`);
            },
            onError: () => {
                showToast({
                    type: 'error',
                    title: t('status.error'),
                    message: 'Failed to update notification',
                });
            },
        });
    };

    if (isLoading) {
        return <NotificationEditSkeleton />;
    }

    return (
        <Container size="md" py="xl">
            <NotificationForm
                initialValues={notification}
                onSubmit={handleSubmit}
                isLoading={updateMutation.isPending}
                isEdit
            />
        </Container>
    );
}
