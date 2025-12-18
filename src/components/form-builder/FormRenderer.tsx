'use client';

// Form Renderer Component
// FAZ 0.5: Dinamik Form Builder

import { useState, useEffect } from 'react';
import { useForm } from '@mantine/form';
import {
  TextInput,
  Textarea,
  NumberInput,
  Select,
  MultiSelect,
  Checkbox,
  Radio,
  Switch,
  FileInput,
  ColorInput,
  Button,
  Group,
  Stack,
  Grid,
} from '@mantine/core';
import { DateInput, DateTimePicker, TimeInput } from '@mantine/dates';
import { FormField, FormRenderOptions } from '@/lib/form-builder/types';
import { useParams } from 'next/navigation';

interface FormRendererProps {
  fields: FormField[];
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  options?: FormRenderOptions;
  isLoading?: boolean;
}

export function FormRenderer({
  fields,
  initialValues = {},
  onSubmit,
  options = {},
  isLoading = false,
}: FormRendererProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const dayjsLocale = locale === 'tr' ? 'tr' : locale === 'de' ? 'de' : locale === 'ar' ? 'ar' : 'en';
  
  const {
    showLabels = true,
    showDescriptions = true,
    layout = 'vertical',
    columns = 1,
    spacing = 'md',
    submitButton = { label: 'Submit', variant: 'filled', color: 'blue' },
    resetButton = { label: 'Reset', show: false },
  } = options;

  // Build form schema from fields
  const formSchema: Record<string, any> = {};
  fields.forEach(field => {
    if (field.defaultValue !== undefined) {
      formSchema[field.name] = initialValues[field.name] ?? field.defaultValue;
    } else {
      formSchema[field.name] = initialValues[field.name] ?? null;
    }
  });

  const form = useForm({
    initialValues: formSchema,
    validate: buildValidation(fields),
  });

  // Handle field dependencies - combined state to avoid multiple re-renders
  const [fieldStates, setFieldStates] = useState<{
    visible: Set<string>;
    enabled: Set<string>;
    required: Set<string>;
  }>({
    visible: new Set(fields.map(f => f.name)),
    enabled: new Set(fields.map(f => f.name)),
    required: new Set(fields.filter(f => f.required).map(f => f.name)),
  });

  useEffect(() => {
    // Calculate all field states at once to batch into single update
    const newVisible = new Set(fields.map(f => f.name));
    const newEnabled = new Set(fields.map(f => f.name));
    const newRequired = new Set(fields.filter(f => f.required).map(f => f.name));

    // Update field visibility/enabled state based on dependencies
    fields.forEach(field => {
      if (field.dependencies) {
        field.dependencies.forEach(dep => {
          const depValue = form.values[dep.field];
          let shouldShow = true;
          let shouldEnable = true;
          let shouldRequire = field.required || false;

          // Check condition
          const conditionMet = checkCondition(depValue, dep.condition, dep.value);

          if (conditionMet) {
            if (dep.action === 'show') shouldShow = true;
            if (dep.action === 'hide') shouldShow = false;
            if (dep.action === 'enable') shouldEnable = true;
            if (dep.action === 'disable') shouldEnable = false;
            if (dep.action === 'require') shouldRequire = true;
          } else {
            if (dep.action === 'show') shouldShow = false;
            if (dep.action === 'hide') shouldShow = true;
            if (dep.action === 'enable') shouldEnable = false;
            if (dep.action === 'disable') shouldEnable = true;
            if (dep.action === 'require') shouldRequire = false;
          }

          if (shouldShow) newVisible.add(field.name);
          else newVisible.delete(field.name);

          if (shouldEnable) newEnabled.add(field.name);
          else newEnabled.delete(field.name);

          if (shouldRequire) newRequired.add(field.name);
          else newRequired.delete(field.name);
        });
      }
    });

    // Single state update instead of three
    setFieldStates({
      visible: newVisible,
      enabled: newEnabled,
      required: newRequired,
    });
  }, [form.values, fields]);

  // Destructure for easier access
  const { visible: visibleFields, enabled: enabledFields, required: requiredFields } = fieldStates;

  const handleSubmit = form.onSubmit(async (values) => {
    await onSubmit(values);
  });

  const renderField = (field: FormField) => {
    if (!visibleFields.has(field.name)) {
      return null;
    }

    const commonProps = {
      key: field.id,
      ...(showLabels && field.label ? { label: field.label } : {}),
      ...(showDescriptions && field.description ? { description: field.description } : {}),
      ...(field.placeholder ? { placeholder: field.placeholder } : {}),
      required: requiredFields.has(field.name),
      disabled: field.disabled || !enabledFields.has(field.name),
      ...(field.readonly !== undefined ? { readOnly: field.readonly } : {}),
      ...form.getInputProps(field.name),
    };

    const colSpan = field.layout?.colSpan || 12 / columns;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
      case 'tel':
        return (
          <Grid.Col key={field.id} span={colSpan}>
            <TextInput {...commonProps} type={field.type} />
          </Grid.Col>
        );

      case 'textarea':
        return (
          <Grid.Col key={field.id} span={colSpan}>
            <Textarea {...commonProps} minRows={3} />
          </Grid.Col>
        );

      case 'number':
        return (
          <Grid.Col key={field.id} span={colSpan}>
            <NumberInput
              {...commonProps}
              {...(field.validation?.min !== undefined ? { min: field.validation.min } : {})}
              {...(field.validation?.max !== undefined ? { max: field.validation.max } : {})}
            />
          </Grid.Col>
        );

      case 'password':
        return (
          <Grid.Col key={field.id} span={colSpan}>
            <TextInput {...commonProps} type="password" />
          </Grid.Col>
        );

      case 'date':
        return (
          <Grid.Col key={field.id} span={colSpan}>
            <DateInput {...commonProps} locale={dayjsLocale} />
          </Grid.Col>
        );

      case 'datetime':
        return (
          <Grid.Col key={field.id} span={colSpan}>
            <DateTimePicker {...commonProps} locale={dayjsLocale} />
          </Grid.Col>
        );

      case 'time':
        return (
          <Grid.Col key={field.id} span={colSpan}>
            <TimeInput {...commonProps} />
          </Grid.Col>
        );

      case 'select':
        return (
          <Grid.Col key={field.id} span={colSpan}>
            <Select {...commonProps} data={field.options || []} />
          </Grid.Col>
        );

      case 'multiselect':
        return (
          <Grid.Col key={field.id} span={colSpan}>
            <MultiSelect {...commonProps} data={field.options || []} />
          </Grid.Col>
        );

      case 'checkbox':
        return (
          <Grid.Col key={field.id} span={colSpan}>
            <Checkbox {...commonProps} label={field.label} />
          </Grid.Col>
        );

      case 'radio':
        return (
          <Grid.Col key={field.id} span={colSpan}>
            <Radio.Group {...commonProps} label={field.label}>
              <Stack gap="xs">
                {field.options?.map(option => (
                  <Radio key={option.value} value={option.value} label={option.label} />
                ))}
              </Stack>
            </Radio.Group>
          </Grid.Col>
        );

      case 'switch':
        return (
          <Grid.Col key={field.id} span={colSpan}>
            <Switch {...commonProps} label={field.label} />
          </Grid.Col>
        );

      case 'file':
      case 'image':
        return (
          <Grid.Col key={field.id} span={colSpan}>
            <FileInput {...commonProps} {...(field.type === 'image' ? { accept: 'image/*' } : {})} />
          </Grid.Col>
        );

      case 'color':
        return (
          <Grid.Col key={field.id} span={colSpan}>
            <ColorInput {...commonProps} />
          </Grid.Col>
        );

      case 'hidden':
        return <input key={field.id} type="hidden" {...form.getInputProps(field.name)} />;

      default:
        return (
          <Grid.Col key={field.id} span={colSpan}>
            <TextInput {...commonProps} />
          </Grid.Col>
        );
    }
  };

  const sortedFields = [...fields].sort((a, b) => {
    const orderA = a.layout?.order || 0;
    const orderB = b.layout?.order || 0;
    return orderA - orderB;
  });

  return (
    <form onSubmit={handleSubmit}>
      {layout === 'grid' ? (
        <Grid gutter={spacing}>
          {sortedFields.map(renderField)}
        </Grid>
      ) : (
        <Stack gap={spacing}>
          {sortedFields.map(field => {
            const rendered = renderField(field);
            if (!rendered) return null;
            return rendered;
          })}
        </Stack>
      )}

      <Group mt="xl" justify="flex-end">
        {resetButton.show && (
          <Button
            variant="default"
            onClick={() => form.reset()}
            disabled={isLoading}
          >
            {resetButton.label}
          </Button>
        )}
        <Button
          type="submit"
          variant={submitButton.variant as any}
          {...(submitButton.color ? { color: submitButton.color } : {})}
          loading={isLoading}
        >
          {submitButton.label || undefined}
        </Button>
      </Group>
    </form>
  );
}

