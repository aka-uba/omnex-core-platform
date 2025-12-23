'use client';

import { Modal, Stack, Group, Text, Button, Badge, ActionIcon, Paper, Switch, ColorInput, Divider, Popover, Box } from '@mantine/core';
import { IconGripVertical, IconChevronUp, IconChevronDown, IconEye, IconEyeOff, IconSettings, IconRefresh, IconPalette, IconBorderVertical, IconColorSwatch } from '@tabler/icons-react';
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/lib/i18n/client';

export interface ColumnSettingsColumn {
  key: string;
  label: string;
  sortable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
  backgroundColor?: string; // Column background color
}

export interface TableStyleSettings {
  showVerticalBorders: boolean;
  headerBackgroundColor: string;
}

interface ColumnSettingsModalProps {
  opened: boolean;
  onClose: () => void;
  columns: ColumnSettingsColumn[];
  onColumnReorder: (columns: ColumnSettingsColumn[]) => void;
  onColumnToggle: (columnKey: string, visible: boolean) => void;
  onReset: () => void;
  // Table style settings
  styleSettings?: TableStyleSettings;
  onStyleSettingsChange?: (settings: TableStyleSettings) => void;
}

const DEFAULT_STYLE_SETTINGS: TableStyleSettings = {
  showVerticalBorders: false,
  headerBackgroundColor: '',
};

