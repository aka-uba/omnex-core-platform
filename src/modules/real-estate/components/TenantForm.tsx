'use client';

import { useEffect, useMemo } from 'react';
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
  Checkbox,
  Alert,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconArrowLeft, IconAlertTriangle } from '@tabler/icons-react';
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
      // Status
      isActive: true,

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

  // Apartment options for select - with occupied status
  const apartments = apartmentsData?.apartments;

  // Build a map of occupied apartments (apartments with active contracts OR direct assignments)
  const occupiedApartments = useMemo(() => {
    const map = new Map<string, { tenantName: string; tenantId: string }>();
    if (Array.isArray(apartments)) {
      for (const apt of apartments) {
        if (apt && apt.id) {
          // Check 1: Active contract with a different tenant
          if (apt.contracts && apt.contracts.length > 0) {
            const activeContract = apt.contracts[0];
            const tenant = activeContract?.tenantRecord;
            if (tenant && tenant.id !== tenantId) {
              const tenantName = `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || tenant.tenantNumber || 'Unknown';
              map.set(apt.id, { tenantName, tenantId: tenant.id });
              continue; // Already marked, skip to next
            }
          }

          // Check 2: Direct apartment assignment (via apartmentId) to a different tenant
          if (apt.tenants && apt.tenants.length > 0) {
            // Find the first tenant that is not the current one being edited
            const assignedTenant = apt.tenants.find((t: any) => t.id !== tenantId);
            if (assignedTenant) {
              const tenantName = `${assignedTenant.firstName || ''} ${assignedTenant.lastName || ''}`.trim() || assignedTenant.tenantNumber || 'Unknown';
              map.set(apt.id, { tenantName, tenantId: assignedTenant.id });
            }
          }
        }
      }
    }
    return map;
  }, [apartments, tenantId]);

  // Check if selected apartment is occupied by another tenant
  const selectedApartmentOccupied = useMemo(() => {
    const selectedId = form.values.apartmentId;
    if (!selectedId) return null;
    return occupiedApartments.get(selectedId) || null;
  }, [form.values.apartmentId, occupiedApartments]);

  // Load tenant data for edit
  useEffect(() => {
    if (isEdit && tenantData && !isLoadingTenant) {
      if (form.values.tenantNumber === '') {
        form.setValues({
          isActive: (tenantData as any).isActive !== undefined ? (tenantData as any).isActive : true,
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
          email: (tenantData as any).email && (tenantData as any).email.trim() !== '' ? (tenantData as any).email.trim() : '',
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
        isActive: values.isActive ?? true,
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
        email: values.email && values.email.trim() !== '' ? values.email.trim() : undefined,
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

  // Build apartment options with occupied status
  const apartmentOptions: { value: string; label: string; disabled?: boolean }[] = [];
  if (Array.isArray(apartments)) {
    for (const apt of apartments) {
      if (apt && apt.id) {
        const occupied = occupiedApartments.get(apt.id);
        const baseLabel = `${apt.property?.name || t('form.unknownProperty')} - ${apt.unitNumber || ''}${apt.floor ? ` (${t('form.floor')} ${apt.floor})` : ''}`;
        const label = occupied
          ? `${baseLabel} ⚠️ ${t('tenantForm.occupiedBy') || 'Occupied by'}: ${occupied.tenantName}`
          : baseLabel;
        apartmentOptions.push({
          value: apt.id,
          label,
        });
      }
    }
  }

  return (
    <Paper shadow="xs" p="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          {/* Aktiv Checkbox - matching old project position */}
          <Checkbox
            label={t('status.active')}
            {...form.getInputProps('isActive', { type: 'checkbox' })}
          />

          {/* Mietertyp (Tenant Type) */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('tenants.fields.tenantType')}
                placeholder={t('tenantForm.selectType')}
                data={tenantTypeOptions}
                {...form.getInputProps('tenantType')}
              />
            </Grid.Col>
          </Grid>

          {/* Unternehmensname (Optional) - Company Name always visible */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={`${t('tenants.fields.companyName')} (${tGlobal('common.optional')})`}
                placeholder={t('form.companyNamePlaceholder')}
                {...form.getInputProps('companyName')}
              />
            </Grid.Col>
          </Grid>

          {/* Anrede, Vorname, Nachname */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Select
                label={t('tenants.fields.salutation')}
                placeholder={t('tenantForm.selectSalutation')}
                data={salutationOptions}
                clearable
                {...form.getInputProps('salutation')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4.5 }}>
              <TextInput
                label={t('tenants.fields.firstName')}
                placeholder={t('form.firstNamePlaceholder')}
                required={form.values.tenantType === 'person'}
                {...form.getInputProps('firstName')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4.5 }}>
              <TextInput
                label={t('tenants.fields.lastName')}
                placeholder={t('form.lastNamePlaceholder')}
                required={form.values.tenantType === 'person'}
                {...form.getInputProps('lastName')}
              />
            </Grid.Col>
          </Grid>

          {/* Straße, Hausnummer, Postleitzahl, Stadt */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <TextInput
                label={t('tenants.fields.street')}
                placeholder={t('form.streetPlaceholder')}
                {...form.getInputProps('street')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <TextInput
                label={t('tenants.fields.houseNumber')}
                placeholder={t('form.houseNumberPlaceholder')}
                {...form.getInputProps('houseNumber')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <TextInput
                label={t('tenants.fields.postalCode')}
                placeholder={t('form.postalCodePlaceholder')}
                {...form.getInputProps('postalCode')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <TextInput
                label={t('tenants.fields.city')}
                placeholder={t('form.cityPlaceholder')}
                {...form.getInputProps('city')}
              />
            </Grid.Col>
          </Grid>

          {/* Staatsangehörigkeit, Festnetz, Mobile, E-Mail */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <TextInput
                label={t('tenants.fields.nationality')}
                placeholder={t('tenantForm.nationalityPlaceholder')}
                {...form.getInputProps('nationality')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <TextInput
                label={t('tenants.fields.phone')}
                placeholder={t('form.phonePlaceholder')}
                {...form.getInputProps('phone')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <TextInput
                label={t('tenants.fields.mobile')}
                placeholder={t('form.mobilePlaceholder')}
                {...form.getInputProps('mobile')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <TextInput
                label={t('tenants.fields.email')}
                placeholder={t('form.emailPlaceholder')}
                type="email"
                {...form.getInputProps('email')}
              />
            </Grid.Col>
          </Grid>

          {/* Geburtsort, Geburtsdatum, Steuernummer */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <TextInput
                label={t('tenants.fields.birthPlace')}
                placeholder={t('tenantForm.birthPlacePlaceholder')}
                {...form.getInputProps('birthPlace')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <DateInput
                label={t('tenants.fields.birthDate')}
                placeholder="tt.mm.jjjj"
                valueFormat="DD.MM.YYYY"
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                clearable
                {...form.getInputProps('birthDate')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <TextInput
                label={t('tenants.fields.taxNumber')}
                placeholder={t('tenantForm.taxNumberPlaceholder')}
                {...form.getInputProps('taxNumber')}
              />
            </Grid.Col>
          </Grid>

          <Divider my="md" />

          {/* Extra Fields Section - New features not in old project */}
          <Title order={5}>{t('tenantForm.additionalInfo')}</Title>

          {/* Apartment Assignment */}
          <Grid>
            <Grid.Col span={12}>
              <Select
                label={t('form.apartment')}
                placeholder={t('form.selectApartment')}
                data={apartmentOptions}
                searchable
                clearable
                nothingFoundMessage={t('form.noApartmentsFound')}
                {...form.getInputProps('apartmentId')}
              />
              {/* Warning if selected apartment is occupied by another tenant */}
              {selectedApartmentOccupied && (
                <Alert
                  icon={<IconAlertTriangle size={16} />}
                  title={t('tenantForm.apartmentOccupiedWarning') || 'Apartment Already Occupied'}
                  color="orange"
                  mt="xs"
                >
                  {t('tenantForm.apartmentOccupiedMessage', { tenantName: selectedApartmentOccupied.tenantName }) ||
                    `This apartment currently has an active contract with ${selectedApartmentOccupied.tenantName}. Assigning this apartment may cause conflicts.`}
                </Alert>
              )}
            </Grid.Col>
          </Grid>

          {/* Tenant Number, Move Dates */}
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <TextInput
                label={t('form.tenantNumber')}
                placeholder={t('form.tenantNumberPlaceholder')}
                required
                {...form.getInputProps('tenantNumber')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <DateInput
                label={t('form.moveInDate')}
                placeholder={t('form.moveInDatePlaceholder')}
                valueFormat="DD.MM.YYYY"
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                clearable
                {...form.getInputProps('moveInDate')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <DateInput
                label={t('form.moveOutDate')}
                placeholder={t('form.moveOutDatePlaceholder')}
                valueFormat="DD.MM.YYYY"
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                clearable
                {...form.getInputProps('moveOutDate')}
              />
            </Grid.Col>
          </Grid>

          {/* Notes */}
          <Grid>
            <Grid.Col span={12}>
              <Textarea
                label={t('form.notes')}
                placeholder={t('form.notesPlaceholder')}
                rows={4}
                {...form.getInputProps('notes')}
              />
            </Grid.Col>
          </Grid>

          {/* System Fields */}
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

          <Divider my="md" />

          {/* Media Section */}
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

