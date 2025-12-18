'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@mantine/form';
import {
  Paper,
  Textarea,
  Select,
  Button,
  Stack,
  Grid,
  Group,
  Title,
  NumberInput,
  MultiSelect,
  Text,
  Modal,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconArrowLeft } from '@tabler/icons-react';
import {
  useAgreementReport,
  useCreateAgreementReport,
  useUpdateAgreementReport,
} from '@/hooks/useAgreementReports';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import type {
  AgreementReportType,
  AgreementStatus,
  AgreementReportRecipient,
  AgreementReportUpdateInput,
} from '@/modules/real-estate/types/agreement-report';
import { useApartments } from '@/hooks/useApartments';
import { useContracts } from '@/hooks/useContracts';
import { useAppointments } from '@/hooks/useAppointments';
import { useTenants } from '@/hooks/useTenants';
import { useCoreFileManager } from '@/hooks/useCoreFileManager';
import { useAgreementReportTemplates } from '@/hooks/useAgreementReportTemplates';
import { replaceTemplateVariables, type VariableContext } from '@/lib/utils/template-variables';
// import { IconUserPlus, IconMail, IconUsers } from '@tabler/icons-react'; // removed - unused

interface AgreementReportFormProps {
  locale: string;
  reportId?: string;
  appointmentId?: string;
}

