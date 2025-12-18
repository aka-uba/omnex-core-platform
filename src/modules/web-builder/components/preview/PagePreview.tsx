/**
 * Web Builder - Page Preview (FAZ 3)
 * iframe-based page preview system
 */

'use client';

import { useState } from 'react';
import { Card, Group, Button, Stack, ActionIcon, Tooltip, Text } from '@mantine/core';
import { IconDeviceDesktop, IconDeviceTablet, IconDeviceMobile, IconMaximize, IconX } from '@tabler/icons-react';
import { PageSection } from '../../types/builder.types';
import { widgetRegistry } from '@/lib/web-builder/widgets/WidgetRegistry';

interface PagePreviewProps {
  sections: PageSection[];
  pageTitle?: string;
  onClose?: () => void;
}

type PreviewSize = 'desktop' | 'tablet' | 'mobile' | 'fullscreen';

const previewSizes: Record<PreviewSize, { width: string; height: string }> = {
  desktop: { width: '100%', height: '800px' },
  tablet: { width: '768px', height: '1024px' },
  mobile: { width: '375px', height: '667px' },
  fullscreen: { width: '100vw', height: '100vh' },
};

export function PagePreview({ sections, pageTitle = 'Preview', onClose }: PagePreviewProps) {
  const [previewSize, setPreviewSize] = useState<PreviewSize>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleSizeChange = (size: PreviewSize) => {
    setPreviewSize(size);
    setIsFullscreen(size === 'fullscreen');
  };

  // Generate preview HTML
  const generatePreviewHTML = () => {
    const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .section {
      margin-bottom: 20px;
    }
    .element {
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  ${sections.map((section) => `
    <div class="section" data-section-id="${section.id}">
      ${section.elements.map((element) => {
        const widget = widgetRegistry.get(element.type);
        if (!widget) {
          return `<div class="element" data-element-id="${element.id}">Unknown widget: ${element.type}</div>`;
        }
        // For preview, we'll render a placeholder
        // In production, this would render the actual widget component
        return `<div class="element" data-element-id="${element.id}">
          <div style="padding: 20px; border: 1px dashed #ccc; background: #f9f9f9;">
            <strong>${widget.name}</strong>
            <p style="margin: 10px 0 0 0; color: #666;">Widget: ${element.type}</p>
          </div>
        </div>`;
      }).join('')}
    </div>
  `).join('')}
</body>
</html>
    `;
    return html;
  };

  const previewHTML = generatePreviewHTML();
  const previewBlob = new Blob([previewHTML], { type: 'text/html' });
  const previewUrl = URL.createObjectURL(previewBlob);

  if (isFullscreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          backgroundColor: '#1a1a1a',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Group justify="space-between" p="md" style={{ backgroundColor: '#2d2d2d' }}>
          <Group gap="xs">
            <Button
              size="sm"
              variant={previewSize === 'desktop' ? 'filled' : 'subtle'}
              onClick={() => handleSizeChange('desktop')}
              leftSection={<IconDeviceDesktop size={16} />}
            >
              Desktop
            </Button>
            <Button
              size="sm"
              variant={previewSize === 'tablet' ? 'filled' : 'subtle'}
              onClick={() => handleSizeChange('tablet')}
              leftSection={<IconDeviceTablet size={16} />}
            >
              Tablet
            </Button>
            <Button
              size="sm"
              variant={previewSize === 'mobile' ? 'filled' : 'subtle'}
              onClick={() => handleSizeChange('mobile')}
              leftSection={<IconDeviceMobile size={16} />}
            >
              Mobile
            </Button>
          </Group>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={() => {
              setIsFullscreen(false);
              setPreviewSize('desktop');
              onClose?.();
            }}
          >
            <IconX size={18} />
          </ActionIcon>
        </Group>
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <div
            style={{
              width: previewSizes[previewSize].width,
              height: previewSizes[previewSize].height,
              border: '1px solid #444',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: 'white',
            }}
          >
            <iframe
              src={previewUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              title="Page Preview"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card withBorder padding="md" radius="md" style={{ position: 'relative' }}>
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={600} size="lg">
            Sayfa Önizlemesi
          </Text>
          <Group gap="xs">
            <Tooltip label="Desktop">
              <ActionIcon
                variant={previewSize === 'desktop' ? 'filled' : 'subtle'}
                onClick={() => handleSizeChange('desktop')}
              >
                <IconDeviceDesktop size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Tablet">
              <ActionIcon
                variant={previewSize === 'tablet' ? 'filled' : 'subtle'}
                onClick={() => handleSizeChange('tablet')}
              >
                <IconDeviceTablet size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Mobile">
              <ActionIcon
                variant={previewSize === 'mobile' ? 'filled' : 'subtle'}
                onClick={() => handleSizeChange('mobile')}
              >
                <IconDeviceMobile size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Tam Ekran">
              <ActionIcon
                variant="subtle"
                onClick={() => handleSizeChange('fullscreen')}
              >
                <IconMaximize size={18} />
              </ActionIcon>
            </Tooltip>
            {onClose && (
              <Tooltip label="Kapat">
                <ActionIcon variant="subtle" onClick={onClose}>
                  <IconX size={18} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>

        <div
          style={{
            width: previewSizes[previewSize].width,
            height: previewSizes[previewSize].height,
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: 'white',
            margin: '0 auto',
          }}
        >
          <iframe
            src={previewUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title="Page Preview"
          />
        </div>

        <Text size="xs" c="dimmed" ta="center">
          {previewSize === 'desktop' && 'Masaüstü görünümü'}
          {previewSize === 'tablet' && 'Tablet görünümü (768px)'}
          {previewSize === 'mobile' && 'Mobil görünümü (375px)'}
        </Text>
      </Stack>
    </Card>
  );
}

