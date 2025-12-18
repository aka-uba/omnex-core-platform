'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@mantine/form';
import {
  Paper,
  TextInput,
  Select,
  Button,
  Stack,
  Grid,
  Group,
  Title,
  Text,
  MultiSelect,
  Textarea,
  Avatar,
  FileButton,
  Box,
  ActionIcon,
} from '@mantine/core';
import { IconArrowLeft, IconUpload, IconX, IconUser } from '@tabler/icons-react';
import {
  useRealEstateStaffMember,
  useCreateRealEstateStaff,
  useUpdateRealEstateStaff,
} from '@/hooks/useRealEstateStaff';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import type { StaffType, StaffRole } from '@/modules/real-estate/types/staff';
import { useProperties } from '@/hooks/useProperties';
import { useApartments } from '@/hooks/useApartments';
import { useUsers } from '@/hooks/useUsers';
import { useCoreFileManager } from '@/hooks/useCoreFileManager';
import { useAuth } from '@/hooks/useAuth';

interface RealEstateStaffFormProps {
  locale: string;
  staffId?: string;
}

export function RealEstateStaffForm({ locale, staffId }: RealEstateStaffFormProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { data: staff } = useRealEstateStaffMember(staffId || '');
  const createStaff = useCreateRealEstateStaff();
  const updateStaff = useUpdateRealEstateStaff();

  // Fetch related data
  const { data: propertiesData } = useProperties({ page: 1, pageSize: 1000 });
  const { data: apartmentsData } = useApartments({ page: 1, pageSize: 1000 });
  const { data: usersData } = useUsers({ page: 1, pageSize: 1000 });

  // Map system users for select
  const systemUsers = usersData?.users.map((user) => ({
    value: user.id,
    label: `${user.name || user.email} (${user.email})`,
  })) || [];

  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  // Get tenant ID - TODO: Get from tenant context
  const tenantId = 'temp-tenant-id';

  const { uploadFile } = useCoreFileManager({
    tenantId,
    module: 'real-estate',
    entityType: 'staff',
    ...(staffId ? { entityId: staffId } : {}),
    userId: user?.id || '',
  });

  const form = useForm({
    initialValues: {
      userId: '',
      name: '',
      email: '',
      phone: '',
      staffType: 'external' as StaffType,
      role: 'agent' as StaffRole,
      propertyIds: [] as string[],
      apartmentIds: [] as string[],
      notes: '',
      profileImage: '',
    },
    validate: {
      name: (value) => (!value ? t('form.required') : null),
      staffType: (value) => (!value ? t('form.required') : null),
      role: (value) => (!value ? t('form.required') : null),
      userId: (value, values) => {
        if (values.staffType === 'internal' && !value) {
          return t('form.required');
        }
        return null;
      },
    },
  });

  // Load staff data if editing
  useEffect(() => {
    if (staff) {
      form.setValues({
        userId: staff.userId || '',
        name: staff.name,
        email: staff.email || '',
        phone: staff.phone || '',
        staffType: staff.staffType,
        role: staff.role,
        propertyIds: staff.propertyIds || [],
        apartmentIds: staff.apartmentIds || [],
        notes: staff.notes || '',
        profileImage: staff.profileImage || '',
      });
      if (staff.profileImage) {
        setProfileImagePreview(staff.profileImage);
      }
    }
  }, [staff]);

  const handleProfileImageUpload = async (file: File | null) => {
    if (!file) return;
    
    try {
      setUploading(true);
      const uploadedFile = await uploadFile({
        file,
        title: `Profile Image - ${form.values.name || 'Staff'}`,
        // description is optional, omit if not needed
      });
      form.setFieldValue('profileImage', uploadedFile.id);
      setProfileImagePreview(uploadedFile.fullPath || uploadedFile.id);
      showToast({
        type: 'success',
        title: t('messages.success'),
        message: t('staff.profileImage.uploadSuccess'),
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('staff.profileImage.uploadError'),
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveProfileImage = () => {
    form.setFieldValue('profileImage', '');
    setProfileImagePreview(null);
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const input = {
        ...values,
        userId: values.staffType === 'internal' ? values.userId : undefined,
        email: values.email || undefined,
        phone: values.phone || undefined,
        propertyIds: values.propertyIds || [],
        apartmentIds: values.apartmentIds || [],
        notes: values.notes || undefined,
        profileImage: values.profileImage || undefined,
      };

      if (staffId) {
        await updateStaff.mutateAsync({ id: staffId, input: input as any });
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('staff.update.success'),
        });
      } else {
        await createStaff.mutateAsync(input as any);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('staff.create.success'),
        });
      }

      router.push(`/${locale}/modules/real-estate/staff`);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('staff.create.error'),
      });
    }
  };

  // Loading state is handled by parent component (EditStaffPageClient)

  return (
    <Paper shadow="xs" p="xl">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={3}>
              {staffId
                ? (t('staff.edit.title'))
                : (t('staff.create.title'))}
            </Title>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => router.back()}
            >
              {t('actions.back')}
            </Button>
          </Group>

          {/* Profile Image Upload */}
          <Box>
            <Text size="sm" fw={500} mb="xs">
              {t('staff.profileImage')}
            </Text>
            <Group gap="md" align="flex-start">
              <Box pos="relative">
                <Avatar
                  src={profileImagePreview}
                  size={120}
                  radius="50%"
                  style={{
                    border: '3px solid var(--mantine-color-gray-3)',
                    objectFit: 'cover',
                  }}
                >
                  <IconUser size={60} />
                </Avatar>
                {profileImagePreview && (
                  <ActionIcon
                    color="red"
                    variant="filled"
                    size="sm"
                    radius="xl"
                    pos="absolute"
                    top={0}
                    right={0}
                    onClick={handleRemoveProfileImage}
                  >
                    <IconX size={16} />
                  </ActionIcon>
                )}
              </Box>
              <Stack gap="xs">
                <FileButton
                  onChange={handleProfileImageUpload}
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  disabled={uploading}
                >
                  {(props) => (
                    <Button
                      {...props}
                      leftSection={<IconUpload size={16} />}
                      variant="light"
                      loading={uploading}
                      style={{ width: 'auto' }}
                    >
                      {profileImagePreview
                        ? (t('staff.form.setProfileImage') || t('staff.setProfileImage'))
                        : (t('staff.form.uploadProfileImage') || t('staff.uploadProfileImage'))}
                    </Button>
                  )}
                </FileButton>
                <Text size="xs" c="dimmed" style={{ maxWidth: 300 }}>
                  {t('staff.form.uploadProfileImageHint') || t('staff.uploadProfileImageHint')}
                </Text>
              </Stack>
            </Group>
          </Box>

          <Grid>
            <Grid.Col span={12}>
              <Select
                label={t('form.staffType')}
                placeholder={t('form.selectStaffType')}
                required
                data={[
                  { value: 'internal', label: t('staff.types.internal') },
                  { value: 'external', label: t('staff.types.external') },
                ]}
                {...form.getInputProps('staffType')}
                onChange={(value) => {
                  form.setFieldValue('staffType', value as StaffType);
                  if (value === 'external') {
                    form.setFieldValue('userId', '');
                  }
                }}
              />
            </Grid.Col>

            {form.values.staffType === 'internal' && (
              <Grid.Col span={12}>
                <Select
                  label={t('form.user')}
                  placeholder={t('form.selectUser')}
                  required
                  searchable
                  data={systemUsers}
                  {...form.getInputProps('userId')}
                />
                <Text size="xs" c="dimmed" mt={4}>
                  {t('form.internalStaffHint')}
                </Text>
              </Grid.Col>
            )}

            <Grid.Col span={12}>
              <TextInput
                label={t('form.name')}
                placeholder={t('form.namePlaceholder')}
                required
                {...form.getInputProps('name')}
                disabled={form.values.staffType === 'internal' && !!form.values.userId}
              />
              {form.values.staffType === 'internal' && (
                <Text size="xs" c="dimmed" mt={4}>
                  {t('form.nameAutoFill')}
                </Text>
              )}
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                label={t('form.email')}
                placeholder={t('form.emailPlaceholder')}
                type="email"
                {...form.getInputProps('email')}
                disabled={form.values.staffType === 'internal' && !!form.values.userId}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                label={t('form.phone')}
                placeholder={t('form.phonePlaceholder')}
                {...form.getInputProps('phone')}
                disabled={form.values.staffType === 'internal' && !!form.values.userId}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Select
                label={t('form.role')}
                placeholder={t('form.selectRole')}
                required
                data={[
                  { value: 'manager', label: t('staff.roles.manager') },
                  { value: 'agent', label: t('staff.roles.agent') },
                  { value: 'accountant', label: t('staff.roles.accountant') },
                  { value: 'maintenance', label: t('staff.roles.maintenance') },
                  { value: 'observer', label: t('staff.roles.observer') },
                ]}
                {...form.getInputProps('role')}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <MultiSelect
                label={t('form.properties')}
                placeholder={t('form.selectProperties')}
                searchable
                data={
                  propertiesData?.properties.map((prop) => ({
                    value: prop.id,
                    label: prop.name,
                  })) || []
                }
                value={form.values.propertyIds}
                onChange={(value) => form.setFieldValue('propertyIds', value)}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <MultiSelect
                label={t('form.apartments')}
                placeholder={t('form.selectApartments')}
                searchable
                data={
                  apartmentsData?.apartments.map((apt) => ({
                    value: apt.id,
                    label: `${apt.unitNumber} - ${apt.property?.name || ''}`,
                  })) || []
                }
                value={form.values.apartmentIds}
                onChange={(value) => form.setFieldValue('apartmentIds', value)}
              />
              <Text size="xs" c="dimmed" mt={4}>
                {t('form.apartmentsHint')}
              </Text>
            </Grid.Col>

            <Grid.Col span={12}>
              <Textarea
                label={t('form.notes')}
                placeholder={t('form.notesPlaceholder')}
                rows={4}
                {...form.getInputProps('notes')}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => router.back()}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" loading={createStaff.isPending || updateStaff.isPending}>
              {staffId ? (t('actions.update')) : (t('actions.create'))}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

