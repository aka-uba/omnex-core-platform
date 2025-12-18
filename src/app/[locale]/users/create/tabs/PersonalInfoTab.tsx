'use client';

import {
  Stack,
  TextInput,
  PasswordInput,
  FileButton,
  Button,
  Group,
  Text,
  Avatar,
  Grid,
  Divider,
} from '@mantine/core';
import { IconUpload, IconUser } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { UseFormReturnType } from '@mantine/form';
import type { UserFormData } from '@/lib/schemas/user';
import classes from './PersonalInfoTab.module.css';

interface PersonalInfoTabProps {
  form: UseFormReturnType<UserFormData>;
  currentProfilePicture?: string | null;
}

export function PersonalInfoTab({ form, currentProfilePicture }: PersonalInfoTabProps) {
  const { t } = useTranslation('modules/users');
  const { t: tGlobal } = useTranslation('global');

  const handleProfilePictureChange = (file: File | null) => {
    if (file) {
      form.setFieldValue('personal.profilePicture', file);
    }
  };

  // Show new uploaded file if exists, otherwise show current profile picture
  const profilePictureUrl = form.values.personal.profilePicture instanceof File
    ? URL.createObjectURL(form.values.personal.profilePicture)
    : currentProfilePicture || undefined;

  return (
    <Stack gap="xl" className={classes.container}>
      {/* Profile Picture Section */}
      <div className={classes.section}>
        <div className={classes.sectionHeader}>
          <Text fw={600} size="lg">{t('form.personal.profilePicture')}</Text>
          <Text size="sm" c="dimmed">{t('form.personal.profilePictureDescription')}</Text>
        </div>
        <Group gap="md" align="flex-start">
          {profilePictureUrl ? (
            <Avatar src={profilePictureUrl} size={96} radius="md" />
          ) : (
            <Avatar size={96} radius="md" className={classes.avatarPlaceholder}>
              <IconUser size={48} />
            </Avatar>
          )}
          <FileButton
            onChange={handleProfilePictureChange}
            accept="image/*"
          >
            {(props) => (
              <Button {...props} variant="light" leftSection={<IconUpload size={16} />}>
                {tGlobal('form.upload')}
              </Button>
            )}
          </FileButton>
        </Group>
      </div>

      <Divider />

      {/* User Details Section */}
      <div className={classes.section}>
        <div className={classes.sectionHeader}>
          <Text fw={600} size="lg">{t('form.personal.userDetails')}</Text>
          <Text size="sm" c="dimmed">{t('form.personal.userDetailsDescription')}</Text>
        </div>
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label={t('form.personal.fullName')}
              placeholder={t('form.personal.fullNamePlaceholder')}
              required
              {...form.getInputProps('personal.fullName')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label={t('form.personal.email')}
              placeholder="john.doe@example.com"
              type="email"
              required
              {...form.getInputProps('personal.email')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label={t('form.personal.phone')}
              placeholder="+90 555 123 4567"
              {...form.getInputProps('personal.phone')}
            />
          </Grid.Col>
        </Grid>
      </div>

      <Divider />

      {/* Credentials Section */}
      <div className={classes.section}>
        <div className={classes.sectionHeader}>
          <Text fw={600} size="lg">{t('form.personal.credentials')}</Text>
          <Text size="sm" c="dimmed">{t('form.personal.credentialsDescription')}</Text>
        </div>
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <PasswordInput
              label={t('form.personal.password')}
              required
              {...form.getInputProps('personal.password')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <PasswordInput
              label={t('form.personal.confirmPassword')}
              required
              {...form.getInputProps('personal.confirmPassword')}
            />
          </Grid.Col>
        </Grid>
      </div>
    </Stack>
  );
}




