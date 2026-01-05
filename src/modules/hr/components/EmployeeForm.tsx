'use client';

import { useEffect } from 'react';
import { useForm } from '@mantine/form';
import {
  Paper,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  Grid,
  NumberInput,
  Switch,
  Loader,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { IconArrowLeft } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useCreateEmployee, useUpdateEmployee, useEmployee } from '@/hooks/useEmployees';
import { useUsers } from '@/hooks/useUsers';
import { useEmployees } from '@/hooks/useEmployees';
import { useTranslation } from '@/lib/i18n/client';
import { useCurrency } from '@/hooks/useCurrency';
import { CURRENCY_SELECT_OPTIONS } from '@/lib/constants/currency';
import { employeeCreateSchema } from '@/modules/hr/schemas/hr.schema';
import type { WorkType } from '@/modules/hr/types/hr';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import 'dayjs/locale/de';
import 'dayjs/locale/ar';

interface EmployeeFormProps {
  locale: string;
  employeeId?: string;
}

export function EmployeeForm({ locale, employeeId }: EmployeeFormProps) {
  const router = useRouter();
  const { t } = useTranslation('modules/hr');
  const { t: tGlobal } = useTranslation('global');
  const { currency: defaultCurrency } = useCurrency();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const { data: employeeData, isLoading: isLoadingEmployee } = useEmployee(employeeId || '');

  // Fetch users and employees for selection
  const { data: usersData } = useUsers({ page: 1, pageSize: 1000 });
  const { data: employeesData } = useEmployees({ page: 1, pageSize: 1000, isActive: true });

  // Set dayjs locale
  useEffect(() => {
    const dayjsLocale = locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en';
    dayjs.locale(dayjsLocale);
  }, [locale]);

  const isEdit = !!employeeId;

  const form = useForm({
    initialValues: {
      userId: '',
      employeeNumber: '',
      department: '',
      position: '',
      hireDate: new Date(),
      managerId: null as string | null,
      salary: null as number | null,
      salaryGroup: '',
      currency: 'TRY',
      workType: 'full_time' as WorkType,
      isActive: true,
    },
    validate: {
      userId: (value) => (!value ? t('employees.form.user') + ' ' + tGlobal('common.required') : null),
      employeeNumber: (value) => (!value ? t('employees.form.employeeNumber') + ' ' + tGlobal('common.required') : null),
      department: (value) => (!value ? t('employees.form.department') + ' ' + tGlobal('common.required') : null),
      position: (value) => (!value ? t('employees.form.position') + ' ' + tGlobal('common.required') : null),
      hireDate: (value) => (!value ? t('employees.form.hireDate') + ' ' + tGlobal('common.required') : null),
    },
  });

  // Load employee data for edit
  useEffect(() => {
    if (isEdit && employeeData && !isLoadingEmployee) {
      if (form.values.userId === '') {
        form.setValues({
          userId: employeeData.userId,
          employeeNumber: employeeData.employeeNumber,
          department: employeeData.department,
          position: employeeData.position,
          hireDate: new Date(employeeData.hireDate),
          managerId: employeeData.managerId || null,
          salary: employeeData.salary || null,
          salaryGroup: employeeData.salaryGroup || '',
          currency: employeeData.currency,
          workType: employeeData.workType,
          isActive: employeeData.isActive,
        });
      }
    }
  }, [isEdit, employeeData, isLoadingEmployee, form.values.userId]);

  // Set default currency from GeneralSettings for new employees
  useEffect(() => {
    if (!isEdit && defaultCurrency && form.values.currency === 'TRY') {
      form.setFieldValue('currency', defaultCurrency);
    }
  }, [isEdit, defaultCurrency]);

  // Get users for selection
  const userOptions: Array<{ value: string; label: string }> = 
    (usersData?.users || []).map((user) => ({
      value: user.id,
      label: `${user.name} (${user.email})`,
    }));

  // Get employees for manager selection
  const managerOptions: Array<{ value: string; label: string }> = 
    (employeesData?.employees || [])
      .filter(emp => !employeeId || emp.id !== employeeId) // Exclude current employee
      .map((emp) => ({
        value: emp.id,
        label: `${emp.user?.name || '-'} (${emp.employeeNumber})`,
      }));

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const formData = {
        userId: values.userId,
        employeeNumber: values.employeeNumber,
        department: values.department,
        position: values.position,
        hireDate: values.hireDate.toISOString(),
        managerId: values.managerId || undefined,
        salary: values.salary ?? undefined,
        salaryGroup: values.salaryGroup || undefined,
        currency: values.currency,
        workType: values.workType,
      };

      const validatedData = employeeCreateSchema.parse(formData);

      if (isEdit && employeeId) {
        await updateEmployee.mutateAsync({
          id: employeeId,
          ...(validatedData as any),
          isActive: values.isActive,
        });
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('employees.updateSuccess'),
        });
      } else {
        await createEmployee.mutateAsync(validatedData as any);
        showToast({
          type: 'success',
          title: t('messages.success'),
          message: t('employees.createSuccess'),
        });
      }

      router.push(`/${locale}/modules/hr/employees`);
    } catch (error) {
      showToast({
        type: 'error',
        title: t('messages.error'),
        message: error instanceof Error ? error.message : t('messages.createError'),
      });
    }
  };

  if (isEdit && isLoadingEmployee) {
    return (
      <Paper shadow="xs" p="md">
        <Loader />
      </Paper>
    );
  }

  return (
    <Paper shadow="xs" p="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => router.push(`/${locale}/modules/hr/employees`)}
          >
            {tGlobal('common.back')}
          </Button>

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('employees.form.user')}
                placeholder={t('employees.form.userPlaceholder')}
                data={userOptions}
                searchable
                required
                disabled={isEdit}
                {...form.getInputProps('userId')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('employees.form.employeeNumber')}
                placeholder={t('employees.form.employeeNumberPlaceholder')}
                required
                {...form.getInputProps('employeeNumber')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('employees.form.department')}
                placeholder={t('employees.form.departmentPlaceholder')}
                required
                {...form.getInputProps('department')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('employees.form.position')}
                placeholder={t('employees.form.positionPlaceholder')}
                required
                {...form.getInputProps('position')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <DatePickerInput
                label={t('employees.form.hireDate')}
                placeholder={t('employees.form.hireDatePlaceholder')}
                required
                locale={locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en'}
                {...form.getInputProps('hireDate')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('employees.form.manager')}
                placeholder={t('employees.form.managerPlaceholder')}
                data={managerOptions}
                searchable
                clearable
                {...form.getInputProps('managerId')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('employees.form.workType')}
                placeholder={t('employees.form.workTypePlaceholder')}
                data={[
                  { value: 'full_time', label: t('employees.workTypes.full_time') },
                  { value: 'part_time', label: t('employees.workTypes.part_time') },
                  { value: 'contract', label: t('employees.workTypes.contract') },
                ]}
                required
                {...form.getInputProps('workType')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('employees.form.salary')}
                placeholder={t('employees.form.salaryPlaceholder')}
                min={0}
                decimalScale={2}
                leftSection="₺"
                {...form.getInputProps('salary')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label={t('employees.form.salaryGroup')}
                placeholder={t('employees.form.salaryGroupPlaceholder')}
                {...form.getInputProps('salaryGroup')}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label={t('employees.form.currency')}
                placeholder={t('employees.form.currencyPlaceholder')}
                data={CURRENCY_SELECT_OPTIONS}
                {...form.getInputProps('currency')}
              />
            </Grid.Col>

            {isEdit && (
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Switch
                  label={t('employees.form.isActive')}
                  {...form.getInputProps('isActive', { type: 'checkbox' })}
                />
              </Grid.Col>
            )}
          </Grid>

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={() => router.push(`/${locale}/modules/hr/employees`)}
            >
              {tGlobal('form.cancel')}
            </Button>
            <Button
              type="submit"
              loading={createEmployee.isPending || updateEmployee.isPending}
            >
              {isEdit ? tGlobal('form.save') : tGlobal('form.create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}

