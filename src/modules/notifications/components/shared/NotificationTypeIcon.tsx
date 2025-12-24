import {
    IconInfoCircle,
    IconAlertTriangle,
    IconAlertCircle,
    IconCheck,
    IconCheckbox,
    IconBell
} from '@tabler/icons-react';
import { ThemeIcon, ThemeIconProps } from '@mantine/core';

export type NotificationType = 'info' | 'warning' | 'error' | 'success' | 'task' | 'alert';

interface NotificationTypeIconProps extends Omit<ThemeIconProps, 'children'> {
    type: NotificationType;
}

export function NotificationTypeIcon({ type, ...props }: NotificationTypeIconProps) {
    const getIcon = () => {
        switch (type) {
            case 'info': return <IconInfoCircle size="60%" />;
            case 'warning': return <IconAlertTriangle size="60%" />;
            case 'error': return <IconAlertCircle size="60%" />;
            case 'success': return <IconCheck size="60%" />;
            case 'task': return <IconCheckbox size="60%" />;
            case 'alert': return <IconBell size="60%" />;
            default: return <IconInfoCircle size="60%" />;
        }
    };

    const getColor = () => {
        switch (type) {
            case 'info': return 'blue';
            case 'warning': return 'yellow';
            case 'error': return 'red';
            case 'success': return 'green';
            case 'task': return 'cyan';
            case 'alert': return 'orange';
            default: return 'gray';
        }
    };

    return (
        <ThemeIcon color={getColor()} variant="filled" radius="md" {...props}>
            {getIcon()}
        </ThemeIcon>
    );
}
