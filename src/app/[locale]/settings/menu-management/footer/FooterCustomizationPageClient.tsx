'use client';
import { useState, useEffect } from 'react';
import { Container, Title, Text, Paper, Stack, Group, TextInput, Textarea, Switch, Select, Button, Grid, LoadingOverlay, Divider } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from '@/lib/i18n/client';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { IconDeviceFloppy, IconBrandFacebook, IconBrandTwitter, IconBrandLinkedin, IconBrandInstagram } from '@tabler/icons-react';
import { ClientIcon } from '@/components/common/ClientIcon';

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

export function FooterCustomizationPageClient() {
    const { t } = useTranslation('modules/menu-management');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [assignedMenu, setAssignedMenu] = useState<{ id: string; name: string; slug: string } | null>(null);
    // footerLocationId removed - unused

    const form = useForm<FooterSettings>({
        initialValues: {
            companyName: '',
            companyNameMode: 'dynamic',
            logo: '',
            description: '',
            address: '',
            phone: '',
            email: '',
            socialLinks: { facebook: '', twitter: '', linkedin: '', instagram: '' },
            showCopyright: true,
            copyrightText: '',
            primaryMenuId: '', // Deprecated - kept for backward compatibility
            isActive: true,
        },
    });

    useEffect(() => {
        let isMounted = true;
        
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch footer location and assigned menu (read-only, menu assignment is done from menu management page)
                try {
                    const locationsRes = await fetchWithAuth('/api/menu-locations');
                    if (locationsRes.ok) {
                        const locationsData = await locationsRes.json();
                        if (locationsData.success && locationsData.data) {
                            // Find footer location
                            const footerLocation = locationsData.data.find((loc: any) => loc.name === 'footer');
                            if (footerLocation) {
                                // footerLocationId removed - unused, menu assignment is done from menu management page
                                
                                if (footerLocation.assignments && footerLocation.assignments.length > 0) {
                                    // Get the first active assignment (priority order)
                                    // Sort by priority (lower number = higher priority)
                                    const sortedAssignments = [...footerLocation.assignments].sort((a: any, b: any) => (a.priority || 0) - (b.priority || 0));
                                    const assignment = sortedAssignments.find((a: any) => a.isActive) || sortedAssignments[0];
                                    if (assignment && assignment.menu && isMounted) {
                                        setAssignedMenu(assignment.menu);
                                    }
                                }
                            }
                        }
                    }
                } catch (locationError) {
                    console.warn('Failed to fetch footer location, continuing without menu info:', locationError);
                }

                // Fetch footer settings
                const footerRes = await fetchWithAuth('/api/footer-customization');
                if (!footerRes.ok) {
                    const errorData = await footerRes.json().catch(() => ({}));
                    throw new Error(errorData.error || `Failed to fetch footer settings: ${footerRes.status}`);
                }
                const footerData = await footerRes.json();

                if (!footerData.success) {
                    throw new Error(footerData.error || 'Failed to fetch footer settings');
                }

                if (!isMounted) return;

                if (footerData.success && footerData.data) {
                    const data = footerData.data;
                    // Convert old format (object) to new format (string) if needed
                    const getStringValue = (value: any): string => {
                        if (typeof value === 'string') return value;
                        if (value && typeof value === 'object') {
                            // Get current locale value or fallback to tr or en
                            const currentLocale = window.location.pathname.split('/')[1] || 'tr';
                            return value[currentLocale] || value['tr'] || value['en'] || '';
                        }
                        return '';
                    };
                    
                    form.setValues({
                        companyName: data.companyName || '',
                        companyNameMode: data.companyNameMode || 'dynamic',
                        logo: data.logo || '',
                        description: getStringValue(data.description),
                        address: getStringValue(data.address),
                        phone: data.phone || '',
                        email: data.email || '',
                        socialLinks: data.socialLinks || { facebook: '', twitter: '', linkedin: '', instagram: '' },
                        showCopyright: data.showCopyright !== undefined ? data.showCopyright : true,
                        copyrightText: getStringValue(data.copyrightText),
                        primaryMenuId: data.primaryMenuId || '',
                        isActive: data.isActive !== undefined ? data.isActive : true,
                    });
                } else if (footerData.success && !footerData.data) {
                    // If no data but success, use defaults
                    form.setValues({
                        companyName: '',
                        companyNameMode: 'dynamic',
                        logo: '',
                        description: '',
                        address: '',
                        phone: '',
                        email: '',
                        socialLinks: { facebook: '', twitter: '', linkedin: '', instagram: '' },
                        showCopyright: true,
                        copyrightText: '',
                        primaryMenuId: '',
                        isActive: true,
                    });
                }
            } catch (error) {
                if (!isMounted) return;
                console.error('Error fetching data:', error);
                showToast({
                    type: 'error',
                    title: t('error'),
                    message: t('footer.loadError'),
                });
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        
        fetchData();
        
        // Listen for menu assignment updates from menu management page
        const handleMenuUpdate = () => {
            if (isMounted) {
                fetchData();
            }
        };
        
        window.addEventListener('menu-updated', handleMenuUpdate);
        
        return () => {
            isMounted = false;
            window.removeEventListener('menu-updated', handleMenuUpdate);
        };
    }, []); // Empty dependency array - only run once on mount

    const handleSubmit = async (values: FooterSettings) => {
        setSaving(true);
        try {
            // Remove primaryMenuId from submission - menu is now managed via Menu Management
            const { primaryMenuId, ...submitValues } = values;
            const response = await fetchWithAuth('/api/footer-customization', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitValues),
            });
            const result = await response.json();
            if (result.success) {
                // Dispatch custom event to refresh footer
                window.dispatchEvent(new CustomEvent('footerSettingsUpdated'));
                
                showToast({
                    type: 'success',
                    title: t('success'),
                    message: t('footer.savedSuccessfully'),
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            showToast({
                type: 'error',
                title: t('error'),
                message: error instanceof Error ? error.message : t('footer.saveError'),
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Container 
            size="xl" 
            className="footer-customization-container"
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Group justify="space-between" mb="lg">
                    <div>
                        <Title order={2}>{t('footer.title')}</Title>
                        <Text c="dimmed">{t('footer.description')}</Text>
                    </div>
                    <Button 
                        leftSection={
                            <ClientIcon>
                                <IconDeviceFloppy size={16} />
                            </ClientIcon>
                        } 
                        type="submit" 
                        loading={saving}
                    >
                        {t('save')}
                    </Button>
                </Group>
                <div style={{ position: 'relative' }}>
                    <LoadingOverlay visible={loading} />
                    <Grid>
                        <Grid.Col span={{ base: 12, md: 8 }}>
                            <Stack gap="lg">
                                <Paper p="md" withBorder>
                                    <Title order={5} mb="md">{t('footer.companyInformation')}</Title>
                                    <Stack>
                                        <Group grow>
                                            <Select
                                                label={t('footer.companyNameMode')}
                                                data={[
                                                    { value: 'dynamic', label: t('footer.companyNameModeDynamic') }, 
                                                    { value: 'custom', label: t('footer.companyNameModeCustom') }
                                                ]}
                                                value={form.values.companyNameMode}
                                                onChange={(value) => form.setFieldValue('companyNameMode', value as 'dynamic' | 'custom')}
                                            />
                                            {form.values.companyNameMode === 'custom' && (
                                                <TextInput 
                                                    label={t('footer.companyName')} 
                                                    value={form.values.companyName}
                                                    onChange={(e) => form.setFieldValue('companyName', e.currentTarget.value)}
                                                    autoComplete="organization"
                                                />
                                            )}
                                        </Group>
                                        <TextInput 
                                            label={t('footer.logoUrl')} 
                                            placeholder={t('footer.logoUrlPlaceholder')} 
                                            value={form.values.logo}
                                            onChange={(e) => form.setFieldValue('logo', e.currentTarget.value)}
                                            autoComplete="url"
                                        />
                                    </Stack>
                                </Paper>
                                <Paper p="md" withBorder>
                                    <Title order={5} mb="md">{t('footer.contactInformation')}</Title>
                                    <Stack>
                                        <Group grow>
                                            <TextInput 
                                                label={t('footer.phone')} 
                                                value={form.values.phone}
                                                onChange={(e) => form.setFieldValue('phone', e.currentTarget.value)}
                                                autoComplete="tel"
                                                type="tel"
                                                placeholder="+90 555 123 4567"
                                            />
                                            <TextInput 
                                                label={t('footer.email')} 
                                                value={form.values.email}
                                                onChange={(e) => form.setFieldValue('email', e.currentTarget.value)}
                                                autoComplete="email"
                                                type="email"
                                                name="email"
                                            />
                                        </Group>
                                        <Textarea 
                                            label={t('footer.address')} 
                                            autosize 
                                            minRows={2} 
                                            value={form.values.address}
                                            onChange={(e) => form.setFieldValue('address', e.currentTarget.value)}
                                            autoComplete="street-address"
                                        />
                                    </Stack>
                                </Paper>
                                <Paper p="md" withBorder>
                                    <Title order={5} mb="md">{t('footer.socialMedia')}</Title>
                                    <Stack>
                                        <TextInput 
                                            label={t('footer.facebook')} 
                                            leftSection={
                                                <ClientIcon>
                                                    <IconBrandFacebook size={16} />
                                                </ClientIcon>
                                            } 
                                            value={form.values.socialLinks.facebook}
                                            onChange={(e) => form.setFieldValue('socialLinks.facebook', e.currentTarget.value)}
                                            autoComplete="url"
                                            type="url"
                                        />
                                        <TextInput 
                                            label={t('footer.twitter')} 
                                            leftSection={
                                                <ClientIcon>
                                                    <IconBrandTwitter size={16} />
                                                </ClientIcon>
                                            } 
                                            value={form.values.socialLinks.twitter}
                                            onChange={(e) => form.setFieldValue('socialLinks.twitter', e.currentTarget.value)}
                                            autoComplete="url"
                                            type="url"
                                        />
                                        <TextInput 
                                            label={t('footer.linkedin')} 
                                            leftSection={
                                                <ClientIcon>
                                                    <IconBrandLinkedin size={16} />
                                                </ClientIcon>
                                            } 
                                            value={form.values.socialLinks.linkedin}
                                            onChange={(e) => form.setFieldValue('socialLinks.linkedin', e.currentTarget.value)}
                                            autoComplete="url"
                                            type="url"
                                        />
                                        <TextInput 
                                            label={t('footer.instagram')} 
                                            leftSection={
                                                <ClientIcon>
                                                    <IconBrandInstagram size={16} />
                                                </ClientIcon>
                                            } 
                                            value={form.values.socialLinks.instagram}
                                            onChange={(e) => form.setFieldValue('socialLinks.instagram', e.currentTarget.value)}
                                            autoComplete="url"
                                            type="url"
                                        />
                                    </Stack>
                                </Paper>
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <Stack gap="lg">
                                <Paper p="md" withBorder>
                                    <Title order={5} mb="md">{t('footer.layoutMenus')}</Title>
                                    <Stack>
                                        <Switch 
                                            label={t('footer.enableFooter')} 
                                            checked={form.values.isActive}
                                            onChange={(e) => form.setFieldValue('isActive', e.currentTarget.checked)}
                                        />
                                        <Divider label={t('footer.menus')} labelPosition="center" />
                                        {assignedMenu ? (
                                            <Stack gap="xs">
                                                <Text size="sm" fw={500}>{t('footer.assignedMenu')}</Text>
                                                <Text size="sm" c="dimmed">{assignedMenu.name}</Text>
                                                <Text size="xs" c="dimmed" mt="xs">
                                                    {t('footer.menuAssignedFromMenuManagement')}
                                                </Text>
                                            </Stack>
                                        ) : (
                                            <Stack gap="xs">
                                                <Text size="sm" c="dimmed">{t('footer.noMenuAssigned')}</Text>
                                                <Text size="xs" c="dimmed">
                                                    {t('footer.assignMenuFromMenuManagement')}
                                                </Text>
                                            </Stack>
                                        )}
                                    </Stack>
                                </Paper>
                                <Paper p="md" withBorder>
                                    <Title order={5} mb="md">{t('footer.copyright')}</Title>
                                    <Stack>
                                        <Switch 
                                            label={t('footer.showCopyright')} 
                                            checked={form.values.showCopyright}
                                            onChange={(e) => form.setFieldValue('showCopyright', e.currentTarget.checked)}
                                        />
                                        {form.values.showCopyright && (
                                            <Textarea 
                                                label={t('footer.copyrightText')} 
                                                autosize 
                                                minRows={2} 
                                                value={form.values.copyrightText}
                                                onChange={(e) => form.setFieldValue('copyrightText', e.currentTarget.value)}
                                            />
                                        )}
                                    </Stack>
                                </Paper>
                            </Stack>
                        </Grid.Col>
                    </Grid>
                </div>
            </form>
        </Container>
    );
}

