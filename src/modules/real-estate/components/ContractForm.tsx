'use client';

import { useEffect, useState } from 'react';
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
  NumberInput,
  Switch,
  Text,
  ActionIcon,
  Badge,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { Dropzone, FileWithPath } from '@mantine/dropzone';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { IconArrowLeft, IconUpload, IconFile, IconTrash } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useCreateContract, useUpdateContract, useContract } from '@/hooks/useContracts';
import { useApartments } from '@/hooks/useApartments';
import { useTenants } from '@/hooks/useTenants';
import { useContractTemplates } from '@/hooks/useContractTemplates';
import { useTranslation } from '@/lib/i18n/client';
import { contractCreateSchema } from '@/modules/real-estate/schemas/contract.schema';
import type { ContractType, ContractStatus, PaymentType } from '@/modules/real-estate/types/contract';
import { useCoreFileManager } from '@/hooks/useCoreFileManager';

interface ContractFormProps {
  locale: string;
  contractId?: string;
}

export function ContractForm({ locale, contractId }: ContractFormProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();
  const { data: contractData, isLoading: isLoadingContract } = useContract(contractId || '');
  const { data: apartmentsData } = useApartments({ page: 1, pageSize: 1000 });
  const { data: tenantsData } = useTenants({ page: 1, pageSize: 1000 });
  const { data: templatesData } = useContractTemplates({ page: 1, pageSize: 1000, isActive: true });

  const isEdit = !!contractId;
  
  // File management - placeholder values for now (should come from auth context)
  const [tenantId] = useState<string>('temp-tenant-id');
  const [userId] = useState<string>('temp-user-id');
  
  // Initialize file manager (only when contractId is available for edit mode)
  const fileManager = useCoreFileManager({
    tenantId,
    module: 'real-estate',
    entityType: 'contract',
    ...(contractId ? { entityId: contractId } : {}),
    userId,
    enabled: isEdit && !!contractId,
  });

  const form = useForm({
    initialValues: {
      apartmentId: '',
      tenantRecordId: '',
      templateId: null as string | null,
      contractNumber: '',
      type: 'rental' as ContractType,
      startDate: null as Date | null,
      endDate: null as Date | null,
      renewalDate: null as Date | null,
      rentAmount: 0,
      deposit: null as number | null,
      currency: 'TRY',
      paymentType: null as PaymentType | null,
      paymentDay: null as number | null,
      autoRenewal: false,
      renewalNoticeDays: 30,
      increaseRate: null as number | null,
      status: 'active' as ContractStatus,
      documents: [] as string[],
      terms: '',
      notes: '',
    },
    validate: {
      apartmentId: (value) => (!value ? t('form.apartment') + ' ' + tGlobal('common.required') : null),
      tenantRecordId: (value) => (!value ? t('form.tenant') + ' ' + tGlobal('common.required') : null),
      contractNumber: (value) => (!value ? t('form.contractNumber') + ' ' + tGlobal('common.required') : null),
      startDate: (value) => (!value ? t('form.startDate') + ' ' + tGlobal('common.required') : null),
      rentAmount: (value) => (value <= 0 ? t('form.rentAmount') + ' ' + t('form.mustBePositive') : null),
    },
  });

  // Load contract data for edit
  useEffect(() => {
    if (isEdit && contractData && !isLoadingContract) {
      if (form.values.contractNumber === '') {
        form.setValues({
          apartmentId: contractData.apartmentId,
          tenantRecordId: contractData.tenantRecordId,
          templateId: contractData.templateId || null,
          contractNumber: contractData.contractNumber,
          type: contractData.type,
          startDate: contractData.startDate ? new Date(contractData.startDate) : null,
          endDate: contractData.endDate ? new Date(contractData.endDate) : null,
          renewalDate: contractData.renewalDate ? new Date(contractData.renewalDate) : null,
          rentAmount: Number(contractData.rentAmount),
          deposit: contractData.deposit != null ? Number(contractData.deposit) : null,
          currency: contractData.currency,
          paymentType: contractData.paymentType || null,
          paymentDay: contractData.paymentDay || null,
          autoRenewal: contractData.autoRenewal,
          renewalNoticeDays: contractData.renewalNoticeDays || 30,
          increaseRate: contractData.increaseRate ? Number(contractData.increaseRate) : null,
          status: contractData.status,
          documents: contractData.documents || [],
          terms: contractData.terms || '',
          notes: contractData.notes || '',
        });
      }
    }
  }, [isEdit, contractData, isLoadingContract, form]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const formData = {
        apartmentId: values.apartmentId,
        tenantRecordId: values.tenantRecordId,
        templateId: values.templateId || undefined,
        contractNumber: values.contractNumber,
        type: values.type,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
        renewalDate: values.renewalDate || undefined,
        rentAmount: values.rentAmount,
        deposit: values.deposit ?? undefined,
        currency: values.currency,
        paymentType: values.paymentType || undefined,
        paymentDay: values.paymentDay ?? undefined,
        autoRenewal: values.autoRenewal,
        renewalNoticeDays: values.renewalNoticeDays ?? undefined,
        increaseRate: values.increaseRate ?? undefined,
        status: values.status,
        documents: values.documents || [],
        terms: values.terms || undefined,
        notes: values.notes || undefined,
      };

      const validatedData = contractCreateSchema.parse(formData) as any;

      if (isEdit && contractId) {
        await updateContract.mutateAsync({
          id: contractId,
          input: validatedData as any,
        });
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('messages.updateSuccess'),
        });
      } else {
        await createContract.mutateAsync(validatedData as any);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('messages.createSuccess'),
        });
      }

      router.push(`/${locale}/modules/real-estate/contracts`);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('messages.createError'),
      });
    }
  };

  if (isEdit && isLoadingContract) {
    return <div>{tGlobal('common.loading')}</div>;
  }

  const apartmentOptions = apartmentsData?.apartments.map(a => ({
    value: a.id,
    label: `${a.unitNumber} - ${a.property?.name || ''}`,
  })) || [];

  const tenantOptions = tenantsData?.tenants.map(t => ({
    value: t.id,
    label: t.tenantNumber || t.id,
  })) || [];

  const templateOptions = templatesData?.templates.map(t => ({
    value: t.id,
    label: `${t.name} (${t.type})`,
  })) || [];

  return (
    <Paper shadow="xs" p="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('form.apartment')}
                placeholder={t('form.apartmentPlaceholder')}
                required
                data={apartmentOptions}
                searchable
                {...form.getInputProps('apartmentId')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('form.tenant')}
                placeholder={t('form.tenantPlaceholder')}
                required
                data={tenantOptions}
                searchable
                {...form.getInputProps('tenantRecordId')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('form.template')}
                placeholder={t('form.templatePlaceholder')}
                data={templateOptions}
                searchable
                clearable
                {...form.getInputProps('templateId')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('form.contractNumber')}
                placeholder={t('form.contractNumberPlaceholder')}
                required
                {...form.getInputProps('contractNumber')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('form.type')}
                placeholder={t('form.typePlaceholder')}
                required
                data={[
                  { value: 'rental', label: t('types.rental') },
                  { value: 'sale', label: t('types.sale') },
                  { value: 'lease', label: t('types.lease') },
                ]}
                {...form.getInputProps('type')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <DateInput
                label={t('form.startDate')}
                placeholder={t('form.startDatePlaceholder')}
                required
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                {...form.getInputProps('startDate')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <DateInput
                label={t('form.endDate')}
                placeholder={t('form.endDatePlaceholder')}
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                {...form.getInputProps('endDate')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <DateInput
                label={t('form.renewalDate')}
                placeholder={t('form.renewalDatePlaceholder')}
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                {...form.getInputProps('renewalDate')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('form.rentAmount')}
                placeholder={t('form.rentAmountPlaceholder')}
                required
                min={0}
                decimalScale={2}
                {...form.getInputProps('rentAmount')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('form.deposit')}
                placeholder={t('form.depositPlaceholder')}
                min={0}
                decimalScale={2}
                {...form.getInputProps('deposit')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <TextInput
                label={t('form.currency')}
                placeholder={t('form.currencyPlaceholder')}
                {...form.getInputProps('currency')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Select
                label={t('form.paymentType')}
                placeholder={t('form.paymentTypePlaceholder')}
                data={[
                  { value: 'cash', label: t('types.cash') },
                  { value: 'bank_transfer', label: t('types.bankTransfer') },
                  { value: 'auto_debit', label: t('types.autoDebit') },
                ]}
                {...form.getInputProps('paymentType')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label={t('form.paymentDay')}
                placeholder={t('form.paymentDayPlaceholder')}
                min={1}
                max={31}
                {...form.getInputProps('paymentDay')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Switch
                label={t('form.autoRenewal')}
                {...form.getInputProps('autoRenewal', { type: 'checkbox' })}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('form.renewalNoticeDays')}
                placeholder={t('form.renewalNoticeDaysPlaceholder')}
                min={0}
                max={365}
                {...form.getInputProps('renewalNoticeDays')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('form.increaseRate')}
                placeholder={t('form.increaseRatePlaceholder')}
                min={0}
                max={1}
                decimalScale={4}
                {...form.getInputProps('increaseRate')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('form.status')}
                placeholder={t('form.statusPlaceholder')}
                required
                data={[
                  { value: 'draft', label: t('contracts.status.draft') },
                  { value: 'active', label: t('contracts.status.active') },
                  { value: 'expired', label: t('contracts.status.expired') },
                  { value: 'terminated', label: t('contracts.status.terminated') },
                ]}
                {...form.getInputProps('status')}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea
                label={t('form.terms')}
                placeholder={t('form.termsPlaceholder')}
                rows={4}
                {...form.getInputProps('terms')}
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
            <Grid.Col span={12}>
              <Stack gap="sm">
                <Text size="sm" fw={500}>
                  {t('form.documents')}
                </Text>
                {isEdit && contractId ? (
                  // Show existing files from CoreFile system
                  <Stack gap="xs">
                    {fileManager.files.length > 0 ? (
                      fileManager.files.map((file) => (
                        <Group key={file.id} justify="space-between" p="xs" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: '4px' }}>
                          <Group gap="xs">
                            <IconFile size={18} />
                            <Text size="sm">{file.originalName}</Text>
                            <Badge size="xs" variant="light">
                              {(file.size / 1024).toFixed(2)} KB
                            </Badge>
                          </Group>
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={async () => {
                              try {
                                await fileManager.deleteFile(file.id);
                                showToast({
                                  type: 'success',
                                  title: t('messages.success'),
                                  message: t('messages.fileDeleted'),
                                });
                              } catch (error) {
                                showToast({
                                  type: 'error',
                                  title: t('messages.error'),
                                  message: error instanceof Error ? error.message : t('messages.fileDeleteError'),
                                });
                              }
                            }}
                            loading={fileManager.isDeleting}
                          >
                            <IconTrash size={18} />
                          </ActionIcon>
                        </Group>
                      ))
                    ) : (
                      <Text size="sm" c="dimmed">
                        {t('form.noDocuments')}
                      </Text>
                    )}
                    <Dropzone
                      onDrop={async (files: FileWithPath[]) => {
                        for (const file of files) {
                          try {
                            const uploadedFile = await fileManager.uploadFile({
                              file,
                              title: file.name,
                            });
                            showToast({
                              type: 'success',
                              title: t('messages.success'),
                              message: t('messages.fileUploaded'),
                            });
                            // Update form documents array
                            form.setFieldValue('documents', [...form.values.documents, uploadedFile.id]);
                          } catch (error) {
                            showToast({
                              type: 'error',
                              title: t('messages.error'),
                              message: error instanceof Error ? error.message : (t('messages.fileUploadError')),
                            });
                          }
                        }
                      }}
                      accept={['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
                      maxSize={10 * 1024 * 1024} // 10MB
                      loading={fileManager.isUploading}
                    >
                      <Group justify="center" gap="xl" mih={100} style={{ pointerEvents: 'none' }}>
                        <IconUpload size={32} />
                        <div>
                          <Text size="sm" inline>
                            {t('form.uploadDocuments')}
                          </Text>
                          <Text size="xs" c="dimmed" inline mt={7}>
                            {t('form.uploadDocumentsHint')}
                          </Text>
                        </div>
                      </Group>
                    </Dropzone>
                  </Stack>
                ) : (
                  // For new contracts, show simple dropzone
                  <Dropzone
                    onDrop={async (files: FileWithPath[]) => {
                      // For new contracts, files will be uploaded after contract creation
                      // Store file IDs temporarily
                      for (const _file of files) {
                        try {
                          // Upload to temporary location or store for later
                          // For now, we'll need to upload after contract is created
                          // This is a limitation - we need contractId first
                          showToast({
                            type: 'info',
                            title: t('messages.info'),
                            message: t('messages.uploadAfterCreate'),
                          });
                        } catch (error) {
                          showToast({
                            type: 'error',
                            title: t('messages.error'),
                            message: error instanceof Error ? error.message : t('messages.fileUploadError'),
                          });
                        }
                      }
                    }}
                    accept={['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
                    maxSize={10 * 1024 * 1024} // 10MB
                  >
                    <Group justify="center" gap="xl" mih={100} style={{ pointerEvents: 'none' }}>
                      <IconUpload size={32} />
                      <div>
                        <Text size="sm" inline>
                          {t('form.uploadDocuments')}
                        </Text>
                        <Text size="xs" c="dimmed" inline mt={7}>
                          {t('form.uploadDocumentsHint')}
                        </Text>
                      </div>
                    </Group>
                  </Dropzone>
                )}
              </Stack>
            </Grid.Col>
          </Grid>

          <Group justify="space-between" mt="md">
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => router.push(`/${locale}/modules/real-estate/contracts`)}
            >
              {tGlobal('form.cancel')}
            </Button>
            <Button type="submit" loading={createContract.isPending || updateContract.isPending}>
              {isEdit ? t('actions.update') : t('actions.create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

