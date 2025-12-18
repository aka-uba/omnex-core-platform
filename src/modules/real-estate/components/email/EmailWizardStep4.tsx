'use client';

import { useState, useEffect } from 'react';
import {
  Stack,
  Title,
  Text,
  TextInput,
  Textarea,
  Paper,
  Group,
  Button,
  Grid,
  Code,
} from '@mantine/core';
import { IconCode, IconEye, IconVariable } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import type { EmailWizardData } from './EmailWizard';

interface EmailWizardStep4Props {
  locale: string;
  data: EmailWizardData;
  onUpdate: (updates: Partial<EmailWizardData>) => void;
}

export function EmailWizardStep4({ locale, data, onUpdate }: EmailWizardStep4Props) {
  const { t } = useTranslation('modules/real-estate');
  const [showPreview, setShowPreview] = useState(false);
  const [customSubject, setCustomSubject] = useState(data.customSubject || '');
  const [customContent, setCustomContent] = useState(data.customContent || '');

  // Initialize from template
  useEffect(() => {
    if (data.template && !customSubject && !customContent) {
      setCustomSubject(data.template.subject || '');
      setCustomContent(data.template.htmlContent || '');
    }
  }, [data.template]);

  const handleSubjectChange = (value: string) => {
    setCustomSubject(value);
    onUpdate({ customSubject: value });
  };

  const handleContentChange = (value: string) => {
    setCustomContent(value);
    onUpdate({ customContent: value });
  };

  const handleAddVariable = (variable: string) => {
    const currentContent = customContent || '';
    const newContent = currentContent + `{{${variable}}}`;
    setCustomContent(newContent);
    onUpdate({ customContent: newContent });
  };

  // Render preview with variables replaced
  const renderPreview = () => {
    let preview = customContent || data.template?.htmlContent || '';
    const variables = data.variables || {};
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      preview = preview.replace(regex, String(value || `{{${key}}}`));
    });

    // Replace remaining variables with placeholder
    preview = preview.replace(/{{\s*(\w+)\s*}}/g, (_match: string, varName: string) => {
      return `<span style="background-color: #fff3cd; padding: 2px 4px; border-radius: 2px;">{{${varName}}}</span>`;
    });

    return preview;
  };

  const availableVariables = [
    'apartmentAddress',
    'apartmentUnitNumber',
    'apartmentArea',
    'apartmentRoomCount',
    'apartmentRentPrice',
    'propertyName',
    'tenantName',
    'tenantEmail',
    'tenantPhone',
    'rentAmount',
    'depositAmount',
    'contractNumber',
    'contractStartDate',
    'contractEndDate',
  ];

  return (
    <Stack gap="md">
      <div>
        <Title order={4} mb="xs">
          {t('email.wizard.step4.title')}
        </Title>
        <Text size="sm" c="dimmed">
          {t('email.wizard.step4.description')}
        </Text>
      </div>

      {/* Subject Editor */}
      <Paper p="md" withBorder>
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            {t('form.subject')}
          </Text>
          <TextInput
            placeholder={t('form.subjectPlaceholder')}
            value={customSubject}
            onChange={(e) => handleSubjectChange(e.target.value)}
          />
          <Text size="xs" c="dimmed">
            {t('form.subjectHint')}
          </Text>
        </Stack>
      </Paper>

      {/* Content Editor */}
      <Paper p="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Text size="sm" fw={500}>
              {t('form.htmlContent')}
            </Text>
            <Button
              size="xs"
              variant="light"
              leftSection={showPreview ? <IconCode size={14} /> : <IconEye size={14} />}
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? (t('actions.edit')) : (t('actions.preview'))}
            </Button>
          </Group>

          {showPreview ? (
            <Paper p="md" withBorder style={{ backgroundColor: '#f8f9fa', minHeight: '300px' }}>
              <div dangerouslySetInnerHTML={{ __html: renderPreview() }} />
            </Paper>
          ) : (
            <Textarea
              placeholder={t('form.htmlContentPlaceholder')}
              value={customContent}
              onChange={(e) => handleContentChange(e.target.value)}
              rows={15}
              styles={{ input: { fontFamily: 'monospace', fontSize: '13px' } }}
            />
          )}

          <Text size="xs" c="dimmed">
            {t('form.htmlContentHint')}
          </Text>
        </Stack>
      </Paper>

      {/* Available Variables */}
      <Paper p="md" withBorder>
        <Stack gap="xs">
          <Group>
            <IconVariable size={16} />
            <Text size="sm" fw={500}>
              {t('email.wizard.step4.availableVariables')}
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            {t('email.wizard.step4.clickToAdd')}
          </Text>
          <Group gap="xs">
            {availableVariables.map((variable) => (
              <Button
                key={variable}
                size="xs"
                variant="light"
                onClick={() => handleAddVariable(variable)}
              >
                {`{{${variable}}}`}
              </Button>
            ))}
          </Group>
        </Stack>
      </Paper>

      {/* Current Variables */}
      {data.variables && Object.keys(data.variables).length > 0 && (
        <Paper p="md" withBorder style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              {t('email.wizard.step4.currentVariables')}
            </Text>
            <Grid>
              {Object.entries(data.variables).map(([key, value]) => (
                <Grid.Col key={key} span={6}>
                  <Code block>{`{{${key}}} = ${value}`}</Code>
                </Grid.Col>
              ))}
            </Grid>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}

