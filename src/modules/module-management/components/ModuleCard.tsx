'use client';

import { Card, Badge, ActionIcon, Text, Group, Stack, Switch, Tooltip, Box } from '@mantine/core';
import { IconSettings, IconTrash } from '@tabler/icons-react';
import { ModuleIcon } from '@/lib/modules/icon-loader';
import { useModules } from '@/context/ModuleContext';
import { useNotification } from '@/hooks/useNotification';
import { useTranslation } from '@/lib/i18n/client';
import type { ModuleRecord } from '@/lib/modules/types';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface ModuleCardProps {
  module: ModuleRecord;
  onConfigure?: (module: ModuleRecord) => void;
}

export function ModuleCard({ module, onConfigure }: ModuleCardProps) {
  const { activateModule, deactivateModule, uninstallModule } = useModules();
  const { showConfirm, showSuccess, showError } = useNotification();
  const { t } = useTranslation('modules/management');
  const [isToggling, setIsToggling] = useState(false);
  const router = useRouter();
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'tr';

  const handleToggle = async (checked: boolean) => {
    setIsToggling(true);
    try {
      if (checked) {
        await activateModule(module.slug);
        showSuccess(
          t('notifications.moduleActivated'),
          t('notifications.moduleActivatedSuccess').replace('{{name}}', module.name)
        );
      } else {
        await deactivateModule(module.slug);
        showSuccess(
          t('notifications.moduleDeactivated'),
          t('notifications.moduleDeactivatedSuccess').replace('{{name}}', module.name)
        );
      }
    } catch (error) {
      showError(
        checked ? t('notifications.activationFailed') : t('notifications.deactivationFailed'),
        error instanceof Error ? error.message : (checked ? t('notifications.activationFailedMessage') : t('notifications.deactivationFailedMessage'))
      );
    } finally {
      setIsToggling(false);
    }
  };

  const handleUninstall = () => {
    showConfirm(
      t('notifications.uninstallModule'),
      t('notifications.uninstallConfirm').replace('{{name}}', module.name),
      async () => {
        try {
          await uninstallModule(module.slug);
          showSuccess(
            t('notifications.moduleUninstalled'),
            t('notifications.moduleUninstalledSuccess').replace('{{name}}', module.name)
          );
        } catch (error) {
          showError(
            t('notifications.uninstallFailed'),
            error instanceof Error ? error.message : t('notifications.uninstallFailedMessage')
          );
        }
      }
    );
  };

  const getStatusBadge = () => {
    switch (module.status) {
      case 'active':
        return <Badge color="green" size="sm">{t('card.status.active')}</Badge>;
      case 'inactive':
        return <Badge color="gray" size="sm">{t('card.status.inactive')}</Badge>;
      case 'installed':
        return <Badge color="blue" size="sm">{t('card.status.installed')}</Badge>;
      case 'error':
        return <Badge color="red" size="sm">{t('card.status.error')}</Badge>;
      default:
        return <Badge size="sm">{module.status}</Badge>;
    }
  };

  const isActive = module.status === 'active';
  const canToggle = module.status === 'active' || module.status === 'inactive' || module.status === 'installed';
  const hasError = Boolean(module.error) || module.status === 'error';

  return (
    <Card 
      shadow="sm" 
      padding="lg" 
      radius="md" 
      withBorder 
      className="flex flex-col h-full transition-all hover:shadow-md"
      style={{ minHeight: '280px' }}
    >
      <Stack gap="md" style={{ flex: 1 }}>
        {/* Header with Icon, Title, and Badge */}
        <Group justify="space-between" align="flex-start" gap="xs">
          <Group gap="sm" align="flex-start" style={{ flex: 1 }}>
            {/* Module Icon */}
            <Box
              style={{
                width: 48,
                height: 48,
                borderRadius: '8px',
                backgroundColor: 'var(--mantine-color-gray-1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              className="dark:bg-gray-800"
            >
              <ModuleIcon icon={module.icon || 'Apps'} size={24} />
            </Box>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text fw={700} size="lg" lineClamp={1} className="text-slate-900 dark:text-white">
                {(() => {
                  const translatedName = t(`names.${module.slug}`);
                  return translatedName !== `names.${module.slug}` 
                    ? translatedName 
                    : module.name;
                })()}
              </Text>
              <Text size="xs" c="dimmed" mt={2}>
                v{module.version}
              </Text>
            </div>
          </Group>
        </Group>

        {/* Description */}
        <Text size="sm" c="dimmed" lineClamp={4} style={{ minHeight: '60px' }}>
          {(() => {
            const translatedDesc = t(`descriptions.${module.slug}`);
            // If translation key is returned (not found), use original description
            return translatedDesc !== `descriptions.${module.slug}` 
              ? translatedDesc 
              : (module.description || t('card.noDescription'));
          })()}
        </Text>

        {/* Error Message */}
        {hasError && (
          <Box
            p="xs"
            style={{
              backgroundColor: 'var(--mantine-color-red-0)',
              borderRadius: '4px',
              border: '1px solid var(--mantine-color-red-3)',
            }}
            className="dark:bg-red-900/20 dark:border-red-800"
          >
            <Text size="xs" c="red" fw={500}>
              {module.error || t('card.moduleHasErrors')}
            </Text>
          </Box>
        )}

        {/* Category and Tags */}
        {module.category && (
          <Group gap="xs">
            <Text size="xs" c="dimmed" fw={500}>
              {t('card.category')}
            </Text>
            <Badge variant="light" size="xs" color="gray">
              {(() => {
                const translatedCategory = t(`categories.${module.category}`);
                // If translation key is returned (not found), use original category
                return translatedCategory !== `categories.${module.category}` 
                  ? translatedCategory 
                  : module.category;
              })()}
            </Badge>
          </Group>
        )}
      </Stack>

      {/* Actions Footer */}
      <Group gap="xs" mt="md" justify="space-between" align="center">
        {/* Badge and Toggle Switch - Always visible in same position */}
        <Group gap="xs" align="center">
          {getStatusBadge()}
          <Switch
            checked={isActive}
            onChange={(e) => handleToggle(e.currentTarget.checked)}
            disabled={!canToggle || isToggling || hasError}
            size="md"
            label={isActive ? t('card.switch.active') : t('card.switch.inactive')}
            labelPosition="left"
            styles={{
              label: {
                fontSize: '12px',
                fontWeight: 500,
              },
            }}
          />
        </Group>

        {/* Action Icons */}
        <Group gap={4}>
          <Tooltip label={t('card.tooltips.settings')} withArrow>
            <ActionIcon
              variant="light"
              color="blue"
              size="lg"
              onClick={() => router.push(`/${currentLocale}/${module.slug}/settings`)}
              disabled={!isActive}
            >
              <IconSettings size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={t('card.tooltips.uninstall')} withArrow color="red">
            <ActionIcon
              variant="light"
              color="red"
              size="lg"
              onClick={handleUninstall}
            >
              <IconTrash size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </Card>
  );
}
