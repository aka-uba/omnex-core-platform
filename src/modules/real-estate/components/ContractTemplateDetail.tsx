'use client';

import { Paper, Stack, Text, Badge, Grid, Group, Title, Divider } from '@mantine/core';
import { useContractTemplate } from '@/hooks/useContractTemplates';
import { useTranslation } from '@/lib/i18n/client';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';

interface ContractTemplateDetailProps {
  locale: string;
  templateId: string;
}

export function ContractTemplateDetail({ locale, templateId }: ContractTemplateDetailProps) {
  const { t } = useTranslation('modules/real-estate');
  const { data: template, isLoading, error } = useContractTemplate(templateId);

  if (isLoading) {
    return <DetailPageSkeleton />;
  }

  if (error || !template) {
    return (
      <Paper shadow="xs" p="md" mt="xl">
        <Text c="red">{t('common.errorLoading')}</Text>
      </Paper>
    );
  }

  return (
    <Paper shadow="xs" p="xl" mt="xl">
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2}>{template.name}</Title>
          <Badge color={template.isDefault ? 'blue' : 'gray'}>
            {template.isDefault ? (t('form.isDefault')) : (t('form.notDefault'))}
          </Badge>
        </Group>

        <Divider />

        <Grid>
          <Grid.Col span={6}>
            <Text size="sm" c="dimmed">
              {t('form.type')}
            </Text>
            <Text fw={500}>{t(`types.${template.type}`) || template.type}</Text>
          </Grid.Col>

          {template.category && (
            <Grid.Col span={6}>
              <Text size="sm" c="dimmed">
                {t('form.category')}
              </Text>
              <Text fw={500}>{template.category}</Text>
            </Grid.Col>
          )}

          {template.description && (
            <Grid.Col span={12}>
              <Text size="sm" c="dimmed">
                {t('form.description')}
              </Text>
              <Text>{template.description}</Text>
            </Grid.Col>
          )}

          <Grid.Col span={12}>
            <Text size="sm" c="dimmed" mb="xs">
              {t('form.content')}
            </Text>
            <Paper p="md" withBorder style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
              <Text style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }} size="sm">
                {template.content}
              </Text>
            </Paper>
          </Grid.Col>
        </Grid>
      </Stack>
    </Paper>
  );
}












