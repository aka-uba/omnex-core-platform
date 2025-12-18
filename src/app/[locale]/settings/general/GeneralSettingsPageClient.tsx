'use client';

import { useState, useEffect } from 'react';
import { Container, Tabs, Paper, LoadingOverlay } from '@mantine/core';
import { IconWorld, IconMail, IconCalendar, IconShield } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { RegionTimeTab } from './components/RegionTimeTab';
import { EmailTab } from './components/EmailTab';
import { CalendarTab } from './components/CalendarTab';
import { SecurityTab } from './components/SecurityTab';

interface GeneralSettings {
    // Region and Time
    timezone?: string;
    dateFormat?: string;
    timeFormat?: string;
    weekStart?: string;
    currency?: string;
    defaultLanguage?: string;
    
    // Email (SMTP)
    smtpHost?: string;
    smtpPort?: number;
    smtpEncryption?: string;
    smtpUsername?: string;
    smtpPassword?: string;
    smtpFromName?: string;
    smtpFromEmail?: string;
    smtpTimeout?: number;
    smtpRetryAttempts?: number;
    smtpConnectionPool?: number;
    smtpEnabled?: boolean;
    
    // Calendar
    calendarIntegrations?: any;
    calendarDefaultView?: string;
    calendarShowWeekends?: boolean;
    calendarShowHolidays?: boolean;
    
    // Security
    sessionTimeout?: number;
    maxConcurrentSessions?: number;
    rememberMeDuration?: number;
    passwordMinLength?: number;
    passwordRequireUppercase?: boolean;
    passwordRequireLowercase?: boolean;
    passwordRequireNumbers?: boolean;
    passwordRequireSpecial?: boolean;
    passwordExpirationDays?: number | null;
    twoFactorEnabled?: boolean;
    twoFactorRequiredForAdmins?: boolean;
    twoFactorBackupCodes?: any;
    maxLoginAttempts?: number;
    lockoutDuration?: number;
    ipWhitelist?: string[];
    apiRateLimit?: number;
    apiKeyExpiration?: number | null;
}

export function GeneralSettingsPageClient({ locale }: { locale: string }) {
    const params = useParams();
    const currentLocale = (params?.locale as string) || locale || 'tr';
    const { t } = useTranslation('global');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<string | null>('region-time');
    const [settings, setSettings] = useState<GeneralSettings>({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetchWithAuth('/api/general-settings');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to fetch settings: ${response.status}`);
            }
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch settings');
            }

            if (result.success && result.data) {
                setSettings(result.data);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            showToast({
                type: 'error',
                title: t('error'),
                message: t('settings.general.loadError'),
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (updatedSettings: Partial<GeneralSettings>) => {
        setSaving(true);
        try {
            const response = await fetchWithAuth('/api/general-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...settings,
                    ...updatedSettings,
                }),
            });

            const result = await response.json();
            if (result.success) {
                setSettings({
                    ...settings,
                    ...updatedSettings,
                });
                showToast({
                    type: 'success',
                    title: t('success'),
                    message: t('settings.general.savedSuccessfully'),
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            showToast({
                type: 'error',
                title: t('error'),
                message: error instanceof Error ? error.message : t('settings.general.saveError'),
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Container size="xl" pt="xl">
            <CentralPageHeader
                title={t('settings.general.title')}
                description={t('settings.general.description')}
                namespace="global"
                icon={<IconShield size={32} />}
                breadcrumbs={[
                    { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
                    { label: 'navigation.settings', href: `/${currentLocale}/settings`, namespace: 'global' },
                    { label: 'settings.general.title', namespace: 'global' },
                ]}
            />

            <div style={{ position: 'relative' }}>
                <LoadingOverlay visible={loading} />
                <Paper shadow="sm" p="xl" withBorder mt="xl">
                    <Tabs value={activeTab} onChange={setActiveTab}>
                        <Tabs.List>
                            <Tabs.Tab value="region-time" leftSection={<IconWorld size={16} />}>
                                {t('settings.general.tabs.regionTime')}
                            </Tabs.Tab>
                            <Tabs.Tab value="email" leftSection={<IconMail size={16} />}>
                                {t('settings.general.tabs.email')}
                            </Tabs.Tab>
                            <Tabs.Tab value="calendar" leftSection={<IconCalendar size={16} />}>
                                {t('settings.general.tabs.calendar')}
                            </Tabs.Tab>
                            <Tabs.Tab value="security" leftSection={<IconShield size={16} />}>
                                {t('settings.general.tabs.security')}
                            </Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="region-time" pt="xl">
                            <RegionTimeTab
                                settings={settings}
                                onSave={handleSave}
                                saving={saving}
                            />
                        </Tabs.Panel>

                        <Tabs.Panel value="email" pt="xl">
                            <EmailTab
                                settings={settings}
                                onSave={handleSave}
                                saving={saving}
                            />
                        </Tabs.Panel>

                        <Tabs.Panel value="calendar" pt="xl">
                            <CalendarTab
                                settings={settings}
                                onSave={handleSave}
                                saving={saving}
                            />
                        </Tabs.Panel>

                        <Tabs.Panel value="security" pt="xl">
                            <SecurityTab
                                settings={settings}
                                onSave={handleSave}
                                saving={saving}
                            />
                        </Tabs.Panel>
                    </Tabs>
                </Paper>
            </div>
        </Container>
    );
}


