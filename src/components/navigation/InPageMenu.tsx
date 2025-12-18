'use client';

import React, { useEffect, useState } from 'react';
import {
    NavLink,
    Group,
    Text,
    Loader,
    Box,
    UnstyledButton,
} from '@mantine/core';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import * as TablerIcons from '@tabler/icons-react';

interface MenuItem {
    id: string;
    label: any;
    href: string;
    icon?: string;
    target?: string;
    cssClass?: string;
    children?: MenuItem[];
    visible: boolean;
}

interface InPageMenuProps {
    location?: string;
    menuId?: string;
    orientation?: 'vertical' | 'horizontal';
    variant?: 'default' | 'pills' | 'subtle' | 'filled';
    showIcons?: boolean;
    className?: string;
    locale?: string;
}

export function InPageMenu({
    location,
    menuId,
    orientation = 'vertical',
    variant = 'default',
    showIcons = true,
    className,
    locale = 'tr'
}: InPageMenuProps) {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();
    
    // Extract locale from pathname if not provided
    const currentLocale = pathname?.split('/')[1] || locale;
    
    // Helper to normalize href with locale prefix
    const getHref = (href: string) => {
        // If href already has locale prefix, return as is
        if (href.startsWith(`/${currentLocale}/`) || href.startsWith(`/${currentLocale}`)) {
            return href;
        }
        // Add locale prefix
        if (href.startsWith('/')) {
            return `/${currentLocale}${href}`;
        }
        return `/${currentLocale}/${href}`;
    };

    useEffect(() => {
        fetchMenu();
    }, [location, menuId]);

    const fetchMenu = async () => {
        setLoading(true);
        try {
            let url = '';
            if (menuId) {
                url = `/api/menus/${menuId}/items`;
            } else if (location) {
                url = `/api/menu-resolver/${location}`;
            } else {
                setLoading(false);
                return;
            }

            // Use fetchWithAuth for authenticated requests
            const { fetchWithAuth } = await import('@/lib/api/fetchWithAuth');
            const response = await fetchWithAuth(url);
            
            // If 401, silently fail (user not logged in or menu not configured)
            if (response.status === 401) {
                setLoading(false);
                return;
            }
            
            if (!response.ok) {
                throw new Error(`Failed to fetch menu: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                if (menuId) {
                    setMenuItems(result.data);
                } else if (result.data && result.data.menu) {
                    setMenuItems(result.data.menu.items);
                }
            }
        } catch (error) {
            console.error('Error fetching menu:', error);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (iconName?: string) => {
        if (!iconName || !showIcons) return null;
        // @ts-ignore
        const Icon = TablerIcons[iconName];
        return Icon ? <Icon size={16} stroke={1.5} /> : null;
    };

    const getLabel = (item: MenuItem) => {
        if (typeof item.label === 'string') return item.label;
        return item.label[currentLocale] || item.label['en'] || Object.values(item.label)[0];
    };

    const isActive = (href: string) => {
        const normalizedHref = getHref(href);
        return pathname === normalizedHref || pathname === href || pathname?.startsWith(`${normalizedHref}/`) || pathname?.startsWith(`${href}/`);
    };

    if (loading) {
        return <Loader size="sm" />;
    }

    if (!menuItems || menuItems.length === 0) {
        return null;
    }

    if (orientation === 'horizontal') {
        return (
            <Group gap={0} className={`in-page-menu-horizontal ${className || ''}`}>
                {menuItems.map((item, index) => (
                    <React.Fragment key={item.id}>
                        <Link
                            href={getHref(item.href)}
                            target={item.target}
                            style={{ textDecoration: 'none' }}
                        >
                            <UnstyledButton
                                p="xs"
                                className={`in-page-menu-item ${isActive(item.href) ? 'active' : ''}`}
                                style={(theme) => ({
                                    borderRadius: theme.radius.sm,
                                    backgroundColor: 'transparent',
                                    color: '#000000',
                                    '&:hover': {
                                        backgroundColor: 'transparent',
                                        opacity: 0.7,
                                    },
                                })}
                            >
                                <Text 
                                    size="sm" 
                                    fw={400} 
                                    className="in-page-menu-text"
                                    style={{
                                        fontSize: '14px',
                                        lineHeight: '1.5',
                                        color: '#000000',
                                    }}
                                >
                                    {getLabel(item)}
                                </Text>
                            </UnstyledButton>
                        </Link>
                        {index < menuItems.length - 1 && (
                            <Text 
                                size="sm" 
                                className="footer-menu-separator"
                                style={{ 
                                    color: '#000000',
                                    fontSize: '14px',
                                    padding: '0 8px',
                                }}
                            >
                                •
                            </Text>
                        )}
                    </React.Fragment>
                ))}
            </Group>
        );
    }

    // Vertical Layout
    const renderVerticalItems = (items: MenuItem[], depth = 0) => {
        return items.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const active = isActive(item.href);
            const label = getLabel(item);

            if (hasChildren) {
                return (
                    <NavLink
                        key={item.id}
                        label={label}
                        leftSection={getIcon(item.icon)}
                        childrenOffset={28}
                        defaultOpened={active}
                        active={active}
                        variant={variant === 'filled' ? 'filled' : 'light'}
                    >
                        {renderVerticalItems(item.children!, depth + 1)}
                    </NavLink>
                );
            }

            return (
                <NavLink
                    key={item.id}
                    component={Link}
                    href={getHref(item.href)}
                    target={item.target}
                    label={label}
                    leftSection={getIcon(item.icon)}
                    active={active}
                    variant={variant === 'filled' ? 'filled' : 'light'}
                />
            );
        });
    };

    return (
        <Box className={`in-page-menu-vertical ${className || ''}`}>
            {renderVerticalItems(menuItems)}
        </Box>
    );
}

export function VerticalPageMenu(props: Omit<InPageMenuProps, 'orientation'>) {
    return <InPageMenu {...props} orientation="vertical" />;
}

export function HorizontalPageMenu(props: Omit<InPageMenuProps, 'orientation'>) {
    return <InPageMenu {...props} orientation="horizontal" />;
}
