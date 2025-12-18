'use client';

import { useState, useEffect } from 'react';
import { Container, Tabs, LoadingOverlay } from '@mantine/core';
import { IconMail, IconBell, IconDeviceMobile, IconSettings, IconApps } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { EmailNotificationsTab } from './components/EmailNotificationsTab';
import { PushNotificationsTab } from './components/PushNotificationsTab';
import { SMSNotificationsTab } from './components/SMSNotificationsTab';
import { PreferencesTab } from './components/PreferencesTab';
import { ModuleNotificationsTab } from './components/ModuleNotificationsTab';

interface NotificationSettings {
    // Email
    emailEnabled?: boolean;
    emailSystemNotifications?: boolean;
    emailUserNotifications?: boolean;
    emailModuleNotifications?: any;
    
    // Push
    pushEnabled?: boolean;
    pushBrowserEnabled?: boolean;
    pushMobileEnabled?: boolean;
    pushSystemNotifications?: boolean;
    pushUserNotifications?: boolean;
    pushModuleNotifications?: any;
    
    // SMS
    smsEnabled?: boolean;
    smsProvider?: string | null;
    smsApiKey?: string | null;
    smsApiSecret?: string | null;
    smsFromNumber?: string | null;
    smsSystemNotifications?: boolean;
    smsUserNotifications?: boolean;
    smsModuleNotifications?: any;
    
    // Preferences
    reminderTime?: number;
    quietHoursStart?: string | null;
    quietHoursEnd?: string | null;
    notificationSound?: boolean;
    notificationSoundFile?: string | null;
    
    // Module Settings
    moduleSettings?: any;
}

export function NotificationSettingsPageClient() {
    const params = useParams();
    const locale = (params?.locale as string) || 'tr';
    const { t } = useTranslation('global');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<string | null>('email');
    const [settings, setSettings] = useState<NotificationSettings>({});
    const [modules, setModules] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch notification settings
            const settingsResponse = await fetchWithAuth('/api/notification-settings');
            if (!settingsResponse.ok) {
                throw new Error('Failed to fetch notification settings');
            }
            const settingsResult = await settingsResponse.json();
            if (settingsResult.success && settingsResult.data) {
                const parsedData = {
                    ...settingsResult.data,
                    emailModuleNotifications: typeof settingsResult.data.emailModuleNotifications === 'string'
                        ? JSON.parse(settingsResult.data.emailModuleNotifications)
                        : settingsResult.data.emailModuleNotifications,
                    pushModuleNotifications: typeof settingsResult.data.pushModuleNotifications === 'string'
                        ? JSON.parse(settingsResult.data.pushModuleNotifications)
                        : settingsResult.data.pushModuleNotifications,
                    smsModuleNotifications: typeof settingsResult.data.smsModuleNotifications === 'string'
                        ? JSON.parse(settingsResult.data.smsModuleNotifications)
                        : settingsResult.data.smsModuleNotifications,
                    moduleSettings: typeof settingsResult.data.moduleSettings === 'string'
                        ? JSON.parse(settingsResult.data.moduleSettings)
                        : settingsResult.data.moduleSettings,
                };
                setSettings(parsedData);
            }

            // Fetch modules with notification settings
            const modulesResponse = await fetchWithAuth('/api/modules/notification-settings');
            if (modulesResponse.ok) {
                const modulesResult = await modulesResponse.json();
                if (modulesResult.success && modulesResult.data) {
                    setModules(modulesResult.data);
                }
            }
        } catch (error) {
            console.error('Error fetching notification settings:', error);
            showToast({
                type: 'error',
                title: t('common.error'),
                message: t('settings.notifications.loadError'),
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async (updatedFields: any) => {
        setSaving(true);
        try {
            const payload = {
                ...settings,
                ...updatedFields,
            };

            const response = await fetchWithAuth('/api/notification-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to save notification settings');
            }

            const result = await response.json();
            if (result.success) {
                setSettings(result.data);
                showToast({
                    type: 'success',
                    title: t('common.success'),
                    message: t('settings.notifications.savedSuccessfully'),
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error saving notification settings:', error);
            showToast({
                type: 'error',
                title: t('common.error'),
                message: error instanceof Error ? error.message : t('settings.notifications.saveError'),
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Container size="xl" className="notification-settings-container">
            <CentralPageHeader
                title={t('settings.notifications.title')}
                description={t('settings.notifications.description')}
                namespace="global"
                icon={<IconBell size={32} />}
                breadcrumbs={[
                    { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
                    { label: 'navigation.settings', href: `/${locale}/settings`, namespace: 'global' },
                    { label: t('settings.notifications.title'), namespace: 'global' },
                ]}
            />

            <div style={{ position: 'relative', marginTop: 'var(--mantine-spacing-xl)' }}>
                <LoadingOverlay visible={loading} />
                <Tabs value={activeTab} onChange={setActiveTab}>
                    <Tabs.List>
                        <Tabs.Tab value="email" leftSection={<IconMail size={16} />}>
                            {t('settings.notifications.email.tabTitle')}
                        </Tabs.Tab>
                        <Tabs.Tab value="push" leftSection={<IconBell size={16} />}>
                            {t('settings.notifications.push.tabTitle')}
                        </Tabs.Tab>
                        <Tabs.Tab value="sms" leftSection={<IconDeviceMobile size={16} />}>
                            {t('settings.notifications.sms.tabTitle')}
                        </Tabs.Tab>
                        <Tabs.Tab value="preferences" leftSection={<IconSettings size={16} />}>
                            {t('settings.notifications.preferences.tabTitle')}
                        </Tabs.Tab>
                        <Tabs.Tab value="modules" leftSection={<IconApps size={16} />}>
                            {t('settings.notifications.modules.tabTitle')}
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="email" pt="xl">
                        <EmailNotificationsTab 
                            settings={settings} 
                            onSave={handleSaveSettings} 
                            saving={saving} 
                        />
                    </Tabs.Panel>

                    <Tabs.Panel value="push" pt="xl">
                        <PushNotificationsTab 
                            settings={settings} 
                            onSave={handleSaveSettings} 
                            saving={saving} 
                        />
                    </Tabs.Panel>

                    <Tabs.Panel value="sms" pt="xl">
                        <SMSNotificationsTab 
                            settings={settings} 
                            onSave={handleSaveSettings} 
                            saving={saving} 
                        />
                    </Tabs.Panel>

                    <Tabs.Panel value="preferences" pt="xl">
                        <PreferencesTab 
                            settings={settings} 
                            onSave={handleSaveSettings} 
                            saving={saving} 
                        />
                    </Tabs.Panel>

                    <Tabs.Panel value="modules" pt="xl">
                        <ModuleNotificationsTab 
                            settings={settings} 
                            modules={modules}
                            onSave={handleSaveSettings} 
                            saving={saving} 
                        />
                    </Tabs.Panel>
                </Tabs>
            </div>
        </Container>
    );
}

