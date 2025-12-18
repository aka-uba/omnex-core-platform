'use client';

import { Container, Paper, Stack, Group, Text, Badge, Grid, Title, Divider } from '@mantine/core';
import { IconFileText, IconArrowLeft, IconEdit } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useAgreementReport } from '@/hooks/useAgreementReports';
import { useTranslation } from '@/lib/i18n/client';
import { useRouter } from 'next/navigation';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';
import dayjs from 'dayjs';

interface AgreementReportDetailPageClientProps {
  locale: string;
  reportId: string;
}

export function AgreementReportDetailPageClient({ locale, reportId }: AgreementReportDetailPageClientProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/real-estate');
  const { data: report, isLoading, error } = useAgreementReport(reportId);

  const getTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      boss: 'violet',
      owner: 'blue',
      tenant: 'green',
      internal: 'gray',
    };
    return (
      <Badge color={typeColors[type] || 'gray'}>
        {t(`agreementReports.agreementReport.types.${type}`) || type}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: 'gray',
      sent: 'blue',
      viewed: 'green',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`agreementReports.agreementReport.status.${status}`) || status}
      </Badge>
    );
  };

  const getAgreementStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pre_agreement: 'yellow',
      signed: 'green',
      delivery_scheduled: 'blue',
      deposit_received: 'cyan',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`agreementReports.agreementReport.agreementStatus.${status}`) || status}
      </Badge>
    );
  };

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (error || !report) {
    return (
      <Container size="xl" pt="xl">
        <Text c="red">{t('common.errorLoading')}</Text>
      </Container>
    );
  }

  const recipients = report.recipients as Array<{ email: string; name?: string; type?: string }> || [];

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('agreementReports.agreementReport.detail.title')}
        description={t('agreementReports.agreementReport.detail.description')}
        namespace="modules/real-estate"
        icon={<IconFileText size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'agreementReport.title', href: `/${locale}/modules/real-estate/agreement-reports`, namespace: 'modules/real-estate' },
          { label: 'agreementReport.detail.title', namespace: 'modules/real-estate' },
        ]}
        actions={[
          {
            label: t('actions.back'),
            icon: <IconArrowLeft size={16} />,
            onClick: () => router.push(`/${locale}/modules/real-estate/agreement-reports`),
            variant: 'subtle',
          },
          {
            label: t('actions.edit'),
            icon: <IconEdit size={16} />,
            onClick: () => router.push(`/${locale}/modules/real-estate/agreement-reports/${reportId}/edit`),
            variant: 'filled',
          },
        ]}
      />

      <Stack gap="md">
        {/* Report Info */}
        <Paper p="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <div>
                <Title order={3}>
                  {t('agreementReports.agreementReport.detail.title')}
                </Title>
                <Text size="sm" c="dimmed" mt={4}>
                  {t('agreementReports.agreementReport.detail.createdAt')}: {dayjs(report.createdAt).format('DD.MM.YYYY HH:mm')}
                </Text>
              </div>
              <Group>
                {getTypeBadge(report.type)}
                {getStatusBadge(report.status)}
              </Group>
            </Group>

            <Divider />

            <Grid>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">
                  {t('form.apartment')}
                </Text>
                <Text fw={500}>
                  {report.apartment
                    ? `${report.apartment.unitNumber}${report.apartment.property ? ` - ${report.apartment.property.name}` : ''}`
                    : report.apartmentId}
                </Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">
                  {t('form.agreementStatus')}
                </Text>
                {getAgreementStatusBadge(report.agreementStatus)}
              </Grid.Col>
              {report.contractId && (
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">
                    {t('form.contract')}
                  </Text>
                  <Text fw={500}>
                    {report.contract
                      ? report.contract.contractNumber || report.contractId
                      : report.contractId}
                  </Text>
                </Grid.Col>
              )}
              {report.appointmentId && (
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">
                    {t('form.appointment')}
                  </Text>
                  <Text fw={500}>
                    {report.appointment
                      ? `${report.appointment.title} - ${dayjs(report.appointment.startDate).format('DD.MM.YYYY')}`
                      : report.appointmentId}
                  </Text>
                </Grid.Col>
              )}
              {report.rentAmount && (
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">
                    {t('form.rentAmount')}
                  </Text>
                  <Text fw={500}>
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: 'TRY',
                    }).format(Number(report.rentAmount))}
                  </Text>
                </Grid.Col>
              )}
              {report.deposit && (
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">
                    {t('form.deposit')}
                  </Text>
                  <Text fw={500}>
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: 'TRY',
                    }).format(Number(report.deposit))}
                  </Text>
                </Grid.Col>
              )}
              {report.deliveryDate && (
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">
                    {t('form.deliveryDate')}
                  </Text>
                  <Text fw={500}>{dayjs(report.deliveryDate).format('DD.MM.YYYY')}</Text>
                </Grid.Col>
              )}
              {report.contractDate && (
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">
                    {t('form.contractDate')}
                  </Text>
                  <Text fw={500}>{dayjs(report.contractDate).format('DD.MM.YYYY')}</Text>
                </Grid.Col>
              )}
              {report.specialTerms && (
                <Grid.Col span={12}>
                  <Text size="sm" c="dimmed">
                    {t('form.specialTerms')}
                  </Text>
                  <Text fw={500}>{report.specialTerms}</Text>
                </Grid.Col>
              )}
              {report.nextSteps && (
                <Grid.Col span={12}>
                  <Text size="sm" c="dimmed">
                    {t('form.nextSteps')}
                  </Text>
                  <Text fw={500}>{report.nextSteps}</Text>
                </Grid.Col>
              )}
            </Grid>
          </Stack>
        </Paper>

        {/* Recipients */}
        <Paper p="md" withBorder>
          <Title order={4} mb="md">
            {t('form.recipients')}
          </Title>
          <Stack gap="xs">
            {recipients.map((recipient, index) => (
              <Group key={index} justify="space-between">
                <div>
                  <Text size="sm" fw={500}>
                    {recipient.name || recipient.email}
                  </Text>
                  {recipient.name && (
                    <Text size="xs" c="dimmed">
                      {recipient.email}
                    </Text>
                  )}
                </div>
                {recipient.type && (
                  <Badge size="sm" color={recipient.type === 'tenant' ? 'blue' : 'gray'}>
                    {recipient.type}
                  </Badge>
                )}
              </Group>
            ))}
          </Stack>
        </Paper>

        {/* Attachments */}
        {report.attachments && report.attachments.length > 0 && (
          <Paper p="md" withBorder>
            <Title order={4} mb="md">
              {t('form.attachments')}
            </Title>
            <Text size="sm" c="dimmed">
              {report.attachments.length} {t('form.files')}
            </Text>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}








