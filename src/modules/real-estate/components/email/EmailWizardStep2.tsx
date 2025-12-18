'use client';

import { useState } from 'react';
import {
  Stack,
  Title,
  Text,
  Select,
  Paper,
  Grid,
  Card,
  Badge,
  Group,
  ScrollArea,
} from '@mantine/core';
import { IconMail } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';
import type { EmailWizardData } from './EmailWizard';

interface EmailWizardStep2Props {
  locale: string;
  data: EmailWizardData;
  onUpdate: (updates: Partial<EmailWizardData>) => void;
}

export function EmailWizardStep2({ locale, data, onUpdate }: EmailWizardStep2Props) {
  const { t } = useTranslation('modules/real-estate');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const { data: templatesData, isLoading } = useEmailTemplates({
    page: 1,
    pageSize: 100,
    category: selectedCategory as any,
    isActive: true,
  });

  const handleSelectTemplate = (templateId: string) => {
    const template = templatesData?.templates.find((t) => t.id === templateId);
    onUpdate({ 
      templateId, 
      ...(template ? { template } : {}),
    });
  };

  const getCategoryBadge = (category: string) => {
    const categoryColors: Record<string, string> = {
      promotion: 'blue',
      announcement: 'green',
      reminder: 'yellow',
      welcome: 'cyan',
      agreement: 'purple',
    };
    return (
      <Badge color={categoryColors[category] || 'gray'} size="sm">
        {t(`email.categories.${category}`) || category}
      </Badge>
    );
  };

  return (
    <Stack gap="md">
      <div>
        <Title order={4} mb="xs">
          {t('email.wizard.step2.title')}
        </Title>
        <Text size="sm" c="dimmed">
          {t('email.wizard.step2.description')}
        </Text>
      </div>

      {/* Category Filter */}
      <Select
        label={t('filter.category')}
        placeholder={t('filter.all')}
        data={[
          { value: '', label: t('filter.all') },
          { value: 'promotion', label: t('email.categories.promotion') },
          { value: 'announcement', label: t('email.categories.announcement') },
          { value: 'reminder', label: t('email.categories.reminder') },
          { value: 'welcome', label: t('email.categories.welcome') },
          { value: 'agreement', label: t('email.categories.agreement') },
        ]}
        value={selectedCategory}
        onChange={(value) => setSelectedCategory(value || '')}
        clearable
      />

      {/* Template Grid */}
      {isLoading ? (
        <Text>{t('common.loading')}</Text>
      ) : templatesData && templatesData.templates && templatesData.templates.length > 0 ? (
        <ScrollArea h={500}>
          <Grid>
            {templatesData.templates.map((template) => (
              <Grid.Col key={template.id} span={{ base: 12, sm: 6, md: 4 }}>
                <Card
                  shadow="sm"
                  padding="md"
                  radius="md"
                  withBorder
                  style={{
                    cursor: 'pointer',
                    borderColor: data.templateId === template.id ? 'var(--mantine-color-blue-6)' : undefined,
                    borderWidth: data.templateId === template.id ? 2 : 1,
                  }}
                  onClick={() => handleSelectTemplate(template.id)}
                >
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Group gap="xs">
                        <IconMail size={18} />
                        <Text fw={500} size="sm">
                          {template.name}
                        </Text>
                      </Group>
                      {template.isDefault && (
                        <Badge color="violet" size="xs">
                          {t('email.status.default')}
                        </Badge>
                      )}
                    </Group>
                    {getCategoryBadge(template.category)}
                    <Text size="xs" c="dimmed" lineClamp={2}>
                      {template.subject}
                    </Text>
                    {/* Preview button removed - previewTemplateId state not implemented */}
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </ScrollArea>
      ) : !isLoading && (!templatesData || !templatesData.templates || templatesData.templates.length === 0) && !data.templateId ? (
        <Paper p="md" withBorder style={{ borderStyle: 'dashed' }}>
          <Text size="sm" c="dimmed" ta="center">
            {t('email.wizard.step2.noTemplates')}
          </Text>
        </Paper>
      ) : null}

      {data.templateId && (
        <Paper p="md" withBorder style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
          <Group>
            <IconMail size={20} color="var(--mantine-color-blue-6)" />
            <div>
              <Text size="sm" fw={500}>
                {t('email.wizard.step2.selectedTemplate')}
              </Text>
              <Text size="xs" c="dimmed">
                {data.template?.name || data.templateId}
              </Text>
            </div>
          </Group>
        </Paper>
      )}
    </Stack>
  );
}








