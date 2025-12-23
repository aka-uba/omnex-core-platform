'use client';

import {
  Stack,
  TextInput,
  Grid,
  Divider,
  Text,
} from '@mantine/core';
import { useTranslation } from '@/lib/i18n/client';
import { UseFormReturnType } from '@mantine/form';
import type { UserFormData } from '@/lib/schemas/user';
import classes from './ContactInfoTab.module.css';

interface ContactInfoTabProps {
  form: UseFormReturnType<UserFormData>;
}

export function ContactInfoTab({ form }: ContactInfoTabProps) {
  const { t } = useTranslation('modules/users');

  return (
    <Stack gap="xl" p="xl" {...(classes.container ? { className: classes.container } : {})}>
      <div>
        <Text fw={600} size="lg">{t('form.contact.title')}</Text>
        <Text size="sm" c="dimmed">{t('form.contact.description')}</Text>
      </div>

      <Divider />

      <Grid gutter="md">
        {/* Row 1: Address (full width on small, 2/3 on large) */}
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <TextInput
            label={t('form.contact.address')}
            placeholder={t('form.contact.addressPlaceholder')}
            {...form.getInputProps('contact.address')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, lg: 4 }}>
          <TextInput
            label={t('form.contact.postalCode')}
            placeholder={t('form.contact.postalCodePlaceholder')}
            {...form.getInputProps('contact.postalCode')}
          />
        </Grid.Col>

        {/* Row 2: City, Country */}
        <Grid.Col span={{ base: 12, sm: 6, lg: 6 }}>
          <TextInput
            label={t('form.contact.city')}
            placeholder={t('form.contact.cityPlaceholder')}
            {...form.getInputProps('contact.city')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, lg: 6 }}>
          <TextInput
            label={t('form.contact.country')}
            placeholder={t('form.contact.countryPlaceholder')}
            {...form.getInputProps('contact.country')}
          />
        </Grid.Col>

        {/* Divider for Emergency Contact section */}
        <Grid.Col span={{ base: 12 }}>
          <Divider my="md" label={t('form.contact.emergencySection')} labelPosition="left" />
        </Grid.Col>

        {/* Row 3: Emergency Contact, Emergency Phone */}
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <TextInput
            label={t('form.contact.emergencyContact')}
            placeholder={t('form.contact.emergencyContactPlaceholder')}
            {...form.getInputProps('contact.emergencyContact')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <TextInput
            label={t('form.contact.emergencyPhone')}
            placeholder={t('form.contact.emergencyPhonePlaceholder')}
            {...form.getInputProps('contact.emergencyPhone')}
          />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

