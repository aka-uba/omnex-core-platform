'use client';

import { useForm, zodResolver } from '@mantine/form';
import { Paper, TextInput, Textarea, Select, Button, Group, Stack, Radio } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconCalendar } from '@tabler/icons-react';
import { reportCreateSchema, type ReportCreateFormData } from '../schemas/report.schema';
import { useReportTypes } from '../hooks/useReportTypes';
import { useCreateReport } from '../hooks/useReports';
import { useRouter, usePathname } from 'next/navigation';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useTranslation } from '@/lib/i18n/client';
import dayjs from 'dayjs';

export function ReportCreateForm() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation('modules/raporlar');
  const createReportMutation = useCreateReport();
  const { reportTypes } = useReportTypes();

  const form = useForm<ReportCreateFormData>({
    initialValues: {
      name: '',
      type: '',
      description: '',
      dateRange: {
        from: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
        to: dayjs().format('YYYY-MM-DD'),
      },
      filters: {},
      visualization: {
        type: 'table',
      },
    },
    // @ts-expect-error - Mantine form zodResolver type mismatch with Zod v4
    validate: zodResolver(reportCreateSchema),
  });


  const handleSubmit = async (values: ReportCreateFormData) => {
    try {
      await createReportMutation.mutateAsync({
        name: values.name,
        type: values.type,
        dateRange: {
          from: values.dateRange.from,
          to: values.dateRange.to,
        },
        filters: values.filters || {},
        ...(values.visualization ? { 
          visualization: {
            type: values.visualization.type,
            ...(values.visualization.options ? { options: values.visualization.options } : {})
          }
        } : {}),
      });

      showToast({
        type: 'success',
        title: t('actions.success'),
        message: t('create.messages.success'),
      });

      const locale = pathname?.split('/')[1] || 'tr';
      router.push(`/${locale}/modules/raporlar`);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('actions.error'),
        message: t('create.messages.error'),
      });
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="xl">
          {/* Report Details Section */}
          <Paper shadow="sm" p="md" radius="md" className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark">
            <div className="mb-4 pb-4 border-b border-border-light dark:border-border-dark">
              <h2 className="text-[22px] font-bold text-text-primary-light dark:text-text-primary-dark">{t('create.sections.details')}</h2>
            </div>
            <Stack gap="md">
              <TextInput
                label={t('create.fields.name')}
                placeholder={t('create.fields.namePlaceholder')}
                required
                {...form.getInputProps('name')}
                className="w-full"
              />
              <Textarea
                label={t('create.fields.description')}
                placeholder={t('create.fields.descriptionPlaceholder')}
                minRows={4}
                {...form.getInputProps('description')}
                className="w-full"
              />
            </Stack>
          </Paper>

          {/* Configuration Section */}
          <Paper shadow="sm" p="md" radius="md" className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark">
            <div className="mb-4 pb-4 border-b border-border-light dark:border-border-dark">
              <h2 className="text-[22px] font-bold text-text-primary-light dark:text-text-primary-dark">{t('create.sections.configuration')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label={t('create.fields.type')}
                placeholder={t('create.fields.typePlaceholder')}
                required
                data={reportTypes.map(type => ({
                  value: type.id,
                  label: type.name,
                }))}
                {...form.getInputProps('type')}
              />
              <div className="grid grid-cols-2 gap-4">
                <DateInput
                  label={t('create.fields.startDate')}
                  placeholder={t('create.fields.startDatePlaceholder')}
                  leftSection={<IconCalendar size={20} />}
                  value={form.values.dateRange.from ? dayjs(form.values.dateRange.from).toDate() : null}
                  onChange={(value) => {
                    form.setFieldValue('dateRange', {
                      ...form.values.dateRange,
                      from: value ? dayjs(value).format('YYYY-MM-DD') : '',
                    });
                  }}
                  clearable
                />
                <DateInput
                  label={t('create.fields.endDate')}
                  placeholder={t('create.fields.endDatePlaceholder')}
                  leftSection={<IconCalendar size={20} />}
                  value={form.values.dateRange.to ? dayjs(form.values.dateRange.to).toDate() : null}
                  onChange={(value) => {
                    form.setFieldValue('dateRange', {
                      ...form.values.dateRange,
                      to: value ? dayjs(value).format('YYYY-MM-DD') : '',
                    });
                  }}
                  clearable
                />
              </div>
            </div>
          </Paper>

          {/* Output Section */}
          <Paper shadow="sm" p="md" radius="md" className="bg-panel-light dark:bg-panel-dark border border-border-light dark:border-border-dark">
            <div className="mb-4 pb-4 border-b border-border-light dark:border-border-dark">
              <h2 className="text-[22px] font-bold text-text-primary-light dark:text-text-primary-dark">{t('create.sections.output')}</h2>
            </div>
            <div>
              <p className="text-base font-medium text-text-primary-light dark:text-text-primary-dark mb-3">{t('create.fields.format')}</p>
              <Radio.Group
                value={form.values.visualization?.type || 'table'}
                onChange={(value) => form.setFieldValue('visualization.type', value as any)}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Radio
                    value="table"
                    label={t('create.formats.table')}
                    className="p-4 border border-border-light dark:border-border-dark rounded-lg"
                  />
                  <Radio
                    value="bar"
                    label={t('create.formats.bar')}
                    className="p-4 border border-border-light dark:border-border-dark rounded-lg"
                  />
                  <Radio
                    value="line"
                    label={t('create.formats.line')}
                    className="p-4 border border-border-light dark:border-border-dark rounded-lg"
                  />
                </div>
              </Radio.Group>
            </div>
          </Paper>

          {/* Action Buttons */}
          <Group justify="flex-end" gap="md">
            <Button
              variant="subtle"
              onClick={() => router.back()}
            >
              {t('create.buttons.cancel')}
            </Button>
            <Button
              type="submit"
              loading={createReportMutation.isPending}
            >
              {t('create.buttons.generate')}
            </Button>
          </Group>
      </Stack>
    </form>
  );
}

