/**
 * Web Builder - Grid Layout System (FAZ 3)
 * 12-column grid system for responsive layouts
 */

'use client';

import { useState } from 'react';
import { Card, Group, Button, Text, Stack, Select } from '@mantine/core';
import { IconLayoutGrid, IconColumnInsertLeft, IconColumnRemove } from '@tabler/icons-react';
import { PageSection } from '../../types/builder.types';

interface GridBuilderProps {
  sections: PageSection[];
  onSectionsChange: (sections: PageSection[]) => void;
  selectedSectionId?: string | null;
  onSectionSelect?: (sectionId: string | null) => void;
}

// GridColumn interface removed - unused

export function GridBuilder({
  sections,
  onSectionsChange,
  selectedSectionId,
  onSectionSelect,
}: GridBuilderProps) {
  const [breakpoint, setBreakpoint] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const handleAddSection = () => {
    const newSection: PageSection = {
      id: Date.now().toString(),
      type: 'grid',
      order: sections.length,
      elements: [],
      settings: {
        columns: 12,
        gap: 'md',
        padding: 'md',
      },
    };
    onSectionsChange([...sections, newSection]);
  };

  const handleAddColumn = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    // For now, add a placeholder element
    // In full implementation, this would add a column structure
    const newElement = {
      id: Date.now().toString() + '-col',
      type: 'column',
      content: {},
      settings: {
        span: 6, // Default 50% width
      },
    };

    const updatedSections = sections.map((s) =>
      s.id === sectionId
        ? {
            ...s,
            elements: [...s.elements, newElement],
          }
        : s
    );

    onSectionsChange(updatedSections);
  };

  const handleRemoveColumn = (sectionId: string, elementId: string) => {
    const updatedSections = sections.map((s) =>
      s.id === sectionId
        ? {
            ...s,
            elements: s.elements.filter((e) => e.id !== elementId),
          }
        : s
    );

    onSectionsChange(updatedSections);
  };

  return (
    <Card withBorder padding="md" radius="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="xs">
            <IconLayoutGrid size={20} />
            <Text fw={600} size="lg">
              Grid Layout
            </Text>
          </Group>
          <Select
            value={breakpoint}
            onChange={(value) => setBreakpoint(value as 'desktop' | 'tablet' | 'mobile')}
            data={[
              { value: 'desktop', label: 'Desktop (12 cols)' },
              { value: 'tablet', label: 'Tablet (8 cols)' },
              { value: 'mobile', label: 'Mobile (4 cols)' },
            ]}
            size="sm"
          />
        </Group>

        <div>
          <Text size="sm" c="dimmed" mb="md">
            {breakpoint === 'desktop' && '12-column grid system'}
            {breakpoint === 'tablet' && '8-column grid system'}
            {breakpoint === 'mobile' && '4-column grid system'}
          </Text>

          {sections.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed rounded">
              <Text c="dimmed" mb="md">
                Henüz section yok
              </Text>
              <Button onClick={handleAddSection} leftSection={<IconColumnInsertLeft size={16} />}>
                İlk Section'ı Ekle
              </Button>
            </div>
          ) : (
            <Stack gap="md">
              {sections.map((section) => (
                <Card
                  key={section.id}
                  withBorder
                  padding="sm"
                  className={`cursor-pointer ${
                    selectedSectionId === section.id ? 'border-blue-500 ring-2 ring-blue-200' : ''
                  }`}
                  onClick={() => onSectionSelect?.(section.id)}
                >
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={500}>
                      Section {section.order + 1}
                    </Text>
                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant="subtle"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddColumn(section.id);
                        }}
                      >
                        <IconColumnInsertLeft size={14} />
                      </Button>
                      {section.elements.length > 0 && (
                        <Button
                          size="xs"
                          variant="subtle"
                          color="red"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (section.elements.length > 0) {
                              const lastElement = section.elements[section.elements.length - 1];
                              if (lastElement) {
                                handleRemoveColumn(section.id, lastElement.id);
                              }
                            }
                          }}
                        >
                          <IconColumnRemove size={14} />
                        </Button>
                      )}
                    </Group>
                  </Group>
                  <div className="grid grid-cols-12 gap-2">
                    {section.elements.map((element, index) => {
                      const span = element.settings?.span || 6;
                      return (
                        <div
                          key={element.id}
                          className={`col-span-${span} p-2 border border-gray-200 rounded bg-gray-50`}
                        >
                          <Text size="xs" c="dimmed">
                            Column {index + 1} ({span} cols)
                          </Text>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))}
              <Button
                variant="light"
                fullWidth
                onClick={handleAddSection}
                leftSection={<IconColumnInsertLeft size={16} />}
              >
                Yeni Section Ekle
              </Button>
            </Stack>
          )}
        </div>
      </Stack>
    </Card>
  );
}

