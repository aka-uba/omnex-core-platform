'use client';

import { useEffect, useState } from 'react';
import {
    Container,
    Stack,
    Text,
    Group,
    ActionIcon,
    Box,
    Flex,
    Avatar
} from '@mantine/core';
import {
    IconBrandFacebook,
    IconBrandTwitter,
    IconBrandLinkedin,
    IconBrandInstagram,
    IconPhone,
    IconMail,
    IconMapPin
} from '@tabler/icons-react';
import { InPageMenu } from './InPageMenu';

interface FooterSettings {
    companyName: string;
    companyNameMode: 'dynamic' | 'custom';
    logo: string;
    description: string;
    address: string;
    phone: string;
    email: string;
    socialLinks: { facebook: string; twitter: string; linkedin: string; instagram: string };
    showCopyright: boolean;
    copyrightText: string;
    primaryMenuId: string;
    isActive: boolean;
}

interface DynamicFooterProps {
    locale?: string;
}

export function DynamicFooter({ locale = 'tr' }: DynamicFooterProps) {
    const [settings, setSettings] = useState<FooterSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [footerMenuId, setFooterMenuId] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
        fetchFooterMenu();
        
        // Listen for footer settings updates
        const handleFooterUpdate = () => {
            fetchSettings();
            fetchFooterMenu();
        };
        
        // Listen for menu assignment updates
        const handleMenuUpdate = () => {
            fetchFooterMenu();
        };
        
        window.addEventListener('footerSettingsUpdated', handleFooterUpdate);
        window.addEventListener('menu-updated', handleMenuUpdate);
        
        return () => {
            window.removeEventListener('footerSettingsUpdated', handleFooterUpdate);
            window.removeEventListener('menu-updated', handleMenuUpdate);
        };
    }, []);

    const fetchSettings = async () => {
        try {
            // Use fetchWithAuth for authenticated requests
            const { fetchWithAuth } = await import('@/lib/api/fetchWithAuth');
            const response = await fetchWithAuth('/api/footer-customization');
            
            // If 401, silently fail (user not logged in or footer not configured)
            if (response.status === 401) {
                setLoading(false);
                return;
            }
            
            if (!response.ok) {
                throw new Error(`Failed to fetch footer settings: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.success && result.data && result.data.isActive) {
                setSettings(result.data);
            }
        } catch (error) {
            console.error('Error fetching footer settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFooterMenu = async () => {
        try {
            const { fetchWithAuth } = await import('@/lib/api/fetchWithAuth');
            
            // Use menu-resolver endpoint which handles priority correctly (user > role > branch > default)
            // This ensures we get the correct menu based on user context and assignment priority
            const response = await fetchWithAuth('/api/menu-resolver/footer');
            
            // If 401 or 404, silently fail (no menu assigned or user not logged in)
            if (response.status === 401 || response.status === 404) {
                setFooterMenuId(null);
                return;
            }
            
            if (!response.ok) {
                throw new Error(`Failed to fetch footer menu: ${response.status}`);
            }
            
            const result = await response.json();
            if (result.success && result.data && result.data.menu) {
                // Use the menu ID from the resolved menu (this respects priority: user > role > branch > default)
                setFooterMenuId(result.data.menu.id);
            } else {
                setFooterMenuId(null);
            }
        } catch (error) {
            console.error('Error fetching footer menu:', error);
            setFooterMenuId(null);
        }
    };

    if (loading || !settings) return null;

    // Helper to convert old format (object) to new format (string)
    const getStringValue = (value: any): string => {
        if (typeof value === 'string') return value;
        if (value && typeof value === 'object') {
            // For backward compatibility, get current locale or fallback to tr
            return value[locale] || value['tr'] || value['en'] || Object.values(value)[0] || '';
        }
        return '';
    };

    // getLocalizedText removed - unused

    const currentYear = new Date().getFullYear();
    
    // Get company name - API already handles dynamic mode
    const companyName = settings.companyName || '';
    const address = getStringValue(settings.address);
    
    // Copyright text - handle both string and object formats
    const copyrightText = getStringValue(settings.copyrightText);
    // If copyrightText is provided, replace only "All rights reserved" part
    // Otherwise use default format
    let copyright: string;
    if (copyrightText && copyrightText.trim()) {
        // Custom text replaces only "All rights reserved" part
        // Default format: "© {year} {company}. All rights reserved."
        // Custom format: "© {year} {company}. {customText}"
        // Replace placeholders in custom text ({year}, {company})
        const customText = copyrightText.trim()
            .replace(/{year}/g, currentYear.toString())
            .replace(/{company}/g, companyName || '');
        
        const defaultPrefix = companyName 
            ? `© ${currentYear} ${companyName}. `
            : `© ${currentYear}. `;
        copyright = defaultPrefix + customText;
    } else {
        // Default format - year is always dynamic
        copyright = companyName 
            ? `© ${currentYear} ${companyName}. All rights reserved.`
            : `© ${currentYear}. All rights reserved.`;
    }

    // Check if there are any social links
    const hasSocialLinks = settings.socialLinks && (
        settings.socialLinks.facebook || 
        settings.socialLinks.twitter || 
        settings.socialLinks.linkedin || 
        settings.socialLinks.instagram
    );

    return (
        <Box
            component="footer"
            className="dynamic-footer"
            style={{
                backgroundColor: 'var(--bg-card)',
                borderTop: '1px solid var(--border-color)',
            }}
        >
            <Container 
                size="xl"
                className="dynamic-footer-container"
                style={{ 
                    paddingInlineStart: '10px', 
                    paddingInlineEnd: '30px', 
                    paddingTop: 'inherit', 
                    paddingBottom: 'inherit',
                    maxWidth: '100%',
                    overflow: 'hidden',
                }}
            >
                <Stack gap="sm" style={{ padding: 0, margin: 0, width: '100%' }}>
                    {/* İlk Satır: Logo, Copyright, Menü */}
                    <Flex
                        direction="row"
                        gap="md"
                        align="center"
                        justify={{ base: 'center', md: 'space-between' }}
                        wrap="wrap"
                        style={{ padding: 0, margin: 0, width: '100%', rowGap: '8px' }}
                    >
                        {/* Logo ve Copyright - En Sol */}
                        <Flex direction="row" gap="md" align="center" justify={{ base: 'center', md: 'flex-start' }} style={{ flex: '0 0 auto', flexWrap: 'wrap', rowGap: '8px' }}>
                            {settings.logo && (
                                <Avatar 
                                    src={settings.logo} 
                                    alt={companyName || 'Logo'} 
                                    size={32}
                                    radius={0}
                                    style={{ 
                                        flexShrink: 0,
                                        border: '1px solid var(--border-color)',
                                        width: '32px',
                                        height: '32px',
                                    }}
                                    className="footer-logo"
                                />
                            )}
                            {settings.showCopyright && (
                                <Text 
                                    size="sm" 
                                    c="dimmed" 
                                    className="footer-text"
                                    style={{ 
                                        whiteSpace: 'nowrap',
                                        fontSize: '14px',
                                        lineHeight: '1.5',
                                    }}
                                >
                                    {copyright}
                                </Text>
                            )}
                        </Flex>

                        {/* Menüler - Sağ */}
                        {footerMenuId && (
                            <Flex 
                                gap="xl" 
                                align="center" 
                                justify={{ base: 'center', md: 'flex-end' }}
                                style={{ flex: '0 0 auto', flexShrink: 0 }}
                                direction="row"
                                wrap="wrap"
                            >
                                <InPageMenu
                                    menuId={footerMenuId}
                                    orientation="horizontal"
                                    variant="subtle"
                                    showIcons={false}
                                    locale={locale}
                                />
                            </Flex>
                        )}
                    </Flex>

                    {/* İkinci Satır: Adres (Sol), Telefon, Email, Sosyal Medya (Sağ) */}
                    {(address || settings.phone || settings.email || hasSocialLinks) && (
                        <Flex
                            direction="row"
                            gap="md"
                            align="center"
                            justify={{ base: 'center', lg: 'space-between' }}
                            wrap="wrap"
                            style={{ padding: 0, margin: 0, width: '100%', rowGap: '8px' }}
                        >
                            {/* Adres - Sol */}
                            {address && (
                                <Flex
                                    direction="row"
                                    gap="xs"
                                    align="center"
                                    justify={{ base: 'center', lg: 'flex-start' }}
                                    className="footer-address-container"
                                    style={{ minWidth: '200px', maxWidth: '100%' }}
                                >
                                    <IconMapPin 
                                        size={16} 
                                        className="footer-icon"
                                        style={{ 
                                            flexShrink: 0,
                                        }}
                                    />
                                    <Text 
                                        size="sm" 
                                        c="dimmed" 
                                        className="footer-text footer-address-text"
                                        style={{ 
                                            whiteSpace: 'normal',
                                            wordBreak: 'break-word',
                                            fontSize: '14px',
                                            lineHeight: '1.5',
                                            textAlign: 'center',
                                        }}
                                    >
                                        {address}
                                    </Text>
                                </Flex>
                            )}

                            {/* Telefon, Email ve Sosyal Medya - Sağ */}
                            <Flex 
                                direction="row" 
                                gap="sm" 
                                align="center" 
                                justify={{ base: 'center', md: 'flex-end' }}
                                style={{ flex: '0 0 auto', flexWrap: 'wrap', rowGap: '8px' }}
                            >
                                {settings.phone && (
                                    <Group gap="xs" wrap="nowrap">
                                        <IconPhone 
                                            size={16} 
                                            className="footer-icon"
                                            style={{ 
                                                flexShrink: 0,
                                            }}
                                        />
                                        <Text 
                                            size="sm" 
                                            c="dimmed" 
                                            component="a"
                                            href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`}
                                            className="footer-link"
                                            style={{ 
                                                whiteSpace: 'nowrap', 
                                                textDecoration: 'none', 
                                                fontSize: '14px',
                                                lineHeight: '1.5',
                                            }}
                                        >
                                            {settings.phone}
                                        </Text>
                                    </Group>
                                )}
                                {settings.email && (
                                    <Group gap="xs" wrap="nowrap">
                                        <IconMail 
                                            size={16} 
                                            className="footer-icon"
                                            style={{ 
                                                flexShrink: 0,
                                            }}
                                        />
                                        <Text 
                                            size="sm" 
                                            c="dimmed" 
                                            component="a"
                                            href={`mailto:${settings.email}`}
                                            className="footer-link"
                                            style={{ 
                                                whiteSpace: 'nowrap', 
                                                textDecoration: 'none', 
                                                fontSize: '14px',
                                                lineHeight: '1.5',
                                            }}
                                        >
                                            {settings.email}
                                        </Text>
                                    </Group>
                                )}
                                {/* Social Media Links */}
                                {hasSocialLinks && (
                                    <Flex direction="row" gap="xs" align="center" style={{ marginInlineStart: '16px', paddingInlineStart: 0, flexWrap: 'wrap', rowGap: '4px' }}>
                                        {settings.socialLinks.facebook && (
                                            <ActionIcon 
                                                component="a" 
                                                href={settings.socialLinks.facebook} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                variant="subtle"
                                                size="sm"
                                                style={{ 
                                                    marginInlineStart: 0, 
                                                    padding: 0,
                                                    width: '32px',
                                                    height: '32px',
                                                }}
                                            >
                                                <IconBrandFacebook size={16} />
                                            </ActionIcon>
                                        )}
                                        {settings.socialLinks.twitter && (
                                            <ActionIcon 
                                                component="a" 
                                                href={settings.socialLinks.twitter} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                variant="subtle"
                                                size="sm"
                                                style={{ 
                                                    marginInlineStart: 0, 
                                                    padding: 0,
                                                    width: '32px',
                                                    height: '32px',
                                                }}
                                            >
                                                <IconBrandTwitter size={16} />
                                            </ActionIcon>
                                        )}
                                        {settings.socialLinks.linkedin && (
                                            <ActionIcon 
                                                component="a" 
                                                href={settings.socialLinks.linkedin} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                variant="subtle"
                                                size="sm"
                                                style={{ 
                                                    marginInlineStart: 0, 
                                                    padding: 0,
                                                    width: '32px',
                                                    height: '32px',
                                                }}
                                            >
                                                <IconBrandLinkedin size={16} />
                                            </ActionIcon>
                                        )}
                                        {settings.socialLinks.instagram && (
                                            <ActionIcon 
                                                component="a" 
                                                href={settings.socialLinks.instagram} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                variant="subtle"
                                                size="sm"
                                                style={{ 
                                                    marginInlineStart: 0, 
                                                    padding: 0,
                                                    width: '32px',
                                                    height: '32px',
                                                }}
                                            >
                                                <IconBrandInstagram size={16} />
                                            </ActionIcon>
                                        )}
                                    </Flex>
                                )}
                            </Flex>
                        </Flex>
                    )}
                </Stack>
            </Container>
        </Box>
    );
}
