'use client';

import { Breadcrumbs, Anchor, Text } from '@mantine/core';
import Link from 'next/link';
import { IconChevronRight } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { useState, useEffect } from 'react';

export interface BreadcrumbItem {
    label: string;
    href?: string;
    namespace?: string; // Optional namespace for this specific breadcrumb item
}

interface BreadcrumbNavProps {
    items: BreadcrumbItem[];
    namespace?: string; // Default namespace for items that don't specify one
}

// Individual breadcrumb item component that can use its own namespace
function BreadcrumbItemComponent({ item, defaultNamespace }: { item: BreadcrumbItem; defaultNamespace: string }) {
    const itemNamespace = item.namespace || defaultNamespace;
    const { t } = useTranslation(itemNamespace);

    // Helper function to translate keys
    const translate = (key: string): string => {
        if (!key) return '';
        // Always try to translate, even if it doesn't contain a dot
        const translated = t(key);
        // If translation returns the same key, it means translation not found
        // Return the key as-is in that case (for direct text)
        return translated !== key ? translated : key;
    };

    const translatedLabel = translate(item.label);

    if (item.href) {
        return (
            <Anchor component={Link} href={item.href} size="sm">
                {translatedLabel}
            </Anchor>
        );
    }
    return (
        <Text size="sm" c="dimmed">
            {translatedLabel}
        </Text>
    );
}

export function BreadcrumbNav({ items, namespace = 'global' }: BreadcrumbNavProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <Breadcrumbs 
            separator={mounted ? <IconChevronRight size={14} /> : <span style={{ width: 14, height: 14, display: 'inline-block' }} />} 
            mt="xs"
            style={{ paddingLeft: '15px' }}
        >
            {items.map((item, index) => (
                <BreadcrumbItemComponent key={index} item={item} defaultNamespace={namespace} />
            ))}
        </Breadcrumbs>
    );
}
