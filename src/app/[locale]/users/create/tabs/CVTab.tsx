'use client';

import {
  Stack,
  FileButton,
  Button,
  Group,
  Text,
  Divider,
} from '@mantine/core';
import { IconUpload, IconFileDescription } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { UseFormReturnType } from '@mantine/form';
import type { UserFormData } from '@/lib/schemas/user';
import classes from './CVTab.module.css';

interface CVTabProps {
  form: UseFormReturnType<UserFormData>;
}

export function CVTab({ form }: CVTabProps) {
  const { t } = useTranslation('modules/users');

  return (
    <Stack gap="xl" p="xl" className={classes.container}>
      <div>
        <Text fw={600} size="lg">{t('form.cv.title')}</Text>
        <Text size="sm" c="dimmed">{t('form.cv.cvDescription')}</Text>
      </div>

      <Divider />

      <Group justify="space-between" align="flex-end">
        <div style={{ flex: 1 }}>
          {form.values.cv?.cv && (
            <Group gap="sm">
              <IconFileDescription size={24} />
              <Text size="sm">{form.values.cv.cv.name}</Text>
            </Group>
          )}
        </div>
        <FileButton
          onChange={(file) => file && form.setFieldValue('cv.cv', file)}
          accept="application/pdf,.doc,.docx"
        >
          {(props) => (
            <Button {...props} leftSection={<IconUpload size={16} />}>
              {t('form.cv.uploadCv')}
            </Button>
          )}
        </FileButton>
      </Group>
    </Stack>
  );
}

