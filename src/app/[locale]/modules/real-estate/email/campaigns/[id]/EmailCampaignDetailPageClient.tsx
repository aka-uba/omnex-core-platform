'use client';

import { Container, Paper, Stack, Group, Text, Badge, Grid, Title, Divider, Skeleton } from '@mantine/core';
import { IconMail } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useEmailCampaign } from '@/hooks/useEmailCampaigns';
import { useTranslation } from '@/lib/i18n/client';
import { DataTable } from '@/components/tables/DataTable';
import dayjs from 'dayjs';

interface EmailCampaignDetailPageClientProps {
  locale: string;
  campaignId: string;
}

export function EmailCampaignDetailPageClient({ locale, campaignId }: EmailCampaignDetailPageClientProps) {
  const { t } = useTranslation('modules/real-estate');
  const { data: campaign, isLoading, error } = useEmailCampaign(campaignId);

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: 'gray',
      scheduled: 'blue',
      sending: 'yellow',
      sent: 'green',
      failed: 'red',
    };
    return (
      <Badge color={statusColors[status] || 'gray'}>
        {t(`email.campaign.status.${status}`) || status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Container size="xl" pt="xl">
        <Stack gap="md">
          <Skeleton height={60} />
          <Grid>
            {[1, 2, 3, 4].map((i) => (
              <Grid.Col key={i} span={{ base: 12, sm: 6, md: 3 }}>
                <Skeleton height={120} />
              </Grid.Col>
            ))}
          </Grid>
          <Skeleton height={400} />
        </Stack>
      </Container>
    );
  }

  if (error || !campaign) {
    return (
      <Container size="xl" pt="xl">
        <Text c="red">{t('common.errorLoading')}</Text>
      </Container>
    );
  }

  const recipients = (campaign.recipients as Array<{ email: string; name?: string; type?: string }>) || [];
  const openRate = campaign.sentCount > 0 ? (campaign.openedCount / campaign.sentCount) * 100 : 0;
  const clickRate = campaign.sentCount > 0 ? (campaign.clickedCount / campaign.sentCount) * 100 : 0;

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('email.campaigns.detail.title')}
        description={t('email.campaigns.detail.description')}
        namespace="modules/real-estate"
        icon={<IconMail size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${locale}/dashboard`, namespace: 'global' },
          { label: 'email.campaigns.title', href: `/${locale}/modules/real-estate/email/campaigns`, namespace: 'modules/real-estate' },
          { label: 'email.campaigns.detail.title', namespace: 'modules/real-estate' },
        ]}
      />

      <Stack gap="md">
        {/* Campaign Info */}
        <Paper p="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <div>
                <Title order={3}>{campaign.name}</Title>
                <Text size="sm" c="dimmed" mt={4}>
                  {t('email.campaigns.detail.createdAt')}: {dayjs(campaign.createdAt).format('DD.MM.YYYY HH:mm')}
                </Text>
              </div>
              {getStatusBadge(campaign.status)}
            </Group>

            <Divider />

            <Grid>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">
                  {t('table.template')}
                </Text>
                <Text fw={500}>
                  {campaign.template?.name || '-'}
                </Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">
                  {t('table.scheduledAt')}
                </Text>
                <Text fw={500}>
                  {campaign.scheduledAt ? dayjs(campaign.scheduledAt).format('DD.MM.YYYY HH:mm') : '-'}
                </Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" c="dimmed">
                  {t('table.sentAt')}
                </Text>
                <Text fw={500}>
                  {campaign.sentAt ? dayjs(campaign.sentAt).format('DD.MM.YYYY HH:mm') : '-'}
                </Text>
              </Grid.Col>
              {campaign.notes && (
                <Grid.Col span={12}>
                  <Text size="sm" c="dimmed">
                    {t('table.notes')}
                  </Text>
                  <Text fw={500}>{campaign.notes}</Text>
                </Grid.Col>
              )}
            </Grid>
          </Stack>
        </Paper>

        {/* Statistics */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper p="md" withBorder h="100%">
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  {t('table.recipients')}
                </Text>
                <Text fw={700} size="xl">
                  {campaign.recipientCount}
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper p="md" withBorder h="100%">
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  {t('table.sent')}
                </Text>
                <Text fw={700} size="xl">
                  {campaign.sentCount}
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper p="md" withBorder h="100%">
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  {t('email.analytics.openRate')}
                </Text>
                <Text fw={700} size="xl">
                  {openRate.toFixed(1)}%
                </Text>
                <Text size="xs" c="dimmed">
                  {campaign.openedCount} {t('table.opened')}
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Paper p="md" withBorder h="100%">
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  {t('email.analytics.clickRate')}
                </Text>
                <Text fw={700} size="xl">
                  {clickRate.toFixed(1)}%
                </Text>
                <Text size="xs" c="dimmed">
                  {campaign.clickedCount} {t('table.clicked')}
                </Text>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Recipients List */}
        <Paper p="md" withBorder>
          <Title order={4} mb="md">
            {t('email.campaigns.detail.recipients')}
          </Title>
          <DataTable
            columns={[
              {
                key: 'email',
                label: t('table.email'),
                sortable: true,
                searchable: true,
              },
              {
                key: 'name',
                label: t('table.name'),
                sortable: true,
                searchable: true,
              },
              {
                key: 'type',
                label: t('table.type'),
                sortable: true,
                searchable: false,
                render: (value) => (
                  <Badge size="sm" color={value === 'tenant' ? 'blue' : 'gray'}>
                    {value || 'manual'}
                  </Badge>
                ),
              },
            ]}
            data={recipients}
            searchable={true}
            sortable={true}
            pageable={true}
            defaultPageSize={10}
            pageSizeOptions={[10, 25, 50]}
            emptyMessage={t('table.noRecipients')}
            showColumnSettings={true}
            showAuditHistory={true}
            auditEntityName="EmailCampaignRecipient"
            auditIdKey="id"
          />
        </Paper>

      </Stack>
    </Container>
  );
}

