'use client';

import { useRef, useEffect, useState, cloneElement, isValidElement } from 'react';
import { Group, Title, Text, Button, Box, useMantineColorScheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useRouter } from 'next/navigation';
import { IconArrowLeft } from '@tabler/icons-react';
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
    isBackButton?: boolean; // Mark as back button to prevent duplicate
}

interface CentralPageHeaderProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    actions?: ActionButton[];
    namespace?: string; // Optional namespace for translations
    showBackButton?: boolean; // Show automatic back button
    backButtonLabel?: string; // Custom back button label
}

export function CentralPageHeader({
    title,
    description,
    icon,
    breadcrumbs,
    actions,
    namespace = 'global',
    showBackButton = true,
    backButtonLabel,
}: CentralPageHeaderProps) {
    const { t } = useTranslation(namespace);
    const { t: tGlobal } = useTranslation('global');
    const { colorScheme } = useMantineColorScheme();
    const [mounted, setMounted] = useState(false);
    const textContainerRef = useRef<HTMLDivElement>(null);
    const [iconHeight, setIconHeight] = useState<number | undefined>(undefined);
    const router = useRouter();
    const isMobile = useMediaQuery('(max-width: 768px)');

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
            // On mobile, cap the icon size to prevent layout issues
            const maxMobileIconSize = 28;
            setIconHeight(isMobile ? Math.min(height, maxMobileIconSize) : height);
        }
    }, [title, description, icon, isMobile]);

    // Handle back navigation
    const handleBack = () => {
        router.back();
    };

    // Filter out any existing back buttons from actions to prevent duplicates
    const filteredActions = actions?.filter(action => !action.isBackButton) || [];

    // Check if there's already a back button in the original actions
    const hasExistingBackButton = actions?.some(action => action.isBackButton);

    // Determine icon size for mobile
    const mobileIconSize = 24;
    const desktopIconSize = iconHeight || 32;
    const currentIconSize = isMobile ? mobileIconSize : desktopIconSize;

    return (
        <Box
            style={{
                backgroundColor: mounted && isDarkMode ? 'rgba(32, 33, 36, 0.8)' : 'var(--bg-primary)',
            }}
            {...(styles.centralPageHeader ? { className: styles.centralPageHeader } : {})}
        >
            {breadcrumbs && <BreadcrumbNav items={breadcrumbs} namespace={namespace} />}

            <Group
                justify="space-between"
                align="flex-start"
                mt="xs"
                wrap="nowrap"
                gap={isMobile ? 'xs' : 'md'}
            >
                <Group gap="sm" align="flex-start" style={{ flex: 1, minWidth: 0 }}>
                    {icon && (
                        <Box
                            c={mounted && isDarkMode ? "gray" : "blue"}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-end',
                                height: isMobile ? 'auto' : (iconHeight ? `${iconHeight}px` : 'auto'),
                                paddingLeft: '7px',
                                flexShrink: 0,
                            }}
                        >
                            <ClientIcon
                                fallback={
                                    <div style={{
                                        width: `${currentIconSize}px`,
                                        height: `${currentIconSize}px`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }} />
                                }
                            >
                                {isValidElement(icon) ? (
                                    cloneElement(icon as React.ReactElement<any>, {
                                        size: currentIconSize
                                    })
                                ) : (
                                    <div style={{
                                        width: `${currentIconSize}px`,
                                        height: `${currentIconSize}px`,
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
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-start',
                            minWidth: 0,
                            flex: 1,
                        }}
                    >
                        <Title order={isMobile ? 4 : 2} style={{ wordBreak: 'break-word' }}>
                            {translate(title)}
                        </Title>
                        {description && (
                            <Text c="dimmed" size="sm" maw={600} mt={4}>
                                {translate(description)}
                            </Text>
                        )}
                    </div>
                </Group>

                {/* Actions group - always horizontal */}
                {(showBackButton || filteredActions.length > 0) && (
                    <Group
                        gap="xs"
                        wrap="nowrap"
                        style={{ flexShrink: 0 }}
                    >
                        {/* Back button */}
                        {showBackButton && !hasExistingBackButton && (
                            <Button
                                leftSection={<IconArrowLeft size={18} />}
                                onClick={handleBack}
                                variant="subtle"
                                color={isDarkMode ? 'gray' : 'blue'}
                                size={isMobile ? 'xs' : 'md'}
                            >
                                {backButtonLabel || tGlobal('actions.back')}
                            </Button>
                        )}
                        {/* Other actions */}
                        {filteredActions.map((action, index) => (
                            <Button
                                key={index}
                                {...(action.icon ? { leftSection: action.icon } : {})}
                                {...(action.onClick ? { onClick: action.onClick } : {})}
                                variant={action.variant || 'filled'}
                                {...((action.color || (isDarkMode ? 'gray' : undefined)) ? { color: (action.color || (isDarkMode ? 'gray' : undefined))! } : {})}
                                size={isMobile ? 'xs' : 'md'}
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
