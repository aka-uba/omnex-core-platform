'use client';

import { useState } from 'react';
import {
  Stack,
  Title,
  Text,
  Paper,
  Group,
  Button,
  Switch,
  Grid,
  Badge,
  Divider,
  List,
  Alert,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { IconMail, IconCalendar, IconSend, IconAlertCircle } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import dayjs from 'dayjs';
import type { EmailWizardData } from './EmailWizard';

interface EmailWizardStep6Props {
  locale: string;
  data: EmailWizardData;
  onUpdate: (updates: Partial<EmailWizardData>) => void;
}

export function EmailWizardStep6({ locale, data, onUpdate }: EmailWizardStep6Props) {
  const { t } = useTranslation('modules/real-estate');
  const [sendNow, setSendNow] = useState(data.sendNow !== false);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(
    data.scheduledAt ? new Date(data.scheduledAt) : dayjs().add(1, 'hour').toDate()
  );

  const handleSend = async () => {
    try {
      // TODO: Implement email sending
      const sendData: Partial<EmailWizardData> = {
        ...data,
        sendNow,
        ...(sendNow ? {} : (scheduledAt ? { scheduledAt } : {})),
      };

      onUpdate(sendData);

      showToast({
        type: 'success',
        title: t('messages.success'),
        message: sendNow
          ? (t('email.wizard.step6.sent'))
          : (t('email.wizard.step6.scheduled')),
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('email.wizard.step6.sendError'),
      });
    }
  };

  return (
    <Stack gap="md">
      <div>
        <Title order={4} mb="xs">
          {t('email.wizard.step6.title')}
        </Title>
        <Text c="dimmed">
          {t('email.wizard.step6.description')}
        </Text>
      </div>

      {/* Send Options */}
      <Paper p="md" withBorder>
        <Stack gap="md">
          <Switch
            label={t('email.wizard.step6.sendNow')}
            description={t('email.wizard.step6.sendNowDescription')}
            checked={sendNow}
            onChange={(e) => {
              setSendNow(e.currentTarget.checked);
              onUpdate({ sendNow: e.currentTarget.checked });
            }}
          />

          {!sendNow && (
            <DateTimePicker label={t('email.wizard.step6.schedule')}
              placeholder={t('email.wizard.step6.schedulePlaceholder')}
              value={scheduledAt}
              onChange={(value: string | Date | null) => {
                const date = value instanceof Date ? value : value ? new Date(value) : null;
                setScheduledAt(date);
                onUpdate({ ...(date ? { scheduledAt: date } : {}) });
              }}
              minDate={new Date()}
              leftSection={<IconCalendar size={16} />}
            />
          )}
        </Stack>
      </Paper>

      {/* Email Summary */}
      <Paper p="md" withBorder>
        <Stack gap="md">
          <Group>
            <IconMail size={20} />
            <Text fw={500}>
              {t('email.wizard.step6.summary')}
            </Text>
          </Group>

          <Divider />

          <Grid>
            <Grid.Col span={6}>
              <Text c="dimmed">
                {t('email.wizard.step6.recipients')}
              </Text>
              <Text fw={500}>
                {data.recipients.length}
              </Text>
              <List mt={4}>
                {data.recipients.slice(0, 3).map((recipient, index) => (
                  <List.Item key={index}>{recipient.email}</List.Item>
                ))}
                {data.recipients.length > 3 && (
                  <List.Item>+{data.recipients.length - 3} more</List.Item>
                )}
              </List>
            </Grid.Col>

            <Grid.Col span={6}>
              <Text c="dimmed">
                {t('email.wizard.step6.template')}
              </Text>
              <Text fw={500}>
                {data.template?.name || '-'}
              </Text>
            </Grid.Col>

            {data.apartmentId && (
              <Grid.Col span={12}>
                <Text c="dimmed">
                  {t('email.wizard.step6.apartment')}
                </Text>
                <Text fw={500}>
                  {data.apartment?.unitNumber || '-'}
                </Text>
              </Grid.Col>

            )}

            <Grid.Col span={12}>
              <Text c="dimmed">
                {t('form.subject')}
              </Text>
              <Text fw={500}>
                {data.customSubject || data.template?.subject || '-'}
              </Text>
            </Grid.Col>
          </Grid>
        </Stack>
      </Paper>

      {/* Tracking Info */}
      <Paper p="md" withBorder style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
        <Stack gap="xs">
          <Text fw={500}>
            {t('email.wizard.step6.tracking')}
          </Text>
          <Text c="dimmed">
            {t('email.wizard.step6.trackingDescription')}
          </Text>
          <Group gap="xs">
            <Badge color="blue">
              {t('email.wizard.step6.openTracking')}
            </Badge>
            <Badge color="green">
              {t('email.wizard.step6.clickTracking')}
            </Badge>
          </Group>
        </Stack>
      </Paper>

      {/* Final Confirmation */}
      <Alert icon={<IconAlertCircle size={16} />} color="blue">
        <Text fw={500} mb={4}>
          {t('email.wizard.step6.confirmTitle')}
        </Text>
        <Text>
          {sendNow
            ? (t('email.wizard.step6.confirmNow'))
            : (t('email.wizard.step6.confirmScheduled') || `This email will be sent on ${scheduledAt ? dayjs(scheduledAt).format('DD.MM.YYYY HH:mm') : ''} to all recipients.`)}
        </Text>
      </Alert>

      {/* Send Button */}
      <Button
        leftSection={<IconSend size={18} />}
        onClick={handleSend}
        disabled={data.recipients.length === 0 || !data.templateId}
        fullWidth
      >
        {sendNow
          ? (t('email.wizard.step6.sendNow'))
          : (t('email.wizard.step6.schedule'))}
      </Button>
    </Stack>
  );
}

