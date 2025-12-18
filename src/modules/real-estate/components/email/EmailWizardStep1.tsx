'use client';

import { useState } from 'react';
import {
  Stack,
  Title,
  Text,
  TextInput,
  Button,
  Group,
  Paper,
  Badge,
  ActionIcon,
  MultiSelect,
} from '@mantine/core';
import { IconTrash, IconMail, IconUsers } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { useTenants } from '@/hooks/useTenants';
import { useApartments } from '@/hooks/useApartments';
import type { EmailWizardData } from './EmailWizard';

interface EmailWizardStep1Props {
  locale: string;
  data: EmailWizardData;
  onUpdate: (updates: Partial<EmailWizardData>) => void;
}

export function EmailWizardStep1({ locale, data, onUpdate }: EmailWizardStep1Props) {
  const { t } = useTranslation('modules/real-estate');
  const [manualEmail, setManualEmail] = useState('');
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [selectedApartments, setSelectedApartments] = useState<string[]>([]);

  // Fetch tenants and apartments for selection
  const { data: tenantsData } = useTenants({ page: 1, pageSize: 1000 });
  const { data: apartmentsData } = useApartments({ page: 1, pageSize: 1000 });

  const handleAddManualEmail = () => {
    if (manualEmail && manualEmail.includes('@')) {
      const newRecipients = [
        ...data.recipients,
        { email: manualEmail, type: 'manual' as const },
      ];
      onUpdate({ recipients: newRecipients });
      setManualEmail('');
    }
  };

  const handleRemoveRecipient = (index: number) => {
    const newRecipients = data.recipients.filter((_, i) => i !== index);
    onUpdate({ recipients: newRecipients });
  };

  const handleAddTenants = () => {
    if (selectedTenants.length > 0) {
      const tenantRecipients = selectedTenants
        .map((tenantId) => {
          const tenant = tenantsData?.tenants.find((t) => t.id === tenantId);
          if (tenant) {
            // Get email from tenant's contact or user
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

      onUpdate({
        recipients: [...data.recipients, ...tenantRecipients],
      });
      setSelectedTenants([]);
    }
  };

  const handleAddApartmentTenants = () => {
    if (selectedApartments.length > 0) {
      // Get tenants from selected apartments
      const apartmentRecipients: Array<{ email: string; name?: string; type: 'tenant' }> = [];
      
      selectedApartments.forEach((apartmentId) => {
        const apartment = apartmentsData?.apartments.find((a) => a.id === apartmentId);
        if (apartment) {
          // Get tenant from apartment's contract
          // This would need to be fetched from contracts
          // For now, we'll add a placeholder
        }
      });

      if (apartmentRecipients.length > 0) {
        onUpdate({
          recipients: [...data.recipients, ...apartmentRecipients],
        });
      }
      setSelectedApartments([]);
    }
  };

  return (
    <Stack gap="md">
      <div>
        <Title order={4} mb="xs">
          {t('email.wizard.step1.title')}
        </Title>
        <Text size="sm" c="dimmed">
          {t('email.wizard.step1.description')}
        </Text>
      </div>

      {/* Manual Email Input */}
      <Paper p="md" withBorder>
        <Stack gap="md">
          <Text size="sm" fw={500}>
            {t('email.wizard.step1.manualEmail')}
          </Text>
          <Group>
            <TextInput
              placeholder={t('email.wizard.step1.emailPlaceholder')}
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              style={{ flex: 1 }}
              leftSection={<IconMail size={16} />}
            />
            <Button onClick={handleAddManualEmail} disabled={!manualEmail || !manualEmail.includes('@')}>
              {t('actions.add')}
            </Button>
          </Group>
        </Stack>
      </Paper>

      {/* Tenant Selection */}
      <Paper p="md" withBorder>
        <Stack gap="md">
          <Text size="sm" fw={500}>
            {t('email.wizard.step1.selectTenants')}
          </Text>
          <MultiSelect
            placeholder={t('email.wizard.step1.tenantPlaceholder')}
            data={
              tenantsData?.tenants.map((tenant) => ({
                value: tenant.id,
                label: tenant.contact?.name || tenant.user?.name || tenant.id,
              })) || []
            }
            value={selectedTenants}
            onChange={setSelectedTenants}
            searchable
            leftSection={<IconUsers size={16} />}
          />
          <Button onClick={handleAddTenants} disabled={selectedTenants.length === 0} size="sm">
            {t('actions.addSelected')}
          </Button>
        </Stack>
      </Paper>

      {/* Apartment-based Tenant Selection */}
      <Paper p="md" withBorder>
        <Stack gap="md">
          <Text size="sm" fw={500}>
            {t('email.wizard.step1.selectApartments')}
          </Text>
          <MultiSelect
            placeholder={t('email.wizard.step1.apartmentPlaceholder')}
            data={
              apartmentsData?.apartments.map((apt) => ({
                value: apt.id,
                label: `${apt.unitNumber} - ${apt.property?.name || ''}`,
              })) || []
            }
            value={selectedApartments}
            onChange={setSelectedApartments}
            searchable
          />
          <Button onClick={handleAddApartmentTenants} disabled={selectedApartments.length === 0} size="sm">
            {t('actions.addTenantsFromApartments')}
          </Button>
        </Stack>
      </Paper>

      {/* Selected Recipients List */}
      {data.recipients.length > 0 && (
        <Paper p="md" withBorder>
          <Stack gap="md">
            <Text size="sm" fw={500}>
              {t('email.wizard.step1.selectedRecipients')} ({data.recipients.length})
            </Text>
            <Stack gap="xs">
              {data.recipients.map((recipient, index) => (
                <Group key={index} justify="space-between" p="xs" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: '4px' }}>
                  <Group gap="xs">
                    <IconMail size={16} />
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
                      <Badge size="xs" color={recipient.type === 'tenant' ? 'blue' : 'gray'}>
                        {recipient.type}
                      </Badge>
                    )}
                  </Group>
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={() => handleRemoveRecipient(index)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              ))}
            </Stack>
          </Stack>
        </Paper>
      )}

      {data.recipients.length === 0 && (
        <Paper p="md" withBorder style={{ borderStyle: 'dashed' }}>
          <Text size="sm" c="dimmed" ta="center">
            {t('email.wizard.step1.noRecipients')}
          </Text>
        </Paper>
      )}
    </Stack>
  );
}

