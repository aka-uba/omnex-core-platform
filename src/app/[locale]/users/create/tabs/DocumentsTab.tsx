'use client';

import {
  Stack,
  FileButton,
  Button,
  Group,
  Text,
  Divider,
} from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { UseFormReturnType } from '@mantine/form';
import type { UserFormData } from '@/lib/schemas/user';
import classes from './DocumentsTab.module.css';

interface DocumentsTabProps {
  form: UseFormReturnType<UserFormData>;
}

export function DocumentsTab({ form }: DocumentsTabProps) {
  const { t } = useTranslation('modules/users');
  const { t: tGlobal } = useTranslation('global');

  return (
    <Stack gap="xl" p="xl" className={classes.container}>
      <div>
        <Text fw={600} size="lg">{t('form.documents.title')}</Text>
        <Text size="sm" c="dimmed">{t('form.documents.description') || 'Upload required documents'}</Text>
      </div>

      <Divider />

      <Stack gap="md">
        <Group justify="space-between" align="flex-end">
          <div style={{ flex: 1 }}>
            <Text size="sm" fw={500} mb="xs">{t('form.documents.passport')}</Text>
            {form.values.documents?.passport && (
              <Text size="xs" c="dimmed">{form.values.documents.passport.name}</Text>
            )}
          </div>
          <FileButton
            onChange={(file) => file && form.setFieldValue('documents.passport', file)}
            accept="image/*,application/pdf"
          >
            {(props) => (
              <Button {...props} variant="light" leftSection={<IconUpload size={16} />}>
                {tGlobal('form.upload')}
              </Button>
            )}
          </FileButton>
        </Group>

        <Group justify="space-between" align="flex-end">
          <div style={{ flex: 1 }}>
            <Text size="sm" fw={500} mb="xs">{t('form.documents.idCard')}</Text>
            {form.values.documents?.idCard && (
              <Text size="xs" c="dimmed">{form.values.documents.idCard.name}</Text>
            )}
          </div>
          <FileButton
            onChange={(file) => file && form.setFieldValue('documents.idCard', file)}
            accept="image/*,application/pdf"
          >
            {(props) => (
              <Button {...props} variant="light" leftSection={<IconUpload size={16} />}>
                {tGlobal('form.upload')}
              </Button>
            )}
          </FileButton>
        </Group>

        <Group justify="space-between" align="flex-end">
          <div style={{ flex: 1 }}>
            <Text size="sm" fw={500} mb="xs">{t('form.documents.contract')}</Text>
            {form.values.documents?.contract && (
              <Text size="xs" c="dimmed">{form.values.documents.contract.name}</Text>
            )}
          </div>
          <FileButton
            onChange={(file) => file && form.setFieldValue('documents.contract', file)}
            accept="application/pdf"
          >
            {(props) => (
              <Button {...props} variant="light" leftSection={<IconUpload size={16} />}>
                {tGlobal('form.upload')}
              </Button>
            )}
          </FileButton>
        </Group>
      </Stack>
    </Stack>
  );
}

