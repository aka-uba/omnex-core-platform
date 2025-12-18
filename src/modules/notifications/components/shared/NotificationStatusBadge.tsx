import { Badge, BadgeProps } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/client';

interface NotificationStatusBadgeProps extends BadgeProps {
    isRead: boolean;
    isGlobal: boolean;
}

export function NotificationStatusBadge({ isRead, isGlobal, ...props }: NotificationStatusBadgeProps) {
    const { t } = useTranslation('modules/notifications');

    if (isGlobal) {
        return (
            <Badge color="violet" variant="light" {...props}>
                {t('status.global')}
            </Badge>
        );
    }

    return (
        <Badge
            color={isRead ? 'gray' : 'blue'}
            variant={isRead ? 'outline' : 'filled'}
            {...props}
        >
            {isRead ? t('status.read') : t('status.unread')}
        </Badge>
    );
}
