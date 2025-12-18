'use client';

import { useRef, useEffect, useState, cloneElement, isValidElement } from 'react';
import { Group, Title, Text, Button, Box, useMantineColorScheme } from '@mantine/core';
import { BreadcrumbNav, BreadcrumbItem } from './BreadcrumbNav';
import { useTranslation } from '@/lib/i18n/client';
import { ClientIcon } from '@/components/common/ClientIcon';
import styles from './CentralPageHeader.module.css';

export interface ActionButton {
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    href?: string; // Support link buttons
    variant?: string;
    color?: string;
}

interface CentralPageHeaderProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    actions?: ActionButton[];
    namespace?: string; // Optional namespace for translations
}

export function CentralPageHeader({
    title,
    description,
    icon,
    breadcrumbs,
    actions,
    namespace = 'global',
}: CentralPageHeaderProps) {
    const { t } = useTranslation(namespace);
    const { colorScheme } = useMantineColorScheme();
    const [mounted, setMounted] = useState(false);
    const textContainerRef = useRef<HTMLDivElement>(null);
    const [iconHeight, setIconHeight] = useState<number | undefined>(undefined);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    const isDarkMode = mounted && colorScheme === 'dark';

    // Helper function to translate keys
    const translate = (key: string): string => {
        if (!key) return '';
        // Always try to translate the key first
        const translated = t(key);
        // If translation returns the same key, it means translation not found
        // Return the key as-is in that case (for direct text)
        return translated !== key ? translated : key;
    };

    // Calculate icon height based on title + description height
    useEffect(() => {
        if (textContainerRef.current && icon) {
            const height = textContainerRef.current.offsetHeight;
            setIconHeight(height);
        }
    }, [title, description, icon]);

    return (
        <Box
            style={{
                backgroundColor: mounted && isDarkMode ? 'rgba(32, 33, 36, 0.8)' : 'var(--bg-primary)',
            }}
            {...(styles.centralPageHeader ? { className: styles.centralPageHeader } : {})}
        >
            {breadcrumbs && <BreadcrumbNav items={breadcrumbs} namespace={namespace} />}

            <Group justify="space-between" align="flex-start" mt="xs">
                <Group gap="sm" align="flex-start">
                    {icon && (
                        <Box 
                            c={mounted && isDarkMode ? "gray" : "blue"} 
                            style={{ 
                                display: 'flex', 
                                alignItems: 'flex-end',
                                height: iconHeight ? `${iconHeight}px` : 'auto',
                                paddingLeft: '7px'
                            }}
                        >
                            <ClientIcon
                                fallback={
                                    <div style={{ 
                                        width: iconHeight ? `${iconHeight}px` : '32px',
                                        height: iconHeight ? `${iconHeight}px` : '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }} />
                                }
                            >
                                {isValidElement(icon) && iconHeight ? (
                                    cloneElement(icon as React.ReactElement<any>, {
                                        size: iconHeight
                                    })
                                ) : (
                                    <div style={{ 
                                        width: iconHeight ? `${iconHeight}px` : 'auto',
                                        height: iconHeight ? `${iconHeight}px` : 'auto',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {icon}
                                    </div>
                                )}
                            </ClientIcon>
                        </Box>
                    )}
                    <div 
                        ref={textContainerRef}
                        style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}
                    >
                        <Title order={2}>{translate(title)}</Title>
                        {description && (
                            <Text c="dimmed" size="sm" maw={600} mt={4}>
                                {translate(description)}
                            </Text>
                        )}
                    </div>
                </Group>

                {actions && Array.isArray(actions) && actions.length > 0 && (
                    <Group>
                        {actions.map((action, index) => (
                            <Button
                                key={index}
                                {...(action.icon ? { leftSection: action.icon } : {})}
                                {...(action.onClick ? { onClick: action.onClick } : {})}
                                variant={action.variant || 'filled'}
                                {...((action.color || (isDarkMode ? 'gray' : undefined)) ? { color: (action.color || (isDarkMode ? 'gray' : undefined))! } : {})}
                            // Handle link if href is present (requires component={Link} logic if using Next.js Link)
                            >
                                {translate(action.label)}
                            </Button>
                        ))}
                    </Group>
                )}
            </Group>
        </Box>
    );
}
