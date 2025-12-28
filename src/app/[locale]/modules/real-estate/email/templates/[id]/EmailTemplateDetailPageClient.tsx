'use client';

import { Container, Paper, Group, Text, Badge, Stack, Grid, Divider, Code, Box } from '@mantine/core';
import { DetailPageSkeleton } from '@/components/skeletons/DetailPageSkeleton';
import { IconMail, IconEdit } from '@tabler/icons-react';
import { CentralPageHeader } from '@/components/headers/CentralPageHeader';
import { useEmailTemplate } from '@/hooks/useEmailTemplates';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/client';
import dayjs from 'dayjs';
import type { EmailTemplateCategory } from '@/modules/real-estate/types/email-template';

export function EmailTemplateDetailPageClient({ locale, templateId }: { locale: string; templateId: string }) {
  const params = useParams();
  const router = useRouter();
  const currentLocale = (params?.locale as string) || locale;
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');
  const { data: template, isLoading, error } = useEmailTemplate(templateId);

  if (error || (!isLoading && !template)) {
    return (
      <Container size="xl" pt="xl">
        <CentralPageHeader
          title={t('emailTemplates.detail.title')}
          description={t('emailTemplates.detail.description')}
          namespace="modules/real-estate"
          icon={<IconMail size={32} />}
          breadcrumbs={[
            { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
            { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
            { label: t('emailTemplates.title'), href: `/${currentLocale}/modules/real-estate/email/templates`, namespace: 'modules/real-estate' },
            { label: t('emailTemplates.detail.title'), namespace: 'modules/real-estate' },
          ]}
        />
        <Text c="red" mt="md">{tGlobal('common.notFound')}</Text>
      </Container>
    );
  }

  // Parse variables - could be JSON string, array, or undefined
  const parseVariables = (): Array<{ key: string; type: string; label: string; description?: string }> => {
    if (!template?.variables) return [];
    if (Array.isArray(template.variables)) return template.variables;
    if (typeof template.variables === 'string') {
      try {
        const parsed = JSON.parse(template.variables);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };
  const variables = parseVariables();

  const getCategoryBadge = (category: EmailTemplateCategory) => {
    const categoryColors: Record<EmailTemplateCategory, string> = {
      promotion: 'blue',
      announcement: 'green',
      reminder: 'orange',
      welcome: 'purple',
      agreement: 'cyan',
    };
    return (
      <Badge color={categoryColors[category] || 'gray'}>
        {t(`emailTemplates.categories.${category}`) || category}
      </Badge>
    );
  };

  return (
    <Container size="xl" pt="xl">
      <CentralPageHeader
        title={t('emailTemplates.detail.title')}
        description={t('emailTemplates.detail.description')}
        namespace="modules/real-estate"
        icon={<IconMail size={32} />}
        breadcrumbs={[
          { label: 'navigation.dashboard', href: `/${currentLocale}/dashboard`, namespace: 'global' },
          { label: 'menu.label', href: `/${currentLocale}/modules/real-estate`, namespace: 'modules/real-estate' },
          { label: t('emailTemplates.title'), href: `/${currentLocale}/modules/real-estate/email/templates`, namespace: 'modules/real-estate' },
          { label: t('emailTemplates.detail.title'), namespace: 'modules/real-estate' },
        ]}
        actions={
          !isLoading && template ? [
            {
              label: t('actions.edit'),
              icon: <IconEdit size={18} />,
              onClick: () => router.push(`/${currentLocale}/modules/real-estate/email/templates/${templateId}/edit`),
              variant: 'filled',
            },
          ] : []
        }
      />

      {isLoading ? (
        <DetailPageSkeleton />
      ) : template ? (
        <Paper shadow="xs" p="md" mt="md">
          <Stack gap="xl">
            {/* Header Section */}
            <Group justify="space-between" align="flex-start">
              <Stack gap="xs">
                <Text fw={700} size="xl">{template.name}</Text>
                <Group>
                  {getCategoryBadge(template.category)}
                  <Badge color={template.isActive ? 'green' : 'gray'}>
                    {template.isActive ? tGlobal('common.active') : tGlobal('common.inactive')}
                  </Badge>
                  {template.isDefault && (
                    <Badge color="blue" variant="light">
                      {t('emailTemplates.default')}
                    </Badge>
                  )}
                </Group>
              </Stack>
            </Group>

            <Divider />

            {/* Template Info */}
            <Stack gap="md">
              <Text fw={600} size="lg">{t('emailTemplates.detail.info')}</Text>
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Text size="sm" c="dimmed">{t('emailTemplates.detail.name')}</Text>
                  <Text fw={500}>{template.name}</Text>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Text size="sm" c="dimmed">{t('emailTemplates.detail.category')}</Text>
                  <Text fw={500} component="div">{getCategoryBadge(template.category)}</Text>
                </Grid.Col>
                <Grid.Col span={12}>
                  <Text size="sm" c="dimmed">{t('emailTemplates.detail.subject')}</Text>
                  <Text fw={500}>{template.subject}</Text>
                </Grid.Col>
              </Grid>
            </Stack>

            {/* Variables Section */}
            {variables.length > 0 && (
              <>
                <Divider />
                <Stack gap="md">
                  <Text fw={600} size="lg">{t('emailTemplates.detail.variables')}</Text>
                  <Grid>
                    {variables.map((variable, index) => (
                      <Grid.Col key={index} span={{ base: 12, md: 6 }}>
                        <Paper withBorder p="sm">
                          <Group justify="space-between">
                            <Text fw={500}>{`{{${variable.key}}}`}</Text>
                            <Badge size="sm" variant="light">{variable.type}</Badge>
                          </Group>
                          <Text size="sm" c="dimmed">{variable.label}</Text>
                          {variable.description && (
                            <Text size="xs" c="dimmed" mt="xs">{variable.description}</Text>
                          )}
                        </Paper>
                      </Grid.Col>
                    ))}
                  </Grid>
                </Stack>
              </>
            )}

            {/* HTML Content Preview */}
            <Divider />
            <Stack gap="md">
              <Text fw={600} size="lg">{t('emailTemplates.detail.preview')}</Text>
              <Box
                p="md"
                style={{
                  border: '1px solid var(--mantine-color-gray-3)',
                  borderRadius: 'var(--mantine-radius-md)',
                  maxHeight: '400px',
                  overflow: 'auto',
                }}
                dangerouslySetInnerHTML={{ __html: template.htmlContent }}
              />
            </Stack>

            {/* Text Content */}
            {template.textContent && (
              <>
                <Divider />
                <Stack gap="md">
                  <Text fw={600} size="lg">{t('emailTemplates.detail.textContent')}</Text>
                  <Code block>
                    {template.textContent}
                  </Code>
                </Stack>
              </>
            )}

            {/* System Information */}
            <Divider />
            <Stack gap="md">
              <Text fw={600} size="lg">{t('emailTemplates.detail.systemInfo')}</Text>
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Text size="sm" c="dimmed">{t('emailTemplates.detail.createdAt')}</Text>
                  <Text fw={500}>{dayjs(template.createdAt).format('DD.MM.YYYY HH:mm')}</Text>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Text size="sm" c="dimmed">{t('emailTemplates.detail.updatedAt')}</Text>
                  <Text fw={500}>{dayjs(template.updatedAt).format('DD.MM.YYYY HH:mm')}</Text>
                </Grid.Col>
              </Grid>
            </Stack>
          </Stack>
        </Paper>
      ) : null}
    </Container>
  );
}
