/**
 * Web Builder - Builder Properties Panel (FAZ 3)
 * Updated to support widget configuration
 */

'use client';

import { IconTrash } from '@tabler/icons-react';
import { Button, Stack, Text, Divider } from '@mantine/core';
import { widgetRegistry } from '@/lib/web-builder/widgets/WidgetRegistry';
import { SEOPanel, type SEOSettings } from '../seo/SEOPanel';
import { PageSection } from '../../types/builder.types';
import { WidgetConfigForm } from '../widget-config/WidgetConfigForm';

interface BuilderPropertiesProps {
  selectedElementId: string | null;
  sections: PageSection[];
  onDelete: () => void;
  onUpdateElement?: (elementId: string, updates: any) => void;
  seoSettings?: SEOSettings;
  onSEOChange?: (settings: SEOSettings) => void;
  showSEO?: boolean;
}

export function BuilderProperties({
  selectedElementId,
  sections,
  onDelete,
  onUpdateElement,
  seoSettings,
  onSEOChange,
  showSEO = false,
}: BuilderPropertiesProps) {
  // Find selected element
  const selectedElement = selectedElementId
    ? sections
        .flatMap((s) => s.elements)
        .find((e) => e.id === selectedElementId)
    : null;

  const widget = selectedElement ? widgetRegistry.get(selectedElement.type) : null;

  if (showSEO && seoSettings) {
    return (
      <div className="w-80 border-l bg-white p-4 h-full overflow-y-auto">
        <SEOPanel
          settings={seoSettings}
          onChange={onSEOChange || (() => {})}
        />
      </div>
    );
  }

  if (!selectedElementId || !selectedElement) {
    return (
      <div className="w-80 border-l bg-white p-4 h-full">
        <Stack gap="md">
          <div>
            <Text fw={600} size="lg" mb="xs">
              Properties
            </Text>
            <Text size="sm" c="dimmed">
              Bir element seçin veya SEO ayarlarını düzenleyin.
            </Text>
          </div>
        </Stack>
      </div>
    );
  }

  return (
    <div className="w-80 border-l bg-white p-4 h-full flex flex-col">
      <Stack gap="md" style={{ flex: 1 }}>
        <div>
          <Text fw={600} size="lg" mb="xs">
            Element Properties
          </Text>
          {widget && (
            <Text size="sm" c="dimmed">
              {widget.name}
            </Text>
          )}
        </div>

        <Divider />

        {/* Widget Configuration */}
        {widget && widget.configSchema && (
          <div>
            <Text size="sm" fw={500} mb="xs">
              Konfigürasyon
            </Text>
            <div className="mt-2">
              <WidgetConfigForm
                widgetId={selectedElement.type}
                currentConfig={{
                  ...selectedElement.content,
                  ...selectedElement.settings,
                }}
                onSave={(config) => {
                  if (onUpdateElement) {
                    onUpdateElement(selectedElement.id, {
                      content: config,
                      settings: {},
                    });
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Element Info */}
        <div>
          <Text size="sm" fw={500} mb="xs">
            Element Bilgileri
          </Text>
          <Stack gap="xs">
            <div>
              <Text size="xs" c="dimmed">
                Widget ID
              </Text>
              <Text size="sm">{selectedElement.type}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">
                Element ID
              </Text>
              <Text size="sm" style={{ fontFamily: 'monospace' }}>
                {selectedElement.id}
              </Text>
            </div>
          </Stack>
        </div>
      </Stack>

      {/* Delete Button */}
      <div className="mt-auto pt-4 border-t">
        <Button
          color="red"
          variant="light"
          fullWidth
          leftSection={<IconTrash size={16} />}
          onClick={onDelete}
        >
          Element'i Sil
        </Button>
      </div>
    </div>
  );
}
