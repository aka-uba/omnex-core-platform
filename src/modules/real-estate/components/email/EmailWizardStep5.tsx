'use client';

import { useState } from 'react';
import {
  Stack,
  Title,
  Text,
  Paper,
  Group,
  Button,
  TextInput,
  SegmentedControl,
  Badge,
  Grid,
  Alert,
} from '@mantine/core';
import { IconMail, IconDeviceDesktop, IconDeviceMobile, IconAlertCircle } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import type { EmailWizardData } from './EmailWizard';

interface EmailWizardStep5Props {
  locale: string;
  data: EmailWizardData;
  onUpdate: (updates: Partial<EmailWizardData>) => void;
}

export function EmailWizardStep5({ locale, data, onUpdate }: EmailWizardStep5Props) {
  const { t } = useTranslation('modules/real-estate');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [testEmail, setTestEmail] = useState(data.testEmail || '');

  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: t('email.wizard.step5.invalidEmail'),
      });
      return;
    }

    try {
      // TODO: Implement test email sending
      showToast({
        type: 'success',
        title: t('messages.success'),
        message: t('email.wizard.step5.testSent'),
      });
      onUpdate({ testEmail });
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('email.wizard.step5.testError'),
      });
    }
  };

  // Render preview with variables
  const renderPreview = () => {
    let subject = data.customSubject || data.template?.subject || '';
    let content = data.customContent || data.template?.htmlContent || '';
    const variables = data.variables || {};

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      subject = subject.replace(regex, String(value || `{{${key}}}`));
      content = content.replace(regex, String(value || `{{${key}}}`));
    });

    return { subject, content };
  };

  const preview = renderPreview();

  return (
    <Stack gap="md">
      <div>
        <Title order={4} mb="xs">
          {t('email.wizard.step5.title')}
        </Title>
        <Text c="dimmed">
          {t('email.wizard.step5.description')}
        </Text>
      </div>

      {/* View Mode Toggle */}
      <Group justify="center">
        <SegmentedControl
          value={viewMode}
          onChange={(value) => setViewMode(value as 'desktop' | 'mobile')}
          data={[
            {
              value: 'desktop',
              label: (
                <Group gap="xs">
                  <IconDeviceDesktop size={16} />
                  <span>{t('email.wizard.step5.desktop')}</span>
                </Group>
              ),
            },
            {
              value: 'mobile',
              label: (
                <Group gap="xs">
                  <IconDeviceMobile size={16} />
                  <span>{t('email.wizard.step5.mobile')}</span>
                </Group>
              ),
            },
          ]}
        />
      </Group>

      {/* Email Preview */}
      <Paper p="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={500}>
              {t('email.wizard.step5.emailPreview')}
            </Text>
            <Badge color="blue">
              {viewMode === 'desktop' ? 'Desktop' : 'Mobile'}
            </Badge>
          </Group>

          {/* Subject Preview */}
          <Paper p="xs" withBorder style={{ backgroundColor: '#f8f9fa' }}>
            <Text c="dimmed" mb={4}>
              {t('form.subject')}
            </Text>
            <Text fw={500}>
              {preview.subject}
            </Text>
          </Paper>

          {/* Content Preview */}
          <Paper
            p="md"
            withBorder
            style={{
              backgroundColor: '#ffffff',
              minHeight: '400px',
              maxWidth: viewMode === 'mobile' ? '375px' : '100%',
              margin: viewMode === 'mobile' ? '0 auto' : undefined,
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: preview.content }} />
          </Paper>
        </Stack>
      </Paper>

      {/* Test Email */}
      <Paper p="md" withBorder>
        <Stack gap="md">
          <Text fw={500}>
            {t('email.wizard.step5.sendTest')}
          </Text>
          <Group>
            <TextInput
              placeholder={t('email.wizard.step5.testEmailPlaceholder')}
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              style={{ flex: 1 }}
              leftSection={<IconMail size={16} />}
            />
            <Button onClick={handleSendTest} disabled={!testEmail || !testEmail.includes('@')}>
              {t('email.wizard.step5.sendTestButton')}
            </Button>
          </Group>
          <Text c="dimmed">
            {t('email.wizard.step5.testHint')}
          </Text>
        </Stack>
      </Paper>

      {/* Summary */}
      <Paper p="md" withBorder style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
        <Stack gap="xs">
          <Text fw={500}>
            {t('email.wizard.step5.summary')}
          </Text>
          <Grid>
            <Grid.Col span={6}>
              <Text c="dimmed">
                {t('email.wizard.step5.recipients')}
              </Text>
              <Text fw={500}>
                {data.recipients.length}
              </Text>
            </Grid.Col>
            <Grid.Col span={6}>
              <Text c="dimmed">
                {t('email.wizard.step5.template')}
              </Text>
              <Text fw={500}>
                {data.template?.name || '-'}
              </Text>
            </Grid.Col>
            {data.apartmentId && (
              <Grid.Col span={12}>
                <Text c="dimmed">
                  {t('email.wizard.step5.apartment')}
                </Text>
                <Text fw={500}>
                  {data.apartment?.unitNumber || '-'}
                </Text>
              </Grid.Col>
            )}
          </Grid>
        </Stack>
      </Paper>

      {/* Validation Alert */}
      {data.recipients.length === 0 && (
        <Alert icon={<IconAlertCircle size={16} />} color="yellow">
          {t('email.wizard.step5.noRecipients')}
        </Alert>
      )}
      {!data.templateId && (
        <Alert icon={<IconAlertCircle size={16} />} color="yellow">
          {t('email.wizard.step5.noTemplate')}
        </Alert>
      )}
    </Stack>
  );
}

