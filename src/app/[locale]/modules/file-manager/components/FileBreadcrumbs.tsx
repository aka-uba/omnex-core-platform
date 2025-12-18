'use client';

import { Breadcrumbs, Anchor, Text, Group } from '@mantine/core';
import { IconHome } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';

interface BreadcrumbItem {
    label: string;
    path: string;
}

interface FileBreadcrumbsProps {
    items: BreadcrumbItem[];
    onNavigate: (path: string) => void;
}

export function FileBreadcrumbs({ items, onNavigate }: FileBreadcrumbsProps) {
    const { t } = useTranslation('modules/file-manager');
    return (
        <Breadcrumbs separator="/">
            <Anchor component="button" onClick={() => onNavigate('/')} underline="hover">
                <Group gap={4} align="center">
                    <IconHome size={16} />
                    <span>{t('breadcrumbs.home')}</span>
                </Group>
            </Anchor>
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                return isLast ? (
                    <Text key={item.path} size="sm" fw={600}>
                        {item.label}
                    </Text>
                ) : (
                    <Anchor key={item.path} onClick={() => onNavigate(item.path)} size="sm">
                        {item.label}
                    </Anchor>
                );
            })}
        </Breadcrumbs>
    );
}