export function ColumnSettingsModal({
  opened,
  onClose,
  columns,
  onColumnReorder,
  onColumnToggle,
  onReset,
  styleSettings = DEFAULT_STYLE_SETTINGS,
  onStyleSettingsChange,
}: ColumnSettingsModalProps) {
  const { t } = useTranslation('global');
  const [localColumns, setLocalColumns] = useState<ColumnSettingsColumn[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const prevColumnsRef = useRef<string>('');
  const [localStyleSettings, setLocalStyleSettings] = useState<TableStyleSettings>(styleSettings);
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null); // column key or 'header'

  useEffect(() => {
    if (opened) {
      // Create a stable key from columns to detect actual changes
      const columnsKey = columns.map(c => `${c.key}:${c.hidden}:${c.backgroundColor || ''}`).join('|');

      // Only update if columns actually changed (not just reference)
      if (prevColumnsRef.current !== columnsKey) {
        setLocalColumns([...columns]);
        prevColumnsRef.current = columnsKey;
      }
      // Sync style settings
      setLocalStyleSettings(styleSettings);
    } else {
      // Reset when modal closes
      prevColumnsRef.current = '';
    }
  }, [opened, columns, styleSettings]);

  const handleToggleVisibility = (columnKey: string) => {
    const newColumns = localColumns.map((col) =>
      col.key === columnKey ? { ...col, hidden: !col.hidden } : col
    );
    setLocalColumns(newColumns);
  };

  const handleColumnBackgroundChange = (columnKey: string, color: string) => {
    const newColumns = localColumns.map((col) =>
      col.key === columnKey ? { ...col, backgroundColor: color || undefined } : col
    );
    setLocalColumns(newColumns);
  };

  const handleStyleSettingChange = <K extends keyof TableStyleSettings>(
    key: K,
    value: TableStyleSettings[K]
  ) => {
    setLocalStyleSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;

    const newColumns = [...localColumns];
    const temp = newColumns[index - 1];
    if (temp && newColumns[index]) {
      newColumns[index - 1] = newColumns[index];
      newColumns[index] = temp;
      setLocalColumns(newColumns);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index === localColumns.length - 1) return;

    const newColumns = [...localColumns];
    const temp = newColumns[index];
    const nextItem = newColumns[index + 1];
    if (temp && nextItem) {
      newColumns[index] = nextItem;
      newColumns[index + 1] = temp;
      setLocalColumns(newColumns);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', String(index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newColumns = [...localColumns];
    const draggedColumn = newColumns[draggedIndex];
    
    if (!draggedColumn) return;
    
    // Remove dragged column
    newColumns.splice(draggedIndex, 1);
    
    // Insert at new position
    const newIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newColumns.splice(newIndex, 0, draggedColumn);
    
    setLocalColumns(newColumns);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleApply = () => {
    // Apply reorder and visibility changes together
    // onColumnReorder already contains all column information including hidden state and backgroundColor
    onColumnReorder(localColumns);
    // Apply style settings
    onStyleSettingsChange?.(localStyleSettings);
    onClose();
  };

  const handleReset = () => {
    // Reset style settings to defaults
    setLocalStyleSettings(DEFAULT_STYLE_SETTINGS);
    onStyleSettingsChange?.(DEFAULT_STYLE_SETTINGS);
    onReset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs" justify="space-between" style={{ width: '100%' }}>
          <Group gap="xs">
            <IconSettings size={20} />
            <Text fw={600} size="lg">
              {t('table.columnSettings.title')}
            </Text>
          </Group>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={handleReset}
            title={t('table.columnSettings.resetToDefaults')}
          >
            <IconRefresh size={18} />
          </ActionIcon>
        </Group>
      }
      size="lg"
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Stack gap="md">
        {/* Table Style Settings */}
        <Paper p="md" radius="md" withBorder bg="var(--mantine-color-gray-0)" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
          <Text fw={600} size="sm" mb="md">
            {t('table.columnSettings.tableStyle.title')}
          </Text>
          <Stack gap="md">
            {/* Vertical Borders Toggle */}
            <Group justify="space-between">
              <Group gap="xs">
                <IconBorderVertical size={18} style={{ color: 'var(--mantine-color-gray-6)' }} />
                <Text size="sm">{t('table.columnSettings.tableStyle.verticalBorders')}</Text>
              </Group>
              <Switch
                checked={localStyleSettings.showVerticalBorders}
                onChange={(e) => handleStyleSettingChange('showVerticalBorders', e.currentTarget.checked)}
                size="sm"
              />
            </Group>

            {/* Header Background Color */}
            <Group justify="space-between" align="flex-start">
              <Group gap="xs">
                <IconColorSwatch size={18} style={{ color: 'var(--mantine-color-gray-6)' }} />
                <Text size="sm">{t('table.columnSettings.tableStyle.headerBackground')}</Text>
              </Group>
              <ColorInput
                value={localStyleSettings.headerBackgroundColor}
                onChange={(color) => handleStyleSettingChange('headerBackgroundColor', color)}
                placeholder={t('table.columnSettings.tableStyle.selectColor')}
                size="xs"
                style={{ width: 150 }}
                swatches={['#228be6', '#40c057', '#fa5252', '#fab005', '#7950f2', '#fd7e14', '#20c997', '#868e96']}
                swatchesPerRow={8}
              />
            </Group>
          </Stack>
        </Paper>

        <Divider label={t('table.columnSettings.columnsSection')} labelPosition="center" />

        {/* Column Cards */}
        <Stack gap="xs">
          {localColumns.map((column, index) => (
            <Paper
              key={column.key}
              p="md"
              radius="md"
              withBorder
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              style={{
                opacity: column.hidden ? 0.6 : draggedIndex === index ? 0.5 : 1,
                cursor: 'move',
                transition: 'opacity 0.2s',
              }}
            >
              <Group justify="space-between" wrap="nowrap">
                {/* Drag Handle & Column Info */}
                <Group gap="md" style={{ flex: 1 }} wrap="nowrap">
                  <IconGripVertical 
                    size={20} 
                    style={{ 
                      cursor: 'grab', 
                      color: 'var(--mantine-color-gray-6)',
                      userSelect: 'none',
                    }} 
                  />
                  <div style={{ flex: 1 }}>
                    <Group gap="xs" mb={4}>
                      <Text fw={500} size="sm">
                        {column.label}
                      </Text>
                      {column.sortable && (
                        <Badge size="xs" color="blue" variant="light">
                          {t('table.columnSettings.badges.sortable')}
                        </Badge>
                      )}
                      {column.searchable && (
                        <Badge size="xs" color="green" variant="light">
                          {t('table.columnSettings.badges.searchable')}
                        </Badge>
                      )}
                      {column.filterable && (
                        <Badge size="xs" color="purple" variant="light">
                          {t('table.columnSettings.badges.filterable')}
                        </Badge>
                      )}
                    </Group>
                    <Text size="xs" c="dimmed">
                      {column.key}
                    </Text>
                  </div>
                </Group>

                {/* Actions */}
                <Group gap="xs" wrap="nowrap">
                  {/* Column Background Color Picker */}
                  <Popover
                    opened={colorPickerOpen === column.key}
                    onChange={(opened) => setColorPickerOpen(opened ? column.key : null)}
                    position="bottom"
                    withArrow
                    shadow="md"
                  >
                    <Popover.Target>
                      <ActionIcon
                        variant="subtle"
                        color={column.backgroundColor ? 'blue' : 'gray'}
                        onClick={() => setColorPickerOpen(colorPickerOpen === column.key ? null : column.key)}
                        title={t('table.columnSettings.columnBackground')}
                      >
                        <Box
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 4,
                            border: '2px solid var(--mantine-color-gray-4)',
                            backgroundColor: column.backgroundColor || 'transparent',
                          }}
                        />
                      </ActionIcon>
                    </Popover.Target>
                    <Popover.Dropdown>
                      <Stack gap="xs">
                        <Text size="xs" fw={500}>{t('table.columnSettings.columnBackground')}</Text>
                        <ColorInput
                          value={column.backgroundColor || ''}
                          onChange={(color) => handleColumnBackgroundChange(column.key, color)}
                          placeholder={t('table.columnSettings.tableStyle.selectColor')}
                          size="xs"
                          style={{ width: 150 }}
                          swatches={['#e7f5ff', '#d3f9d8', '#ffe3e3', '#fff9db', '#e5dbff', '#ffe8cc', '#c3fae8', '#f1f3f5', '']}
                          swatchesPerRow={9}
                        />
                        {column.backgroundColor && (
                          <Button
                            variant="subtle"
                            size="xs"
                            color="gray"
                            onClick={() => {
                              handleColumnBackgroundChange(column.key, '');
                              setColorPickerOpen(null);
                            }}
                          >
                            {t('table.columnSettings.clearColor')}
                          </Button>
                        )}
                      </Stack>
                    </Popover.Dropdown>
                  </Popover>

                  {/* Visibility Toggle */}
                  <ActionIcon
                    variant="subtle"
                    color={column.hidden ? 'gray' : 'blue'}
                    onClick={() => handleToggleVisibility(column.key)}
                    title={column.hidden ? t('table.columnSettings.show') : t('table.columnSettings.hide')}
                  >
                    {column.hidden ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </ActionIcon>

                  {/* Move Buttons */}
                  <Group gap={2}>
                    <ActionIcon
                      variant="subtle"
                      size="sm"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      title={t('table.columnSettings.moveUp')}
                    >
                      <IconChevronUp size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      size="sm"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === localColumns.length - 1}
                      title={t('table.columnSettings.moveDown')}
                    >
                      <IconChevronDown size={16} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Group>
            </Paper>
          ))}
        </Stack>

        {/* Info */}
        <Paper p="sm" radius="md" bg="blue.0">
          <Text size="xs" c="blue">
            💡 <strong>{t('table.columnSettings.tip.title')}:</strong> {t('table.columnSettings.tip.description')}
          </Text>
        </Paper>

        {/* Footer */}
        <Group justify="space-between" mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <Button 
            variant="subtle" 
            color="gray" 
            onClick={handleReset}
            leftSection={<IconRefresh size={16} />}
          >
            {t('table.columnSettings.resetToDefaults')}
          </Button>
          <Group gap="xs">
            <Button variant="subtle" onClick={onClose}>
              {t('form.cancel')}
            </Button>
            <Button onClick={handleApply}>{t('table.filter.apply')}</Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}

