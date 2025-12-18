import { Badge, BadgeProps } from '@mantine/core';
import { useTranslation } from '@/lib/i18n/client';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

interface PriorityIndicatorProps extends BadgeProps {
    priority: NotificationPriority;
}

export function PriorityIndicator({ priority, ...props }: PriorityIndicatorProps) {
    const { t } = useTranslation('modules/notifications');

    const getColor = () => {
        switch (priority) {
            case 'low': return 'gray';
            case 'medium': return 'blue';
            case 'high': return 'orange';
            case 'urgent': return 'red';
            default: return 'gray';
        }
    };

    return (
        <Badge color={getColor()} variant="dot" {...props}>
            {t(`priority.${priority}`)}
        </Badge>
    );
}