// Build validation rules from field definitions
function buildValidation(fields: FormField[]) {
  const validation: Record<string, (value: any) => string | null> = {};

  fields.forEach(field => {
    if (field.required) {
      validation[field.name] = (value: any) => {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return `${field.label} is required`;
        }
        return null;
      };
    }

    if (field.validation) {
      const existing = validation[field.name];
      validation[field.name] = (value: any) => {
        // Check required first
        if (existing) {
          const requiredError = existing(value);
          if (requiredError) return requiredError;
        }

        // Check minLength
        if (field.validation?.minLength && typeof value === 'string' && value.length < field.validation.minLength) {
          return `${field.label} must be at least ${field.validation.minLength} characters`;
        }

        // Check maxLength
        if (field.validation?.maxLength && typeof value === 'string' && value.length > field.validation.maxLength) {
          return `${field.label} must be at most ${field.validation.maxLength} characters`;
        }

        // Check min
        if (field.validation?.min !== undefined && typeof value === 'number' && value < field.validation.min) {
          return `${field.label} must be at least ${field.validation.min}`;
        }

        // Check max
        if (field.validation?.max !== undefined && typeof value === 'number' && value > field.validation.max) {
          return `${field.label} must be at most ${field.validation.max}`;
        }

        // Check pattern
        if (field.validation?.pattern && typeof value === 'string') {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(value)) {
            return `${field.label} format is invalid`;
          }
        }

        return null;
      };
    }
  });

  return validation;
}

// Check condition for field dependencies
function checkCondition(value: any, condition: string, expectedValue: any): boolean {
  switch (condition) {
    case 'equals':
      return value === expectedValue;
    case 'notEquals':
      return value !== expectedValue;
    case 'contains':
      return String(value).includes(String(expectedValue));
    case 'greaterThan':
      return Number(value) > Number(expectedValue);
    case 'lessThan':
      return Number(value) < Number(expectedValue);
    default:
      return false;
  }
}

