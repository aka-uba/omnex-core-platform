'use client';

import {
  Container,
  Tabs,
  Paper,
  Group,
  Text,
  Stack,
  Badge,
  Box,
  Title,
  Accordion,
  Divider,
  Switch,
  TextInput,
  NumberInput,
  Select,
  ColorPicker,
  ActionIcon,
  Button,
  Tooltip,
  Collapse,
  FileButton,
  Image,
  Loader,
  Alert,
} from '@mantine/core';
import {
  IconInfoCircle,
  IconSettings,
  IconMenu2,
  IconChevronDown,
  IconChevronUp,
  IconGripVertical,
  IconEye,
  IconEyeOff,
  IconArrowRight,
  IconArrowDown,
  IconPlus,
  IconTrash,
  IconUpload,
  IconRefresh,
  IconDatabase,
  IconAlertCircle,
} from '@tabler/icons-react';
import { DemoDataTab } from './DemoDataTab';
import { ClientIcon } from '@/components/common/ClientIcon';
import { ModuleIcon } from '@/lib/modules/icon-loader';
import { IconPicker } from '@/components/common/IconPicker';
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useTranslation } from '@/lib/i18n/client';
import { useNotification } from '@/hooks/useNotification';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';
import type { ModuleRecord } from '@/lib/modules/types';

interface ModuleSettingsPageProps {
  module: ModuleRecord;
}

interface VersionInfo {
  version: string;
  date: string;
  changes: string[];
}

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  path: string;
  order: number;
  visible: boolean;
  target: '_self' | '_blank';
  children?: MenuItem[];
  level: number;
  parentId?: string; // For hierarchical structure
}

interface ModuleSetting {
  key: string;
  label: string;
  description: string;
  type: 'boolean' | 'text' | 'number' | 'select' | 'color';
  value: any;
  options?: { value: string; label: string }[];
  category?: string;
}