export function AgreementReportForm({ locale, reportId, appointmentId }: AgreementReportFormProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const { data: report, isLoading: isLoadingReport } = useAgreementReport(reportId || '');
  const createReport = useCreateAgreementReport();
  const updateReport = useUpdateAgreementReport();

  // Fetch related data
  const { data: apartmentsData } = useApartments({ page: 1, pageSize: 1000 });
  const { data: contractsData } = useContracts({ page: 1, pageSize: 1000 });
  const { data: appointmentsData } = useAppointments({ page: 1, pageSize: 1000 });
  const { data: tenantsData } = useTenants({ page: 1, pageSize: 1000 });
  const { data: templatesData } = useAgreementReportTemplates({ page: 1, pageSize: 1000, isActive: true });

  // Recipient management state
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);

  // File manager for attachments (placeholder - should get from auth context)
  const { files } = useCoreFileManager({
    tenantId: 'temp-tenant-id', // TODO: Get from auth context
    module: 'real-estate',
    entityType: 'agreement-report',
    ...(reportId ? { entityId: reportId } : {}),
    userId: 'temp-user-id', // TODO: Get from auth context
    enabled: !!reportId, // Only load files when editing
  });

  const form = useForm({
    initialValues: {
      templateId: '',
      appointmentId: appointmentId || '',
      type: '' as AgreementReportType | '',
      apartmentId: '',
      contractId: '',
      agreementStatus: '' as AgreementStatus | '',
      rentAmount: 0,
      deposit: 0,
      deliveryDate: null as Date | null,
      contractDate: null as Date | null,
      specialTerms: '',
      nextSteps: '',
      recipients: [] as AgreementReportRecipient[],
    },
    validate: {
      type: (value) => (!value ? t('form.required') : null),
      apartmentId: (value) => (!value ? t('form.required') : null),
      agreementStatus: (value) => (!value ? t('form.required') : null),
      recipients: (value) => (value.length === 0 ? t('form.required') : null),
    },
  });

  // Load report data if editing
  useEffect(() => {
    if (report) {
      form.setValues({
        appointmentId: report.appointmentId || '',
        type: report.type,
        apartmentId: report.apartmentId,
        contractId: report.contractId || '',
        agreementStatus: report.agreementStatus,
        rentAmount: report.rentAmount ? Number(report.rentAmount) : 0,
        deposit: report.deposit ? Number(report.deposit) : 0,
        deliveryDate: report.deliveryDate ? new Date(report.deliveryDate) : null,
        contractDate: report.contractDate ? new Date(report.contractDate) : null,
        specialTerms: report.specialTerms || '',
        nextSteps: report.nextSteps || '',
        recipients: report.recipients || [],
      });
    }
  }, [report]);

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    const selectedTemplate = templatesData?.templates.find((t) => t.id === templateId);
    if (selectedTemplate) {
      // Get apartment data for variable replacement
      const apartment = apartmentsData?.apartments.find((a) => a.id === form.values.apartmentId);
      const contract = contractsData?.contracts.find((c) => c.id === form.values.contractId);

      // Build variable context
      const variableContext = {
        ...(apartment ? {
          apartment: {
            id: apartment.id,
            unitNumber: apartment.unitNumber,
            area: apartment.area,
            roomCount: apartment.roomCount,
            ...(apartment.rentPrice ? { rentPrice: Number(apartment.rentPrice) } : {}),
            ...(apartment.property ? {
              property: {
                name: apartment.property.name,
                address: apartment.property.address,
              }
            } : {}),
          }
        } : {}),
        ...(contract ? {
          contract: {
            id: contract.id,
            contractNumber: contract.contractNumber,
            ...(contract.startDate ? { startDate: new Date(contract.startDate) } : {}),
            ...(contract.endDate ? { endDate: new Date(contract.endDate) } : {}),
            ...(contract.rentAmount ? { rentAmount: Number(contract.rentAmount) } : {}),
          }
        } : {}),
        report: {
          ...(form.values.rentAmount > 0 ? { rentAmount: form.values.rentAmount } : {}),
          ...(form.values.deposit > 0 ? { deposit: form.values.deposit } : {}),
          ...(form.values.deliveryDate ? { deliveryDate: form.values.deliveryDate } : {}),
          ...(form.values.contractDate ? { contractDate: form.values.contractDate } : {}),
          ...(form.values.specialTerms ? { specialTerms: form.values.specialTerms } : {}),
          ...(form.values.nextSteps ? { nextSteps: form.values.nextSteps } : {}),
        },
      };

      // Replace variables in template content
      // Clean variableContext to remove undefined values for exactOptionalPropertyTypes
      const cleanedVariableContext: VariableContext = {
        report: variableContext.report,
        ...(variableContext.apartment ? { apartment: variableContext.apartment } : {}),
        ...(variableContext.contract ? { contract: variableContext.contract } : {}),
      };
      const processedContent = replaceTemplateVariables(selectedTemplate.htmlContent, cleanedVariableContext);

      // Apply processed content to specialTerms
      form.setFieldValue('specialTerms', processedContent);
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      // Collect automatic attachments
      const automaticAttachments: string[] = [];

      // Add contract documents if contract is selected
      if (values.contractId) {
        const contract = contractsData?.contracts.find((c) => c.id === values.contractId);
        if (contract?.documents && contract.documents.length > 0) {
          automaticAttachments.push(...contract.documents);
        }
      }

      // Add apartment documents if apartment is selected
      if (values.apartmentId) {
        const apartment = apartmentsData?.apartments.find((a) => a.id === values.apartmentId);
        if (apartment?.documents && apartment.documents.length > 0) {
          // Add apartment documents (limit to first 5 to avoid too many files)
          automaticAttachments.push(...apartment.documents.slice(0, 5));
        }
      }

      // Combine manual files and automatic attachments
      const allAttachments = [
        ...files.map((f) => f.id),
        ...automaticAttachments.filter((id) => !files.some((f) => f.id === id)), // Avoid duplicates
      ];

      const input = {
        ...values,
        appointmentId: values.appointmentId || undefined,
        contractId: values.contractId || undefined,
        rentAmount: values.rentAmount > 0 ? values.rentAmount : undefined,
        deposit: values.deposit > 0 ? values.deposit : undefined,
        deliveryDate: values.deliveryDate || undefined,
        contractDate: values.contractDate || undefined,
        specialTerms: values.specialTerms || undefined,
        nextSteps: values.nextSteps || undefined,
        attachments: allAttachments,
      };

      if (reportId) {
        await updateReport.mutateAsync({
          id: reportId,
          input: input as AgreementReportUpdateInput,
        });
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('agreementReports.agreementReport.update.success'),
        });
      } else {
        await createReport.mutateAsync(input as any);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('agreementReports.agreementReport.create.success'),
        });
      }

      router.push(`/${locale}/modules/real-estate/agreement-reports`);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('agreementReports.agreementReport.create.error'),
      });
    }
  };

  const handleAddRecipient = () => {
    const email = prompt(t('agreementReports.agreementReport.recipient.email'));
    if (email && email.includes('@')) {
      const name = prompt(t('agreementReports.agreementReport.recipient.name')) || undefined;
      form.setFieldValue('recipients', [
        ...form.values.recipients,
        { email, ...(name ? { name } : {}), type: 'manual' as const },
      ]);
    }
  };

  const handleAddTenantsAsRecipients = () => {
    if (selectedTenantIds.length === 0) return;

    const tenantRecipients = selectedTenantIds
      .map((tenantId) => {
        const tenant = tenantsData?.tenants.find((t) => t.id === tenantId);
        if (tenant) {
          const email = tenant.contact?.email || tenant.user?.email;
          if (email) {
            const name = tenant.contact?.name || tenant.user?.name;
            return {
              email,
              ...(name ? { name } : {}),
              type: 'tenant' as const,
            };
          }
        }
        return null;
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    form.setFieldValue('recipients', [...form.values.recipients, ...tenantRecipients]);
    setSelectedTenantIds([]);
    setShowRecipientModal(false);
  };

  // Unused function - commented out
  // const handleAddFromApartment = () => {
  //   if (!form.values.apartmentId) {
  //     showToast({
  //       type: 'error',
  //       title: t('messages.error'),
  //       message: t('agreementReports.agreementReport.selectApartmentFirst'),
  //     });
  //     return;
  //   }
  //
  //   // Get contract for this apartment
  //   const contract = contractsData?.contracts.find(
  //     (c) => c.apartmentId === form.values.apartmentId && c.isActive
  //   );
  //
  //   if (contract && contract.tenantRecordId) {
  //     const tenant = tenantsData?.tenants.find((t) => t.id === contract.tenantRecordId);
  //     if (tenant) {
  //       const email = tenant.contact?.email || tenant.user?.email;
  //       if (email) {
  //         const newRecipient = {
  //           email,
  //           email,
  //           ...(tenant.contact?.name || tenant.user?.name ? { name: tenant.contact?.name || tenant.user?.name } : {}),
  //           type: 'tenant' as const,
  //         };
  //
  //         // Check if already added
  //         const exists = form.values.recipients.some((r) => r.email === email);
  //         if (!exists) {
  //           form.setFieldValue('recipients', [...form.values.recipients, newRecipient]);
  //           showToast({
  //             type: 'success',
  //             title: t('messages.success'),
  //             message: t('agreementReports.agreementReport.tenantAdded'),
  //           });
  //         } else {
  //           showToast({
  //             type: 'info',
  //             title: t('messages.info'),
  //             message: t('agreementReports.agreementReport.recipientExists'),
  //           });
  //         }
  //       }
  //     }
  //   }
  // };

  if (isLoadingReport) {
    return <div>{tGlobal('common.loading')}</div>;
  }

  return (
    <Paper shadow="xs" p="xl">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={3}>
              {reportId
                ? t('agreementReports.edit.title')
                : t('agreementReports.create.title')}
            </Title>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => router.back()}
            >
              {t('actions.back')}
            </Button>
          </Group>

          <Grid>
            <Grid.Col span={12}>
              <Select
                label={t('form.template')}
                placeholder={t('form.selectTemplate')}
                searchable
                clearable
                data={
                  templatesData?.templates
                    .filter((t) => t.category === form.values.type || !form.values.type)
                    .map((t) => ({
                      value: t.id,
                      label: t.name,
                    })) || []
                }
                value={form.values.templateId}
                onChange={(value) => {
                  form.setFieldValue('templateId', value || '');
                  if (value) {
                    handleTemplateSelect(value);
                  }
                }}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Select
                label={t('form.type')}
                placeholder={t('form.selectType')}
                required
                data={[
                  { value: 'boss', label: t('agreementReports.agreementReport.types.boss') },
                  { value: 'owner', label: t('agreementReports.agreementReport.types.owner') },
                  { value: 'tenant', label: t('agreementReports.agreementReport.types.tenant') },
                  { value: 'internal', label: t('agreementReports.agreementReport.types.internal') },
                ]}
                {...form.getInputProps('type')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <Select
                label={t('form.apartment')}
                placeholder={t('form.selectApartment')}
                required
                searchable
                data={
                  apartmentsData?.apartments.map((apt) => ({
                    value: apt.id,
                    label: `${apt.unitNumber} - ${apt.property?.name || ''}`,
                  })) || []
                }
                {...form.getInputProps('apartmentId')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <Select
                label={t('form.contract')}
                placeholder={t('form.selectContract')}
                searchable
                clearable
                data={
                  contractsData?.contracts.map((contract) => ({
                    value: contract.id,
                    label: contract.contractNumber || contract.id,
                  })) || []
                }
                {...form.getInputProps('contractId')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <Select
                label={t('form.agreementStatus')}
                placeholder={t('form.selectAgreementStatus')}
                required
                data={[
                  { value: 'pre_agreement', label: t('agreementReports.agreementReport.agreementStatus.pre_agreement') },
                  { value: 'signed', label: t('agreementReports.agreementReport.agreementStatus.signed') },
                  { value: 'delivery_scheduled', label: t('agreementReports.agreementReport.agreementStatus.delivery_scheduled') },
                  { value: 'deposit_received', label: t('agreementReports.agreementReport.agreementStatus.deposit_received') },
                ]}
                {...form.getInputProps('agreementStatus')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <Select
                label={t('form.appointment')}
                placeholder={t('form.selectAppointment')}
                searchable
                clearable
                data={
                  appointmentsData?.appointments.map((apt) => ({
                    value: apt.id,
                    label: `${apt.title} - ${new Date(apt.startDate).toLocaleDateString()}`,
                  })) || []
                }
                {...form.getInputProps('appointmentId')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <NumberInput
                label={t('form.rentAmount')}
                placeholder={t('form.rentAmountPlaceholder')}
                min={0}
                leftSection="₺"
                {...form.getInputProps('rentAmount')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <NumberInput
                label={t('form.deposit')}
                placeholder={t('form.depositPlaceholder')}
                min={0}
                leftSection="₺"
                {...form.getInputProps('deposit')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <DateInput
                label={t('form.deliveryDate')}
                placeholder={t('form.selectDate')}
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                {...form.getInputProps('deliveryDate')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <DateInput
                label={t('form.contractDate')}
                placeholder={t('form.selectDate')}
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                {...form.getInputProps('contractDate')}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Textarea
                label={t('form.specialTerms')}
                placeholder={t('form.specialTermsPlaceholder')}
                rows={4}
                {...form.getInputProps('specialTerms')}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Textarea
                label={t('form.nextSteps')}
                placeholder={t('form.nextStepsPlaceholder')}
                rows={4}
                {...form.getInputProps('nextSteps')}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Paper p="md" withBorder>
                <Group justify="space-between" mb="md">
                  <Title order={5}>{t('form.recipients')}</Title>
                  <Button size="xs" onClick={handleAddRecipient}>
                    {t('actions.add')}
                  </Button>
                </Group>
                <Stack gap="xs">
                  {form.values.recipients.map((recipient, index) => (
                    <Group key={index} justify="space-between">
                      <Text size="sm">
                        {recipient.name || recipient.email} ({recipient.email})
                      </Text>
                      <Button
                        size="xs"
                        variant="subtle"
                        color="red"
                        onClick={() => {
                          form.setFieldValue(
                            'recipients',
                            form.values.recipients.filter((_, i) => i !== index)
                          );
                        }}
                      >
                        {t('actions.remove')}
                      </Button>
                    </Group>
                  ))}
                  {form.values.recipients.length === 0 && (
                    <Text size="sm" c="dimmed">
                      {t('agreementReports.agreementReport.noRecipients')}
                    </Text>
                  )}
                </Stack>
              </Paper>
            </Grid.Col>

            {/* Automatic Attachments Info */}
            {(form.values.contractId || form.values.apartmentId) && (
              <Grid.Col span={12}>
                <Paper p="md" withBorder style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
                  <Stack gap="xs">
                    <Group>
                      <Text size="sm" fw={500}>
                        {t('form.automaticAttachments')}
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed">
                      {t('form.automaticAttachmentsHint')}
                    </Text>
                    <Stack gap="xs">
                      {form.values.contractId && (
                        <Text size="xs">
                          • {t('form.contractDocuments')} ({contractsData?.contracts.find((c) => c.id === form.values.contractId)?.documents?.length || 0} {t('form.files')})
                        </Text>
                      )}
                      {form.values.apartmentId && (
                        <Text size="xs">
                          • {t('form.apartmentDocuments')} ({apartmentsData?.apartments.find((a) => a.id === form.values.apartmentId)?.documents?.length || 0} {t('form.files')})
                        </Text>
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              </Grid.Col>
            )}
          </Grid>

          {/* Recipient Selection Modal */}
          <Modal
            opened={showRecipientModal}
            onClose={() => {
              setShowRecipientModal(false);
              setSelectedTenantIds([]);
            }}
            title={t('agreementReports.agreementReport.selectTenants')}
            size="lg"
          >
            <Stack gap="md">
              <MultiSelect
                label={t('form.selectTenants')}
                placeholder={t('form.selectTenantsPlaceholder')}
                data={
                  tenantsData?.tenants.map((tenant) => ({
                    value: tenant.id,
                    label: tenant.contact?.name || tenant.user?.name || tenant.id,
                  })) || []
                }
                value={selectedTenantIds}
                onChange={setSelectedTenantIds}
                searchable
              />
              <Group justify="flex-end">
                <Button variant="subtle" onClick={() => setShowRecipientModal(false)}>
                  {t('actions.cancel')}
                </Button>
                <Button onClick={handleAddTenantsAsRecipients} disabled={selectedTenantIds.length === 0}>
                  {t('actions.addSelected')}
                </Button>
              </Group>
            </Stack>
          </Modal>

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => router.back()}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" loading={createReport.isPending || updateReport.isPending}>
              {reportId ? t('actions.update') : t('actions.create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

