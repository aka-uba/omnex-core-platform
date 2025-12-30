'use client';

import { useEffect } from 'react';
import { useForm } from '@mantine/form';
import {
  Paper,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Grid,
  Select,
  Divider,
  Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconArrowLeft, IconUser, IconBuilding, IconMapPin, IconPhone, IconId, IconHome } from '@tabler/icons-react';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useRouter } from 'next/navigation';
import { useCreateTenant, useUpdateTenant, useTenant } from '@/hooks/useTenants';
import { useApartments } from '@/hooks/useApartments';
import { useTranslation } from '@/lib/i18n/client';
import { tenantCreateSchema } from '@/modules/real-estate/schemas/tenant.schema';
import { MediaGallery } from './MediaGallery';
import { useAuth } from '@/hooks/useAuth';

interface TenantFormProps {
  locale: string;
  tenantId?: string;
}

export function TenantForm({ locale, tenantId }: TenantFormProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const { data: tenantData, isLoading: isLoadingTenant } = useTenant(tenantId || '');
  const { data: apartmentsData } = useApartments({ pageSize: 1000 });
  const { user } = useAuth();

  const isEdit = !!tenantId;

  const form = useForm({
    initialValues: {
      // System fields
      userId: '',
      contactId: '',
      apartmentId: '',
      tenantNumber: '',

      // Type
      tenantType: 'person' as 'person' | 'company',
      companyName: '',

      // Personal info
      salutation: '' as string,
      firstName: '',
      lastName: '',
      birthDate: null as Date | null,
      birthPlace: '',

      // Address
      street: '',
      houseNumber: '',
      postalCode: '',
      city: '',

      // Contact
      phone: '',
      mobile: '',
      email: '',

      // Additional
      nationality: '',
      taxNumber: '',

      // Dates
      moveInDate: null as Date | null,
      moveOutDate: null as Date | null,

      // Notes
      notes: '',

      // Media
      images: [] as string[],
      documents: [] as string[],
      coverImage: undefined as string | undefined,
    },
    validate: {
      tenantNumber: (value) => (!value ? t('form.tenantNumber') + ' ' + tGlobal('common.required') : null),
      firstName: (value, values) => (values.tenantType === 'person' && !value ? t('form.firstName') + ' ' + tGlobal('common.required') : null),
      lastName: (value, values) => (values.tenantType === 'person' && !value ? t('form.lastName') + ' ' + tGlobal('common.required') : null),
      companyName: (value, values) => (values.tenantType === 'company' && !value ? t('form.companyName') + ' ' + tGlobal('common.required') : null),
    },
  });

  // Load tenant data for edit
  useEffect(() => {
    if (isEdit && tenantData && !isLoadingTenant) {
      if (form.values.tenantNumber === '') {
        form.setValues({
          userId: tenantData.userId ?? '',
          contactId: tenantData.contactId ?? '',
          apartmentId: tenantData.apartmentId ?? '',
          tenantNumber: tenantData.tenantNumber || '',
          tenantType: (tenantData as any).tenantType || 'person',
          companyName: (tenantData as any).companyName || '',
          salutation: (tenantData as any).salutation || '',
          firstName: (tenantData as any).firstName || '',
          lastName: (tenantData as any).lastName || '',
          birthDate: (tenantData as any).birthDate ? new Date((tenantData as any).birthDate) : null,
          birthPlace: (tenantData as any).birthPlace || '',
          street: (tenantData as any).street || '',
          houseNumber: (tenantData as any).houseNumber || '',
          postalCode: (tenantData as any).postalCode || '',
          city: (tenantData as any).city || '',
          phone: (tenantData as any).phone || '',
          mobile: (tenantData as any).mobile || '',
          email: (tenantData as any).email || '',
          nationality: (tenantData as any).nationality || '',
          taxNumber: (tenantData as any).taxNumber || '',
          moveInDate: tenantData.moveInDate ? new Date(tenantData.moveInDate) : null,
          moveOutDate: tenantData.moveOutDate ? new Date(tenantData.moveOutDate) : null,
          notes: tenantData.notes || '',
          images: (tenantData as any).images || [],
          documents: (tenantData as any).documents || [],
          coverImage: (tenantData as any).coverImage ?? undefined,
        });
      }
    }
  }, [isEdit, tenantData, isLoadingTenant, form]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const formData = {
        userId: values.userId || undefined,
        contactId: values.contactId || undefined,
        apartmentId: values.apartmentId || undefined,
        tenantNumber: values.tenantNumber || undefined,
        tenantType: values.tenantType || undefined,
        companyName: values.tenantType === 'company' ? values.companyName || undefined : undefined,
        salutation: values.salutation || undefined,
        firstName: values.firstName || undefined,
        lastName: values.lastName || undefined,
        birthDate: values.birthDate || undefined,
        birthPlace: values.birthPlace || undefined,
        street: values.street || undefined,
        houseNumber: values.houseNumber || undefined,
        postalCode: values.postalCode || undefined,
        city: values.city || undefined,
        phone: values.phone || undefined,
        mobile: values.mobile || undefined,
        email: values.email || undefined,
        nationality: values.nationality || undefined,
        taxNumber: values.taxNumber || undefined,
        moveInDate: values.moveInDate || undefined,
        moveOutDate: values.moveOutDate || undefined,
        notes: values.notes || undefined,
        images: values.images || [],
        documents: values.documents || [],
        coverImage: values.coverImage || undefined,
      };

      const validatedData = tenantCreateSchema.parse(formData) as any;

      if (isEdit && tenantId) {
        await updateTenant.mutateAsync({
          id: tenantId,
          input: validatedData as any,
        });
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('messages.updateSuccess'),
        });
      } else {
        await createTenant.mutateAsync(validatedData as any);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('messages.createSuccess'),
        });
      }

      router.push(`/${locale}/modules/real-estate/tenants`);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('messages.createError'),
      });
    }
  };

  if (isEdit && isLoadingTenant) {
    return <div>{tGlobal('common.loading')}</div>;
  }

  const tenantTypeOptions = [
    { value: 'person', label: t('tenantForm.typePerson') || 'Person' },
    { value: 'company', label: t('tenantForm.typeCompany') || 'Company' },
  ];

  const salutationOptions = [
    { value: 'Herr', label: t('tenantForm.salutationMr') || 'Mr.' },
    { value: 'Frau', label: t('tenantForm.salutationMs') || 'Ms.' },
  ];

  // Group apartments by property name
  const apartmentOptions = Array.isArray(apartmentsData?.apartments)
    ? apartmentsData.apartments.map((apt) => ({
        value: apt.id,
        label: `${apt.property?.name || t('form.unknownProperty')} - ${apt.unitNumber}${apt.floor ? ` (${t('form.floor')} ${apt.floor})` : ''}`,
        group: apt.property?.name || t('form.unknownProperty'),
      }))
    : [];

  return (
    <Paper shadow="xs" p="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          {/* Basic Info Section */}
          <div>
            <Group gap="xs" mb="md">
              <IconId size={20} />
              <Title order={5}>{t('tenantForm.basicInfo') || 'Basic Information'}</Title>
            </Group>
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label={t('form.tenantNumber')}
                  placeholder={t('form.tenantNumberPlaceholder')}
                  required
                  {...form.getInputProps('tenantNumber')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label={t('tenantForm.tenantType') || 'Tenant Type'}
                  placeholder={t('tenantForm.selectType') || 'Select type'}
                  data={tenantTypeOptions}
                  {...form.getInputProps('tenantType')}
                />
              </Grid.Col>
            </Grid>
          </div>

          <Divider />

          {/* Apartment Assignment Section */}
          <div>
            <Group gap="xs" mb="md">
              <IconHome size={20} />
              <Title order={5}>{t('tenantForm.apartmentAssignment') || 'Apartment Assignment'}</Title>
            </Group>
            <Grid>
              <Grid.Col span={12}>
                <Select
                  label={t('form.apartment') || 'Apartment'}
                  placeholder={t('form.selectApartment') || 'Select apartment'}
                  data={apartmentOptions || []}
                  searchable
                  clearable
                  nothingFoundMessage={t('form.noApartmentsFound') || 'No apartments found'}
                  {...form.getInputProps('apartmentId')}
                />
              </Grid.Col>
            </Grid>
          </div>

          <Divider />

          {/* Personal/Company Info Section */}
          <div>
            <Group gap="xs" mb="md">
              {form.values.tenantType === 'company' ? <IconBuilding size={20} /> : <IconUser size={20} />}
              <Title order={5}>
                {form.values.tenantType === 'company'
                  ? (t('tenantForm.companyInfo') || 'Company Information')
                  : (t('tenantForm.personalInfo') || 'Personal Information')
                }
              </Title>
            </Group>
            <Grid>
              {form.values.tenantType === 'company' ? (
                <Grid.Col span={12}>
                  <TextInput
                    label={t('form.companyName') || 'Company Name'}
                    placeholder={t('form.companyNamePlaceholder') || 'Enter company name'}
                    required
                    {...form.getInputProps('companyName')}
                  />
                </Grid.Col>
              ) : (
                <>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Select
                      label={t('tenantForm.salutation') || 'Salutation'}
                      placeholder={t('tenantForm.selectSalutation') || 'Select'}
                      data={salutationOptions}
                      clearable
                      {...form.getInputProps('salutation')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput
                      label={t('form.firstName') || 'First Name'}
                      placeholder={t('form.firstNamePlaceholder') || 'Enter first name'}
                      required
                      {...form.getInputProps('firstName')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <TextInput
                      label={t('form.lastName') || 'Last Name'}
                      placeholder={t('form.lastNamePlaceholder') || 'Enter last name'}
                      required
                      {...form.getInputProps('lastName')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <DateInput
                      label={t('tenantForm.birthDate') || 'Birth Date'}
                      placeholder={t('tenantForm.birthDatePlaceholder') || 'Select birth date'}
                      locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                      clearable
                      {...form.getInputProps('birthDate')}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                      label={t('tenantForm.birthPlace') || 'Birth Place'}
                      placeholder={t('tenantForm.birthPlacePlaceholder') || 'Enter birth place'}
                      {...form.getInputProps('birthPlace')}
                    />
                  </Grid.Col>
                </>
              )}
            </Grid>
          </div>

          <Divider />

          {/* Address Section */}
          <div>
            <Group gap="xs" mb="md">
              <IconMapPin size={20} />
              <Title order={5}>{t('tenantForm.address') || 'Address'}</Title>
            </Group>
            <Grid>
              <Grid.Col span={{ base: 12, md: 8 }}>
                <TextInput
                  label={t('form.street') || 'Street'}
                  placeholder={t('form.streetPlaceholder') || 'Enter street name'}
                  {...form.getInputProps('street')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput
                  label={t('form.houseNumber') || 'House Number'}
                  placeholder={t('form.houseNumberPlaceholder') || 'No.'}
                  {...form.getInputProps('houseNumber')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput
                  label={t('form.postalCode') || 'Postal Code'}
                  placeholder={t('form.postalCodePlaceholder') || 'Enter postal code'}
                  {...form.getInputProps('postalCode')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 8 }}>
                <TextInput
                  label={t('form.city') || 'City'}
                  placeholder={t('form.cityPlaceholder') || 'Enter city'}
                  {...form.getInputProps('city')}
                />
              </Grid.Col>
            </Grid>
          </div>

          <Divider />

          {/* Contact Section */}
          <div>
            <Group gap="xs" mb="md">
              <IconPhone size={20} />
              <Title order={5}>{t('tenantForm.contactInfo') || 'Contact Information'}</Title>
            </Group>
            <Grid>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput
                  label={t('form.phone') || 'Phone'}
                  placeholder={t('form.phonePlaceholder') || 'Enter phone number'}
                  {...form.getInputProps('phone')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput
                  label={t('form.mobile') || 'Mobile'}
                  placeholder={t('form.mobilePlaceholder') || 'Enter mobile number'}
                  {...form.getInputProps('mobile')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput
                  label={t('form.email') || 'Email'}
                  placeholder={t('form.emailPlaceholder') || 'Enter email'}
                  type="email"
                  {...form.getInputProps('email')}
                />
              </Grid.Col>
            </Grid>
          </div>

          <Divider />

          {/* Additional Info Section */}
          <div>
            <Title order={5} mb="md">{t('tenantForm.additionalInfo') || 'Additional Information'}</Title>
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label={t('tenantForm.nationality') || 'Nationality'}
                  placeholder={t('tenantForm.nationalityPlaceholder') || 'Enter nationality'}
                  {...form.getInputProps('nationality')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label={t('tenantForm.taxNumber') || 'Tax Number'}
                  placeholder={t('tenantForm.taxNumberPlaceholder') || 'Enter tax number'}
                  {...form.getInputProps('taxNumber')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <DateInput
                  label={t('form.moveInDate')}
                  placeholder={t('form.moveInDatePlaceholder')}
                  locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                  clearable
                  {...form.getInputProps('moveInDate')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <DateInput
                  label={t('form.moveOutDate')}
                  placeholder={t('form.moveOutDatePlaceholder')}
                  locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                  clearable
                  {...form.getInputProps('moveOutDate')}
                />
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
          </div>

          <Divider />

          {/* System Fields (hidden but accessible for admin) */}
          <div>
            <Title order={5} mb="md">{t('tenantForm.systemFields') || 'System Fields'}</Title>
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label={t('form.userId')}
                  placeholder={t('form.userIdPlaceholder')}
                  {...form.getInputProps('userId')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label={t('form.contactId')}
                  placeholder={t('form.contactIdPlaceholder')}
                  {...form.getInputProps('contactId')}
                />
              </Grid.Col>
            </Grid>
          </div>

          <Divider />

          {/* Media Section */}
          <div>
            <MediaGallery
              tenantId="temp-tenant-id"
              {...(tenantId ? { entityId: tenantId } : {})}
              entityType="tenant"
              images={form.values.images}
              documents={form.values.documents}
              {...(form.values.coverImage ? { coverImage: form.values.coverImage } : {})}
              onImagesChange={(images) => form.setFieldValue('images', images)}
              onDocumentsChange={(documents) => form.setFieldValue('documents', documents)}
              onCoverImageChange={(coverImage) => form.setFieldValue('coverImage', coverImage ?? undefined)}
              userId={user?.id || 'system'}
            />
          </div>

          <Group justify="space-between" mt="md">
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => router.push(`/${locale}/modules/real-estate/tenants`)}
            >
              {tGlobal('form.cancel')}
            </Button>
            <Button type="submit" loading={createTenant.isPending || updateTenant.isPending}>
              {isEdit ? t('actions.update') : t('actions.create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

