'use client';

import {
  Stack,
  TextInput,
  Select,
  Grid,
  MultiSelect,
  Divider,
  Text,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useTranslation } from '@/lib/i18n/client';
import { UseFormReturnType } from '@mantine/form';
import type { UserFormData } from '@/lib/schemas/user';
import classes from './WorkInfoTab.module.css';

interface WorkInfoTabProps {
  form: UseFormReturnType<UserFormData>;
}

export function WorkInfoTab({ form }: WorkInfoTabProps) {
  const { t } = useTranslation('modules/users');

  // Mock agencies - should come from API
  const agencies = [
    { value: '1', label: 'Stark Industries' },
    { value: '2', label: 'Wayne Enterprises' },
    { value: '3', label: 'Cyberdyne Systems' },
  ];

  return (
    <Stack gap="xl" p="xl" className={classes.container}>
      <div>
        <Text fw={600} size="lg">{t('form.work.title')}</Text>
        <Text size="sm" c="dimmed">{t('form.work.description')}</Text>
      </div>

      <Divider />

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Select
            label={t('form.work.department')}
            placeholder={t('form.work.departmentPlaceholder')}
            data={['Engineering', 'Marketing', 'Sales', 'HR', 'Finance']}
            {...form.getInputProps('work.department')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            label={t('form.work.position')}
            placeholder={t('form.work.positionPlaceholder')}
            {...form.getInputProps('work.position')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            label={t('form.work.employeeId')}
            placeholder={t('form.work.employeeIdPlaceholder')}
            {...form.getInputProps('work.employeeId')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <DateInput
            label={t('form.work.hireDate')}
            placeholder={t('form.work.hireDatePlaceholder')}
            {...form.getInputProps('work.hireDate')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TextInput
            label={t('form.work.manager')}
            placeholder={t('form.work.managerPlaceholder')}
            {...form.getInputProps('work.manager')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <Select
            label={t('form.work.role')}
            required
            data={[
              { value: 'SuperAdmin', label: 'Super Admin' },
              { value: 'AgencyUser', label: 'Agency User' },
              { value: 'ClientUser', label: 'Client User' },
            ]}
            {...form.getInputProps('work.role')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12 }}>
          <MultiSelect
            label={t('form.work.assignAgency')}
            placeholder={t('form.work.assignAgencyPlaceholder')}
            data={agencies}
            {...form.getInputProps('work.agencyIds')}
          />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