export function ModuleSettingsPage({ module }: ModuleSettingsPageProps) {
  // ALL HOOKS MUST BE CALLED FIRST - React Rules of Hooks
  const { t, locale } = useTranslation('modules/module-management');
  const { t: tManagement } = useTranslation('modules/management');
  const { t: tGlobal } = useTranslation('global');
  const { showSuccess, showError } = useNotification();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const currentLocale = (params?.locale as string) || locale;
  
  // ALL useState hooks must be called before any conditional returns
  const [activeTab, setActiveTab] = useState<string | null>('summary');
  const [changeLogOpen, setChangeLogOpen] = useState<string[]>([]);
  const [versionHistory, setVersionHistory] = useState<VersionInfo[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [originalMenuItems, setOriginalMenuItems] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<ModuleSetting[]>([]);
  const [expandedMenuItems, setExpandedMenuItems] = useState<string[]>([]);
  const [moduleIcon, setModuleIcon] = useState<string>(module.icon || 'Apps');
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingMenu, setSavingMenu] = useState(false);
  const [_savingIcon, setSavingIcon] = useState(false);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [iconPickerItemId, setIconPickerItemId] = useState<string | null>(null);
  const [headerIconPickerOpen, setHeaderIconPickerOpen] = useState(false);

  // Map locale to date locale format
  const dateLocale = locale === 'tr' ? 'tr-TR' : locale === 'de' ? 'de-DE' : locale === 'ar' ? 'ar-SA' : 'en-US';
  
  // Check if user has admin or superadmin role
  const userRole = user?.role || '';
  const isAdmin = userRole && (
    userRole.toLowerCase() === 'admin' || 
    userRole.toLowerCase() === 'superadmin' ||
    userRole === 'Admin' ||
    userRole === 'SuperAdmin'
  );
  
  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      // User is not admin/superadmin, redirect to dashboard
      router.push(`/${currentLocale}/dashboard`);
    }
  }, [authLoading, user, isAdmin, router, currentLocale]);

  // Sync moduleIcon state when module.icon prop changes (e.g., after page refresh)
  useEffect(() => {
    if (module.icon && module.icon !== moduleIcon) {
      setModuleIcon(module.icon);
    }
  }, [module.icon, moduleIcon]);

  // Load version history
  useEffect(() => {
    const loadVersionHistory = async () => {
      try {
        const response = await fetch(`/api/modules/${module.slug}/version-history`);
        if (!response.ok) throw new Error('Failed to fetch version history');
        const result = await response.json();
        if (result.success && result.data) {
          setVersionHistory(result.data);
        }
      } catch (error) {
        console.error('Failed to load version history:', error);
        const fallbackHistory: VersionInfo[] = [
          {
            version: module.version || '1.0.0',
            date: new Date().toISOString().split('T')[0] || '',
            changes: [t('moduleSettings.versionHistory.currentVersion')],
          },
        ];
        setVersionHistory(fallbackHistory);
      }
    };

    loadVersionHistory();
  }, [module.slug, module.version, t]);

  // Load menu items with hierarchical structure
  const loadMenuItems = async () => {
    try {
      const response = await fetchWithAuth(`/api/modules/${module.slug}/menu?locale=${locale}`);

      if (!response.ok) throw new Error('Failed to fetch menu');
      const result = await response.json();

      if (result.success && result.data) {
        const menuConfig = result.data;

        if (menuConfig.main && menuConfig.main.items) {
          // Sort items by order first (recursively)
          const sortItemsByOrder = (items: any[]): any[] => {
            return items
              .map(item => ({
                ...item,
                children: item.children && item.children.length > 0
                  ? sortItemsByOrder(item.children)
                  : undefined
              }))
              .sort((a, b) => {
                const orderA = typeof a.order === 'number' ? a.order : 999;
                const orderB = typeof b.order === 'number' ? b.order : 999;
                return orderA - orderB;
              });
          };

          // Sort the root items first
          const sortedRootItems = sortItemsByOrder(menuConfig.main.items);

          // Flatten hierarchical structure for display (but keep level info)
          const flattenItems = (items: any[], level = 0): MenuItem[] => {
            const flattened: MenuItem[] = [];

            items.forEach((item, index) => {
              const menuItem: MenuItem = {
                id: item.id || `item-${level}-${index}`,
                title: item.title || item.label || 'Untitled',
                icon: item.icon || 'Circle',
                path: item.path || item.href || '#',
                order: item.order || index + 1,
                visible: item.visible !== false,
                target: (item.target || '_self') as '_self' | '_blank',
                level,
                children: item.children,
              };
              flattened.push(menuItem);

              // Add children recursively (children are already sorted)
              if (item.children && item.children.length > 0) {
                flattened.push(...flattenItems(item.children, level + 1));
              }
            });

            return flattened;
          };

          const items = flattenItems(sortedRootItems);
          setMenuItems(items);
          setOriginalMenuItems(JSON.parse(JSON.stringify(items))); // Deep copy
        }
      }
    } catch (error) {
      console.error('Failed to load menu items:', error);
    }
  };

  useEffect(() => {
    loadMenuItems();
  }, [module.slug, locale]);

  // Listen for menu-updated events to refresh menu items
  // This syncs changes made in the menu management page
  useEffect(() => {
    const handleMenuUpdated = () => {
      loadMenuItems();
    };

    window.addEventListener('menu-updated', handleMenuUpdated);
    return () => {
      window.removeEventListener('menu-updated', handleMenuUpdated);
    };
  }, [module.slug, locale]);

  // Load module settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`/api/modules/${module.slug}/settings`);
        
        if (!response.ok) throw new Error('Failed to fetch settings');
        const result = await response.json();
        
        if (result.success && result.data) {
          const transformedSettings = result.data.map((setting: any) => ({
            key: setting.key,
            label: setting.label,
            description: setting.description,
            type: setting.type,
            value: setting.value !== undefined ? setting.value : setting.defaultValue,
            options: setting.options,
            category: setting.category || t('moduleSettings.general'),
          }));
          setSettings(transformedSettings);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, [module.slug, t]);

  // CONDITIONAL RETURNS AFTER ALL HOOKS
  // Show loading while checking auth
  if (authLoading) {
    return (
      <Container size="xl" pt="xl">
        <Text>Yükleniyor...</Text>
      </Container>
    );
  }
  
  // Show access denied if user is not admin
  if (user && !isAdmin) {
    return (
      <Container size="xl" pt="xl">
        <Alert icon={<IconAlertCircle size={18} />} title={tGlobal('accessControl.accessDenied') || 'Erişim Reddedildi'} color="red">
          <Text>{tGlobal('accessControl.noPermission') || 'Bu sayfaya erişim yetkiniz yok. Sadece Admin ve SuperAdmin kullanıcıları modül ayarlarına erişebilir.'}</Text>
        </Alert>
      </Container>
    );
  }

  // Function to update module icon via API
  const handleModuleIconChange = async (iconName: string) => {
    setSavingIcon(true);
    try {
      const response = await fetch(`/api/modules/${module.slug}/icon`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icon: iconName }),
      });

      const result = await response.json();

      if (result.success) {
        setModuleIcon(iconName);
        showSuccess(
          t('moduleSettings.iconUpdated') || 'İkon güncellendi',
          t('moduleSettings.iconUpdatedSuccess') || 'Modül ikonu başarıyla güncellendi'
        );
        // Trigger menu refresh event for sidebar update
        window.dispatchEvent(new CustomEvent('menu-updated'));
        // Trigger modules refresh event for ModuleContext update
        window.dispatchEvent(new CustomEvent('modules-updated'));
      } else {
        showError(
          t('moduleSettings.iconUpdateFailed') || 'İkon güncellenemedi',
          result.error || 'Bir hata oluştu'
        );
      }
    } catch (error) {
      console.error('Error updating module icon:', error);
      showError(
        t('moduleSettings.iconUpdateFailed') || 'İkon güncellenemedi',
        error instanceof Error ? error.message : 'Bir hata oluştu'
      );
    } finally {
      setSavingIcon(false);
      setHeaderIconPickerOpen(false);
    }
  };

  const handleIconUpload = async (file: File | null) => {
    if (!file) return;

    setUploadingIcon(true);
    try {
      const formData = new FormData();
      formData.append('icon', file);

      const response = await fetch(`/api/modules/${module.slug}/icon`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload icon');

      const result = await response.json();
      if (result.success && result.data) {
        setModuleIcon(result.data.url);
        showSuccess(
          t('moduleSettings.icon.uploadSuccess'),
          t('moduleSettings.icon.uploadSuccess')
        );
      }
    } catch (error) {
      console.error('Error uploading icon:', error);
      showError(
        t('moduleSettings.icon.uploadError'),
        error instanceof Error ? error.message : t('moduleSettings.icon.uploadError')
      );
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(menuItems);
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    // Find the item being dragged
    const draggedItem = items[sourceIndex];
    
    // Find all child items (items that have level > draggedItem.level and come after it)
    const childItems: MenuItem[] = [];
    let currentIndex = sourceIndex + 1;
    
    // Collect all direct and nested children
    while (currentIndex < items.length) {
      const currentItem = items[currentIndex];
      // If we hit an item at the same or lower level, we've reached the end of children
      const currentLevel = currentItem?.level ?? 0;
      const draggedLevel = draggedItem?.level ?? 0;
      if (currentLevel <= draggedLevel) {
        break;
      }
      if (currentItem) {
        childItems.push(currentItem);
      }
      currentIndex++;
    }
    
    // Remove the dragged item and all its children
    const itemsToMove = [draggedItem, ...childItems];
    itemsToMove.forEach(() => {
      items.splice(sourceIndex, 1);
    });
    
    // Calculate the new destination index (accounting for removed items)
    let newDestinationIndex = destinationIndex;
    if (destinationIndex > sourceIndex) {
      // If moving down, adjust for removed items
      newDestinationIndex = destinationIndex - itemsToMove.length;
    }
    
    // Insert the dragged item and its children at the new position
    itemsToMove.forEach((item, idx) => {
      if (item) {
        items.splice(newDestinationIndex + idx, 0, item);
      }
    });
    
    // Update order numbers
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    setMenuItems(updatedItems);
  };

  const toggleMenuItemVisibility = (id: string) => {
    setMenuItems(
      menuItems.map((item) =>
        item.id === id ? { ...item, visible: !item.visible } : item
      )
    );
  };

  const toggleMenuItemExpanded = (id: string) => {
    setExpandedMenuItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const updateMenuItemTarget = (id: string, target: '_self' | '_blank') => {
    setMenuItems(
      menuItems.map((item) => (item.id === id ? { ...item, target } : item))
    );
  };

  const increaseIndent = (id: string) => {
    setMenuItems(
      menuItems.map((item) =>
        item.id === id && item.level < 3
          ? { ...item, level: item.level + 1 }
          : item
      )
    );
  };

  const decreaseIndent = (id: string) => {
    setMenuItems(
      menuItems.map((item) =>
        item.id === id && item.level > 0
          ? { ...item, level: item.level - 1 }
          : item
      )
    );
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(
      settings.map((setting) =>
        setting.key === key ? { ...setting, value } : setting
      )
    );
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const response = await fetch(`/api/modules/${module.slug}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      showSuccess(
        t('moduleSettings.settings.notifications.saved'),
        t('moduleSettings.settings.notifications.savedMessage')
      );
    } catch (error) {
      console.error('Error saving settings:', error);
      showError(
        t('moduleSettings.settings.notifications.error'),
        t('moduleSettings.settings.notifications.errorMessage')
      );
    } finally {
      setSavingSettings(false);
    }
  };

  const saveMenu = async () => {
    setSavingMenu(true);
    try {
      const response = await fetchWithAuth(`/api/modules/${module.slug}/menu?locale=${locale}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          main: {
            items: menuItems.map(item => ({
              id: item.id, // Include ID for database update
              title: item.title,
              icon: item.icon,
              path: item.path,
              order: item.order,
              visible: item.visible,
              target: item.target,
              level: item.level,
            })),
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to save menu');

      // Dispatch menu-updated event to refresh sidebar and menu management page
      window.dispatchEvent(new CustomEvent('menu-updated'));

      showSuccess(
        t('moduleSettings.menu.notifications.saved'),
        t('moduleSettings.menu.notifications.savedMessage')
      );
    } catch (error) {
      console.error('Error saving menu:', error);
      showError(
        t('moduleSettings.menu.notifications.error'),
        t('moduleSettings.menu.notifications.errorMessage')
      );
    } finally {
      setSavingMenu(false);
    }
  };

  const resetMenuToDefault = async () => {
    try {
      const response = await fetch(`/api/modules/${module.slug}/menu`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to reset menu');

      // Restore original menu items
      setMenuItems(JSON.parse(JSON.stringify(originalMenuItems)));

      // Dispatch menu-updated event to refresh sidebar
      window.dispatchEvent(new CustomEvent('menu-updated'));

      showSuccess(
        t('moduleSettings.menu.notifications.reset'),
        t('moduleSettings.menu.notifications.resetMessage')
      );
    } catch (error) {
      console.error('Error resetting menu:', error);
      showError(
        t('moduleSettings.menu.notifications.error'),
        t('moduleSettings.versionHistory.resetMenuError')
      );
    }
  };

  // Helper function to translate setting labels and descriptions
  const translateSetting = (key: string, type: 'label' | 'description', defaultValue: string): string => {
    // First try with setting key
    const translationKey = `moduleSettings.commonSettings.${key}${type === 'description' ? 'Desc' : ''}`;
    let translated = t(translationKey);
    
    // If translation found, return it
    if (translated !== translationKey) {
      return translated;
    }
    
    // For descriptions, try to normalize and lookup
    if (type === 'description') {
      // Normalize description: lowercase, remove special chars, replace spaces with camelCase
      const normalized = defaultValue
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
      
      const normalizedKey = `moduleSettings.commonSettings.${normalized}`;
      translated = t(normalizedKey);
      
      if (translated !== normalizedKey) {
        return translated;
      }
      
      // Also try with common description patterns that we've added to translation files
      // These are direct mappings from common descriptions
      const directKey = `moduleSettings.commonSettings.${normalized}`;
      translated = t(directKey);
      
      if (translated !== directKey) {
        return translated;
      }
    }
    
    // Fallback to original value
    return defaultValue;
  };

  const settingsByCategory = settings.reduce((acc, setting) => {
    const category = setting.category || t('moduleSettings.general');
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(setting);
    return acc;
  }, {} as Record<string, ModuleSetting[]>);

  const renderSettingControl = (setting: ModuleSetting) => {
    switch (setting.type) {
      case 'boolean':
        return (
          <Switch
            checked={setting.value}
            onChange={(e) => updateSetting(setting.key, e.currentTarget.checked)}
            label={setting.value ? t('moduleSettings.settings.controls.enabled') : t('moduleSettings.settings.controls.disabled')}
          />
        );
      case 'text':
        return (
          <TextInput
            value={setting.value}
            onChange={(e) => updateSetting(setting.key, e.currentTarget.value)}
            placeholder={setting.label}
          />
        );
      case 'number':
        return (
          <NumberInput
            value={setting.value}
            onChange={(value) => updateSetting(setting.key, value)}
            placeholder={setting.label}
          />
        );
      case 'select':
        return (
          <Select
            value={setting.value}
            onChange={(value) => updateSetting(setting.key, value)}
            data={(setting.options || []).map((option) => {
              // Translate option labels if they match common patterns
              let translatedLabel = option.label;
              
              // Currency options
              if (['USD', 'EUR', 'TRY', 'GBP'].includes(option.value)) {
                const currencyKey = `moduleSettings.options.currency.${option.value}`;
                const translated = t(currencyKey);
                if (translated !== currencyKey) {
                  translatedLabel = translated;
                }
              }
              // View options
              else if (['month', 'week', 'day', 'agenda'].includes(option.value)) {
                const viewKey = `moduleSettings.options.view.${option.value}`;
                const translated = t(viewKey);
                if (translated !== viewKey) {
                  translatedLabel = translated;
                }
              }
              // Format options
              else if (['pdf', 'excel', 'csv'].includes(option.value)) {
                const formatKey = `moduleSettings.options.format.${option.value}`;
                const translated = t(formatKey);
                if (translated !== formatKey) {
                  translatedLabel = translated;
                }
              }
              // Unit options
              else if (['pcs', 'kg', 'm', 'l'].includes(option.value)) {
                const unitKey = `moduleSettings.options.unit.${option.value}`;
                const translated = t(unitKey);
                if (translated !== unitKey) {
                  translatedLabel = translated;
                }
              }
              
              return {
                ...option,
                label: translatedLabel,
              };
            })}
          />
        );
      case 'color':
        return (
          <ColorPicker
            value={setting.value}
            onChange={(value) => updateSetting(setting.key, value)}
            format="hex"
            swatches={[
              '#228BE6',
              '#FA5252',
              '#40C057',
              '#FD7E14',
              '#BE4BDB',
              '#15AABF',
            ]}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Container size="xl" py="xl">
      {/* Header */}
      <Paper shadow="xs" p="lg" mb="xl" withBorder>
        <Group wrap="nowrap" align="flex-start">
          <Box pos="relative">
            {uploadingIcon ? (
              <Box
                style={{
                  width: 80,
                  height: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Loader size="md" />
              </Box>
            ) : moduleIcon && (moduleIcon.startsWith('http') || moduleIcon.startsWith('/')) ? (
              <Image
                src={moduleIcon}
                alt={module.name}
                width={80}
                height={80}
                radius="md"
              />
            ) : (
              <Box
                onClick={() => setHeaderIconPickerOpen(true)}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 'var(--mantine-radius-md)',
                  backgroundColor: 'var(--mantine-color-blue-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: '2px dashed var(--mantine-color-blue-4)',
                }}
              >
                <ModuleIcon icon={moduleIcon || 'Apps'} size={40} />
              </Box>
            )}
            <FileButton onChange={(file) => file && handleIconUpload(file)} accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp">
              {(props) => (
                <ActionIcon
                  {...props}
                  pos="absolute"
                  bottom={0}
                  right={0}
                  size="sm"
                  variant="filled"
                  color="blue"
                  radius="xl"
                  disabled={uploadingIcon}
                >
                  <ClientIcon>
                    <IconUpload size={12} />
                  </ClientIcon>
                </ActionIcon>
              )}
            </FileButton>
          </Box>
          
          <Stack gap="xs" style={{ flex: 1 }}>
            <Group gap="md" align="center">
              <Title order={2}>
                {tManagement(`names.${module.slug}`) || module.name}
              </Title>
              <Badge size="lg" variant="light" color={module.status === 'active' ? 'green' : 'gray'}>
                {t(`moduleSettings.status.${module.status}`) || module.status}
              </Badge>
            </Group>
            <Text c="dimmed" size="sm">
              {(() => {
                const translatedDesc = tManagement(`descriptions.${module.slug}`);
                return translatedDesc !== `descriptions.${module.slug}` 
                  ? translatedDesc 
                  : (module.description || tManagement('card.noDescription'));
              })()}
            </Text>
            <Group gap="md">
              <Box component="span">
                <Text size="sm" fw={500} component="span">
                  {t('moduleSettings.summary.version')}:{' '}
                </Text>
                <Badge variant="light">{module.version}</Badge>
              </Box>
              {module.author && (
                <Text size="sm" c="dimmed">
                  {t('moduleSettings.summary.author')}: {module.author}
                </Text>
              )}
            </Group>
            <Text size="xs" c="dimmed">
              {t('moduleSettings.icon.maxSize')} | {t('moduleSettings.icon.allowedTypes')}
            </Text>
          </Stack>
        </Group>
      </Paper>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="summary" leftSection={<ClientIcon><IconInfoCircle size={16} /></ClientIcon>}>
            {t('moduleSettings.tabs.summary')}
          </Tabs.Tab>
          <Tabs.Tab value="settings" leftSection={<ClientIcon><IconSettings size={16} /></ClientIcon>}>
            {t('moduleSettings.tabs.settings')}
          </Tabs.Tab>
          <Tabs.Tab value="menu" leftSection={<ClientIcon><IconMenu2 size={16} /></ClientIcon>}>
            {t('moduleSettings.tabs.menu')}
          </Tabs.Tab>
          <Tabs.Tab value="demo-data" leftSection={<ClientIcon><IconDatabase size={16} /></ClientIcon>}>
            {t('moduleSettings.tabs.demoData')}
          </Tabs.Tab>
        </Tabs.List>

        {/* Tab 1: Summary */}
        <Tabs.Panel value="summary" pt="lg">
          <Stack gap="lg">
            <Paper shadow="xs" p="xl" withBorder>
              <Stack gap="md">
                <Group align="center" gap="xs">
                  {moduleIcon && (moduleIcon.startsWith('http') || moduleIcon.startsWith('/')) ? (
                    <Image
                      src={moduleIcon}
                      alt={module.name}
                      width={60}
                      height={60}
                      radius="md"
                    />
                  ) : (
                    <Box
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 'var(--mantine-radius-md)',
                        backgroundColor: 'var(--mantine-color-blue-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ModuleIcon icon={moduleIcon || 'Apps'} size={32} />
                    </Box>
                  )}
                  <Stack gap={4}>
                    <Title order={3}>
                      {tManagement(`names.${module.slug}`) || module.name}
                    </Title>
                    <Text size="sm" c="dimmed">
                      {(() => {
                        const translatedDesc = tManagement(`descriptions.${module.slug}`);
                        return translatedDesc !== `descriptions.${module.slug}` 
                          ? translatedDesc 
                          : (module.description || tManagement('card.noDescription'));
                      })()}
                    </Text>
                  </Stack>
                </Group>

                <Divider />

                <Group gap="xl">
                  <Stack gap={4}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      {t('moduleSettings.summary.version')}
                    </Text>
                    <Text size="lg" fw={600}>
                      {module.version}
                    </Text>
                  </Stack>
                  <Stack gap={4}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      {t('moduleSettings.summary.lastUpdated')}
                    </Text>
                    <Text size="lg" fw={600}>
                      {new Date().toLocaleDateString(dateLocale, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </Stack>
                  <Stack gap={4}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                      {t('moduleSettings.summary.category')}
                    </Text>
                    <Badge size="lg" variant="light">
                      {module.category ? (tManagement(`categories.${module.category}`) !== `categories.${module.category}` ? tManagement(`categories.${module.category}`) : module.category) : t('moduleSettings.general')}
                    </Badge>
                  </Stack>
                </Group>

                <Divider />

                <Stack gap="xs">
                  <Title order={4}>{t('moduleSettings.summary.whatYouCanDo')}</Title>
                  <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                    {t('moduleSettings.summary.features.title')}
                  </Text>
                  <Box component="ul" ml="md" style={{ lineHeight: 1.8 }}>
                    <li><Text size="sm">{t('moduleSettings.summary.features.realEstate.properties')}</Text></li>
                    <li><Text size="sm">{t('moduleSettings.summary.features.realEstate.tenants')}</Text></li>
                    <li><Text size="sm">{t('moduleSettings.summary.features.realEstate.payments')}</Text></li>
                    <li><Text size="sm">{t('moduleSettings.summary.features.realEstate.appointments')}</Text></li>
                    <li><Text size="sm">{t('moduleSettings.summary.features.realEstate.email')}</Text></li>
                    <li><Text size="sm">{t('moduleSettings.summary.features.realEstate.reports')}</Text></li>
                    <li><Text size="sm">{t('moduleSettings.summary.features.realEstate.staff')}</Text></li>
                  </Box>
                </Stack>
              </Stack>
            </Paper>

            {/* Change Log */}
            <Paper shadow="xs" p="xl" withBorder>
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Title order={4}>{t('moduleSettings.summary.changeLog')}</Title>
                  <Text size="sm" c="dimmed">
                    {t('moduleSettings.summary.versionHistory')}
                  </Text>
                </Group>

                <Accordion
                  variant="separated"
                  value={changeLogOpen}
                  onChange={setChangeLogOpen as any}
                  multiple
                >
                  {versionHistory.map((version, index) => (
                    <Accordion.Item key={index} value={version.version}>
                      <Accordion.Control>
                        <Group justify="space-between" wrap="nowrap">
                          <Group gap="sm">
                            <Badge size="lg" variant="light" color={index === 0 ? 'green' : 'gray'}>
                              v{version.version}
                            </Badge>
                            {index === 0 && (
                              <Badge size="sm" variant="filled" color="green">
                                {t('moduleSettings.summary.current')}
                              </Badge>
                            )}
                          </Group>
                          <Text size="sm" c="dimmed">
                            {new Date(version.date).toLocaleDateString(dateLocale, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </Text>
                        </Group>
                      </Accordion.Control>
                      <Accordion.Panel>
                        <Stack gap="xs">
                          <Text size="sm" fw={600} c="dimmed">
                            {t('moduleSettings.summary.changes')}:
                          </Text>
                          <Box component="ul" ml="md">
                            {version.changes.map((change, idx) => (
                              <li key={idx}>
                                <Text size="sm">{change}</Text>
                              </li>
                            ))}
                          </Box>
                        </Stack>
                      </Accordion.Panel>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </Stack>
            </Paper>
          </Stack>
        </Tabs.Panel>

        {/* Tab 2: Settings */}
        <Tabs.Panel value="settings" pt="lg">
          <Paper shadow="xs" p="xl" withBorder>
            <Stack gap="lg">
              <Group justify="space-between" align="center">
                <Title order={4}>{t('moduleSettings.settings.title')}</Title>
                <Group gap="xs">
                  <Button variant="light" size="sm">
                    {t('moduleSettings.settings.resetToDefault')}
                  </Button>
                  <Button size="sm" onClick={saveSettings} loading={savingSettings}>
                    {t('moduleSettings.settings.saveChanges')}
                  </Button>
                </Group>
              </Group>

              <Divider />

              {Object.keys(settingsByCategory).length === 0 ? (
                <Text c="dimmed" ta="center" py="xl">
                  {t('moduleSettings.settings.noSettings')}
                </Text>
              ) : (
                <Accordion variant="separated" multiple defaultValue={Object.keys(settingsByCategory)}>
                  {Object.entries(settingsByCategory).map(([category, categorySettings]) => (
                    <Accordion.Item key={category} value={category}>
                      <Accordion.Control>
                        <Group justify="space-between">
                          <Text fw={600}>
                            {t(`moduleSettings.settings.categories.${category.toLowerCase()}`) || category}
                          </Text>
                          <Badge size="sm" variant="light">
                            {categorySettings.length} {categorySettings.length === 1 ? t('moduleSettings.settings.setting') : t('moduleSettings.settings.settings_plural')}
                          </Badge>
                        </Group>
                      </Accordion.Control>
                      <Accordion.Panel>
                        <Stack gap="lg">
                          {categorySettings.map((setting) => (
                            <Box key={setting.key}>
                              <Group justify="space-between" align="flex-start" wrap="nowrap">
                                <Stack gap={4} style={{ flex: 1 }}>
                                  <Text size="sm" fw={600}>
                                    {translateSetting(setting.key, 'label', setting.label)}
                                  </Text>
                                  <Text size="xs" c="dimmed">
                                    {translateSetting(setting.key, 'description', setting.description)}
                                  </Text>
                                </Stack>
                                <Box style={{ minWidth: 200 }}>
                                  {renderSettingControl(setting)}
                                </Box>
                              </Group>
                              {categorySettings.indexOf(setting) < categorySettings.length - 1 && (
                                <Divider mt="md" />
                              )}
                            </Box>
                          ))}
                        </Stack>
                      </Accordion.Panel>
                    </Accordion.Item>
                  ))}
                </Accordion>
              )}
            </Stack>
          </Paper>
        </Tabs.Panel>

        {/* Tab 3: Menu */}
        <Tabs.Panel value="menu" pt="lg">
          <Paper shadow="xs" p="xl" withBorder>
            <Stack gap="lg">
              <Group justify="space-between" align="center">
                <Stack gap={4}>
                  <Title order={4}>{t('moduleSettings.menu.title')}</Title>
                  <Text size="sm" c="dimmed">
                    {t('moduleSettings.menu.description')}
                  </Text>
                </Stack>
                <Group gap="xs">
                  <Button 
                    variant="light" 
                    size="sm" 
                    leftSection={<ClientIcon><IconRefresh size={16} /></ClientIcon>}
                    onClick={resetMenuToDefault}
                  >
                    {t('moduleSettings.menu.resetToDefault')}
                  </Button>
                  <Button 
                    variant="light" 
                    size="sm" 
                    leftSection={<ClientIcon><IconPlus size={16} /></ClientIcon>}
                  >
                    {t('moduleSettings.menu.addMenuItem')}
                  </Button>
                  <Button size="sm" onClick={saveMenu} loading={savingMenu}>
                    {t('moduleSettings.menu.saveMenu')}
                  </Button>
                </Group>
              </Group>

              <Divider />

              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="menu-items">
                  {(provided) => (
                    <Stack
                      gap="xs"
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {menuItems.map((item, index) => {
                        // Check if this item is a direct child of the previous item
                        const prevItem = index > 0 ? menuItems[index - 1] : null;
                        const isDirectChild = index > 0 && prevItem && (item.level ?? 0) > (prevItem.level ?? 0);
                        
                        // Only allow dragging parent items (items that are not direct children)
                        // Child items will move with their parent automatically via handleDragEnd
                        const isDraggable = !isDirectChild;
                        
                        return (
                          <Draggable 
                            key={item.id} 
                            draggableId={item.id} 
                            index={index}
                            isDragDisabled={!isDraggable}
                          >
                            {(provided, snapshot) => (
                              <Paper
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                shadow={snapshot.isDragging ? 'md' : 'xs'}
                                p="md"
                                withBorder
                                style={{
                                  ...provided.draggableProps.style,
                                  marginLeft: item.level * 20,
                                  opacity: item.visible ? 1 : 0.5,
                                }}
                              >
                                <Stack gap="sm">
                                  <Group justify="space-between" wrap="nowrap">
                                    <Group gap="xs" wrap="nowrap">
                                      {isDraggable ? (
                                        <Box {...provided.dragHandleProps}>
                                          <Tooltip label={t('moduleSettings.menu.tooltips.dragHandle')}>
                                            <IconGripVertical
                                              size={20}
                                              style={{ cursor: 'grab' }}
                                            />
                                          </Tooltip>
                                        </Box>
                                      ) : (
                                        <Box style={{ width: 20, height: 20 }} />
                                      )}
                                      
                                      <ActionIcon
                                        size="sm"
                                        variant="subtle"
                                        onClick={() => toggleMenuItemExpanded(item.id)}
                                      >
                                        {expandedMenuItems.includes(item.id) ? (
                                          <IconChevronUp size={16} />
                                        ) : (
                                          <IconChevronDown size={16} />
                                        )}
                                      </ActionIcon>

                                      <ModuleIcon icon={item.icon} size={20} />

                                      <Stack gap={0}>
                                        <Text size="sm" fw={600}>
                                          {item.title}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                          {item.path}
                                        </Text>
                                      </Stack>
                                    </Group>

                                    <Group gap="xs">
                                      <Tooltip label={item.level > 0 ? t('moduleSettings.menu.tooltips.decreaseIndent') : t('moduleSettings.menu.tooltips.atRootLevel')}>
                                        <ActionIcon
                                          size="sm"
                                          variant="subtle"
                                          onClick={() => decreaseIndent(item.id)}
                                          disabled={item.level === 0}
                                        >
                                          <IconArrowRight size={16} />
                                        </ActionIcon>
                                      </Tooltip>

                                      <Tooltip label={item.level < 3 ? t('moduleSettings.menu.tooltips.increaseIndent') : t('moduleSettings.menu.tooltips.maxIndentLevel')}>
                                        <ActionIcon
                                          size="sm"
                                          variant="subtle"
                                          onClick={() => increaseIndent(item.id)}
                                          disabled={item.level >= 3}
                                        >
                                          <IconArrowDown size={16} />
                                        </ActionIcon>
                                      </Tooltip>

                                      <Tooltip label={item.visible ? t('moduleSettings.menu.tooltips.hide') : t('moduleSettings.menu.tooltips.show')}>
                                        <ActionIcon
                                          size="sm"
                                          variant="subtle"
                                          color={item.visible ? 'blue' : 'gray'}
                                          onClick={() => toggleMenuItemVisibility(item.id)}
                                        >
                                          {item.visible ? (
                                            <IconEye size={16} />
                                          ) : (
                                            <IconEyeOff size={16} />
                                          )}
                                        </ActionIcon>
                                      </Tooltip>

                                      <Tooltip label={t('moduleSettings.menu.tooltips.delete')}>
                                        <ActionIcon
                                          size="sm"
                                          variant="subtle"
                                          color="red"
                                        >
                                          <IconTrash size={16} />
                                        </ActionIcon>
                                      </Tooltip>
                                    </Group>
                                  </Group>

                                  <Collapse in={expandedMenuItems.includes(item.id)}>
                                    <Stack gap="md" mt="sm">
                                      <Group grow>
                                        <TextInput
                                          label={t('moduleSettings.menu.itemConfig.title')}
                                          value={item.title}
                                          onChange={(e) => {
                                            const updatedItems = menuItems.map((mi) =>
                                              mi.id === item.id
                                                ? { ...mi, title: e.currentTarget.value }
                                                : mi
                                            );
                                            setMenuItems(updatedItems);
                                          }}
                                        />
                                        <Box>
                                          <Text size="sm" fw={500} mb={4}>
                                            {t('moduleSettings.menu.itemConfig.icon')}
                                          </Text>
                                          <Button
                                            variant="light"
                                            fullWidth
                                            leftSection={<ModuleIcon icon={item.icon} size={18} />}
                                            onClick={() => {
                                              setIconPickerItemId(item.id);
                                              setIconPickerOpen(true);
                                            }}
                                            styles={{
                                              inner: { justifyContent: 'flex-start' },
                                            }}
                                          >
                                            {item.icon || t('moduleSettings.menu.itemConfig.selectIcon')}
                                          </Button>
                                        </Box>
                                      </Group>
                                      <TextInput
                                        label={t('moduleSettings.menu.itemConfig.path')}
                                        value={item.path}
                                        onChange={(e) => {
                                          const updatedItems = menuItems.map((mi) =>
                                            mi.id === item.id
                                              ? { ...mi, path: e.currentTarget.value }
                                              : mi
                                          );
                                          setMenuItems(updatedItems);
                                        }}
                                      />
                                      <Select
                                        label={t('moduleSettings.menu.itemConfig.openIn')}
                                        value={item.target}
                                        onChange={(value) =>
                                          updateMenuItemTarget(item.id, value as '_self' | '_blank')
                                        }
                                        data={[
                                          { value: '_self', label: t('moduleSettings.menu.itemConfig.sameTab') },
                                          { value: '_blank', label: t('moduleSettings.menu.itemConfig.newTab') },
                                        ]}
                                      />
                                    </Stack>
                                  </Collapse>
                                </Stack>
                              </Paper>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </Stack>
                  )}
                </Droppable>
              </DragDropContext>
            </Stack>
          </Paper>
        </Tabs.Panel>

        {/* Tab 4: Demo Data */}
        <Tabs.Panel value="demo-data" pt="lg">
          <DemoDataTab moduleSlug={module.slug} />
        </Tabs.Panel>
      </Tabs>

      {/* Icon Picker Modal for Menu Items */}
      <IconPicker
        value={iconPickerItemId ? menuItems.find(item => item.id === iconPickerItemId)?.icon : undefined}
        onChange={(iconName) => {
          if (iconPickerItemId) {
            const updatedItems = menuItems.map((mi) =>
              mi.id === iconPickerItemId
                ? { ...mi, icon: iconName }
                : mi
            );
            setMenuItems(updatedItems);
          }
          setIconPickerOpen(false);
          setIconPickerItemId(null);
        }}
        opened={iconPickerOpen}
        onClose={() => {
          setIconPickerOpen(false);
          setIconPickerItemId(null);
        }}
      />

      {/* Icon Picker Modal for Header Module Icon */}
      <IconPicker
        value={moduleIcon}
        onChange={handleModuleIconChange}
        opened={headerIconPickerOpen}
        onClose={() => setHeaderIconPickerOpen(false)}
      />
    </Container>
  );
}
