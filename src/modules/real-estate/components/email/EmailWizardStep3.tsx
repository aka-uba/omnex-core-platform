'use client';

import { useState } from 'react';
import {
  Stack,
  Title,
  Text,
  Select,
  Paper,
  Group,
  Badge,
  Grid,
  Button,
} from '@mantine/core';
import { IconHome, IconCheck } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { useApartments } from '@/hooks/useApartments';
import { useProperties } from '@/hooks/useProperties';
import type { EmailWizardData } from './EmailWizard';

interface EmailWizardStep3Props {
  locale: string;
  data: EmailWizardData;
  onUpdate: (updates: Partial<EmailWizardData>) => void;
}

export function EmailWizardStep3({ locale, data, onUpdate }: EmailWizardStep3Props) {
  const { t } = useTranslation('modules/real-estate');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedApartmentId, setSelectedApartmentId] = useState<string>('');

  const { data: propertiesData } = useProperties({ page: 1, pageSize: 1000 });
  const { data: apartmentsData } = useApartments({
    page: 1,
    pageSize: 1000,
    ...(selectedPropertyId ? { propertyId: selectedPropertyId } : {}),
  });

  const handleSelectApartment = (apartmentId: string) => {
    const apartment = apartmentsData?.apartments.find((a) => a.id === apartmentId);
    onUpdate({ 
      apartmentId, 
      ...(apartment ? { apartment } : {}),
    });
  };

  const handleClearApartment = () => {
    // Don't set undefined values, just omit them
    onUpdate({});
    setSelectedPropertyId('');
    setSelectedApartmentId('');
  };

  // Auto-fill variables from apartment
  const autoFillVariables = () => {
    if (data.apartment) {
      const apt = data.apartment;
      const variables: Record<string, any> = {
        apartmentAddress: `${apt.property?.address || ''} ${apt.unitNumber || ''}`,
        apartmentUnitNumber: apt.unitNumber || '',
        apartmentArea: apt.area ? `${apt.area} m²` : '',
        apartmentRoomCount: apt.roomCount || '',
        apartmentRentPrice: apt.rentPrice ? `${apt.rentPrice} TRY` : '',
        propertyName: apt.property?.name || '',
      };
      onUpdate({ variables: { ...data.variables, ...variables } });
    }
  };

  return (
    <Stack gap="md">
      <div>
        <Title order={4} mb="xs">
          {t('email.wizard.step3.title')}
        </Title>
        <Text size="sm" c="dimmed">
          {t('email.wizard.step3.description')}
        </Text>
      </div>

      {/* Property Selection */}
      <Select
        label={t('form.property')}
        placeholder={t('form.selectProperty')}
        data={
          propertiesData?.properties.map((prop) => ({
            value: prop.id,
            label: prop.name,
          })) || []
        }
        value={selectedPropertyId}
        onChange={(value) => {
          setSelectedPropertyId(value || '');
          setSelectedApartmentId('');
          // Don't set undefined values, just omit them
          onUpdate({});
        }}
        clearable
        searchable
      />

      {/* Apartment Selection */}
      {selectedPropertyId && (
        <Select
          label={t('form.apartment')}
          placeholder={t('form.selectApartment')}
          data={
            apartmentsData?.apartments.map((apt) => ({
              value: apt.id,
              label: `${apt.unitNumber} - ${apt.property?.name || ''}`,
            })) || []
          }
          value={selectedApartmentId}
          onChange={(value) => {
            setSelectedApartmentId(value || '');
            if (value) {
              handleSelectApartment(value);
            }
          }}
          clearable
          searchable
        />
      )}

      {/* Selected Apartment Info */}
      {data.apartmentId && data.apartment && (
        <Paper p="md" withBorder style={{ backgroundColor: 'var(--mantine-color-green-0)' }}>
          <Stack gap="md">
            <Group justify="space-between">
              <Group>
                <IconHome size={20} color="var(--mantine-color-green-6)" />
                <div>
                  <Text size="sm" fw={500}>
                    {t('email.wizard.step3.selectedApartment')}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {data.apartment.unitNumber} - {data.apartment.property?.name}
                  </Text>
                </div>
              </Group>
              <Button size="xs" variant="subtle" onClick={handleClearApartment}>
                {t('actions.clear')}
              </Button>
            </Group>

            <Grid>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">
                  {t('form.area')}
                </Text>
                <Text size="sm" fw={500}>
                  {data.apartment.area} m²
                </Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="xs" c="dimmed">
                  {t('form.roomCount')}
                </Text>
                <Text size="sm" fw={500}>
                  {data.apartment.roomCount}+1
                </Text>
              </Grid.Col>
              {data.apartment.rentPrice && (
                <Grid.Col span={12}>
                  <Text size="xs" c="dimmed">
                    {t('form.rentPrice')}
                  </Text>
                  <Text size="sm" fw={500}>
                    {data.apartment.rentPrice} TRY
                  </Text>
                </Grid.Col>
              )}
            </Grid>

            <Button
              size="sm"
              variant="light"
              leftSection={<IconCheck size={16} />}
              onClick={autoFillVariables}
            >
              {t('email.wizard.step3.autoFillVariables')}
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Available Variables Info */}
      {data.apartmentId && (
        <Paper p="md" withBorder>
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              {t('email.wizard.step3.availableVariables')}
            </Text>
            <Text size="xs" c="dimmed">
              {t('email.wizard.step3.variablesHint')}
            </Text>
            <Group gap="xs">
              <Badge size="sm">apartmentAddress</Badge>
              <Badge size="sm">apartmentUnitNumber</Badge>
              <Badge size="sm">apartmentArea</Badge>
              <Badge size="sm">apartmentRoomCount</Badge>
              <Badge size="sm">apartmentRentPrice</Badge>
              <Badge size="sm">propertyName</Badge>
            </Group>
          </Stack>
        </Paper>
      )}

      {!data.apartmentId && (
        <Paper p="md" withBorder style={{ borderStyle: 'dashed' }}>
          <Text size="sm" c="dimmed" ta="center">
            {t('email.wizard.step3.skipMessage')}
          </Text>
        </Paper>
      )}
    </Stack>
  );
}

