import { ActionIcon, Menu } from '@mantine/core';
import { IconDots, IconEye, IconEdit, IconArchive, IconTrash } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface NotificationActionsDropdownProps {
    id: string;
    onArchive?: (id: string) => void;
    onDelete?: (id: string) => void;
}

export function NotificationActionsDropdown({ id, onArchive, onDelete }: NotificationActionsDropdownProps) {
    const { t } = useTranslation('global');
    const pathname = usePathname();
    const locale = pathname?.split('/')[1] || 'tr';

    return (
        <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
                <ActionIcon variant="subtle" color="gray">
                    <IconDots size={16} />
                </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
                <Menu.Item
                    leftSection={<IconEye size={14} />}
                    component={Link}
                    href={`/${locale}/modules/notifications/${id}`}
                >
                    {t('actions.view')}
                </Menu.Item>
                <Menu.Item
                    leftSection={<IconEdit size={14} />}
                    component={Link}
                    href={`/${locale}/modules/notifications/${id}/edit`}
                >
                    {t('actions.edit')}
                </Menu.Item>

                <Menu.Divider />

                {onArchive && (
                    <Menu.Item
                        leftSection={<IconArchive size={14} />}
                        onClick={() => onArchive(id)}
                    >
                        {t('actions.archive')}
                    </Menu.Item>
                )}
                {onDelete && (
                    <Menu.Item
                        color="red"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => onDelete(id)}
                    >
                        {t('actions.delete')}
                    </Menu.Item>
                )}
            </Menu.Dropdown>
        </Menu>
    );
}
