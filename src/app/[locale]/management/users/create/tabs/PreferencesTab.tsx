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
        <Text size="sm" c="dimmed">Set default system preferences</Text>
      </div>

      <Divider />

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
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
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Select
            label={t('form.preferences.defaultTheme')}
            data={[
              { value: 'auto', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
            {...form.getInputProps('preferences.defaultTheme')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Select
            label={t('form.preferences.defaultLayout')}
            data={[
              { value: 'compact', label: 'Compact' },
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'spacious', label: 'Spacious' },
            ]}
            {...form.getInputProps('preferences.defaultLayout')}
          />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

