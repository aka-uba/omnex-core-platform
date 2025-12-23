'use client';

import {
  Stack,
  Select,
  Grid,
  Divider,
  Text,
} from '@mantine/core';
import { useTranslation } from '@/lib/i18n/client';
import { UseFormReturnType } from '@mantine/form';
import type { UserFormData } from '@/lib/schemas/user';
import classes from './PreferencesTab.module.css';

interface PreferencesTabProps {
  form: UseFormReturnType<UserFormData>;
}

export function PreferencesTab({ form }: PreferencesTabProps) {
  const { t } = useTranslation('modules/users');

  return (
    <Stack gap="xl" p="xl" {...(classes.container ? { className: classes.container } : {})}>
      <div>
        <Text fw={600} size="lg">{t('form.preferences.title')}</Text>
        <Text size="sm" c="dimmed">{t('form.preferences.description')}</Text>
      </div>

      <Divider />

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
          <Select
            label={t('form.preferences.defaultLanguage')}
            data={[
              { value: 'tr', label: 'Türkçe' },
              { value: 'en', label: 'English' },
              { value: 'de', label: 'Deutsch' },
              { value: 'ar', label: 'العربية' },
            ]}
            {...form.getInputProps('preferences.defaultLanguage')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
          <Select
            label={t('form.preferences.defaultTheme')}
            data={[
              { value: 'auto', label: t('form.preferences.themeAuto') },
              { value: 'light', label: t('form.preferences.themeLight') },
              { value: 'dark', label: t('form.preferences.themeDark') },
            ]}
            {...form.getInputProps('preferences.defaultTheme')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
          <Select
            label={t('form.preferences.defaultLayout')}
            data={[
              { value: 'sidebar', label: t('form.preferences.layoutSidebar') },
              { value: 'top', label: t('form.preferences.layoutTopHeader') },
            ]}
            {...form.getInputProps('preferences.defaultLayout')}
          />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

