/**
 * Web Builder - Widget Configuration Form Builder (FAZ 3)
 * Simplified form builder - widgets can provide their own config forms
 */

'use client';

import { useForm } from '@mantine/form';
import { z } from 'zod';
import {
  TextInput,
  Textarea,
  NumberInput,
  Switch,
  Button,
  Stack,
  Text,
  Group,
} from '@mantine/core';
import { widgetRegistry } from '@/lib/web-builder/widgets/WidgetRegistry';

interface WidgetConfigFormProps {
  widgetId: string;
  currentConfig: Record<string, any>;
  onSave: (config: Record<string, any>) => void;
  onCancel?: () => void;
}

/**
 * Simple form field renderer - basic types only
 * For complex schemas, widgets should provide custom config components
 */
function renderSimpleField(
  fieldName: string,
  fieldValue: any,
  form: any
): React.ReactNode {
  const fieldType = typeof fieldValue;

  if (fieldType === 'boolean') {
    return (
      <Switch
        key={fieldName}
        label={fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1')}
        {...form.getInputProps(fieldName, { type: 'checkbox' })}
      />
    );
  }

  if (fieldType === 'number') {
    return (
      <NumberInput
        key={fieldName}
        label={fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1')}
        {...form.getInputProps(fieldName)}
      />
    );
  }

  if (Array.isArray(fieldValue)) {
    return (
      <TextInput
        key={fieldName}
        label={fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1')}
        placeholder="Comma-separated values"
        {...form.getInputProps(fieldName)}
      />
    );
  }

  if (fieldType === 'string' && fieldValue && fieldValue.length > 100) {
    return (
      <Textarea
        key={fieldName}
        label={fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1')}
        minRows={3}
        maxRows={5}
        {...form.getInputProps(fieldName)}
      />
    );
  }

  return (
    <TextInput
      key={fieldName}
      label={fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1')}
      {...form.getInputProps(fieldName)}
    />
  );
}

export function WidgetConfigForm({
  widgetId,
  currentConfig,
  onSave,
  onCancel,
}: WidgetConfigFormProps) {
  const widget = widgetRegistry.get(widgetId);

  if (!widget || !widget.configSchema) {
    return (
      <div className="p-4">
        <Text c="dimmed">Widget configuration not available</Text>
      </div>
    );
  }

  const form = useForm({
    initialValues: {
      ...widget.defaultConfig,
      ...currentConfig,
    },
  });

  const handleSubmit = (values: Record<string, any>) => {
    // Validate with Zod schema
    try {
      const validated = widget.configSchema.parse(values) as Record<string, any>;
      onSave(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Show validation errors
        console.error('Validation errors:', error.issues);
        // In production, show these errors to user
      }
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <div>
          <Text fw={600} size="lg" mb="xs">
            {widget.name} Ayarları
          </Text>
          {widget.description && (
            <Text size="sm" c="dimmed">
              {widget.description}
            </Text>
          )}
        </div>

        {/* Render fields based on default config values */}
        {Object.entries(widget.defaultConfig).map(([fieldName, fieldValue]) =>
          renderSimpleField(fieldName, fieldValue, form)
        )}

        <Group justify="flex-end" mt="md">
          {onCancel && (
            <Button variant="subtle" onClick={onCancel}>
              İptal
            </Button>
          )}
          <Button type="submit">Kaydet</Button>
        </Group>
      </Stack>
    </form>
  );
}
