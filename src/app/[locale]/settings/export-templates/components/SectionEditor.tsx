'use client';

import { useCallback } from 'react';
import {
    Paper,
    Group,
    Stack,
    Text,
    Button,
    ActionIcon,
    Select,
    TextInput,
    FileInput,
    Image,
    Badge,
    Box,
    Grid,
    Divider,
    Menu,
    Title,
} from '@mantine/core';
import {
    IconPlus,
    IconTrash,
    IconPhoto,
    IconLetterT,
    IconVariable,
    IconLine,
    IconSpace,
    IconGripVertical,
} from '@tabler/icons-react';
import type { TemplateSection, SectionColumn, SectionItem, SectionItemType } from '@/lib/export/types';

interface SectionEditorProps {
    sections: TemplateSection[];
    onChange: (sections: TemplateSection[]) => void;
    title: string;
    t: (key: string) => string;
}

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Create empty section with specified column count
const createSection = (columnCount: number = 1): TemplateSection => ({
    id: generateId(),
    columns: Array.from({ length: columnCount }, () => ({
        id: generateId(),
        items: [],
    })),
});

// Create empty item
const createItem = (type: SectionItemType): SectionItem => ({
    id: generateId(),
    type,
    value: type === 'variable' ? '{{pageTitle}}' : '',
});

// Item type options
const ITEM_TYPES: { value: SectionItemType; label: string; icon: React.ReactNode }[] = [
    { value: 'logo', label: 'Logo', icon: <IconPhoto size={14} /> },
    { value: 'text', label: 'Metin', icon: <IconLetterT size={14} /> },
    { value: 'variable', label: 'Degisken', icon: <IconVariable size={14} /> },
    { value: 'divider', label: 'Ayirici', icon: <IconLine size={14} /> },
    { value: 'spacer', label: 'Bosluk', icon: <IconSpace size={14} /> },
];

// Variable options for dropdown
const VARIABLE_OPTIONS = [
    { value: '{{pageTitle}}', label: 'Sayfa Basligi' },
    { value: '{{companyName}}', label: 'Firma Adi' },
    { value: '{{companyAddress}}', label: 'Firma Adresi' },
    { value: '{{companyPhone}}', label: 'Firma Telefonu' },
    { value: '{{companyEmail}}', label: 'Firma E-posta' },
    { value: '{{companyWebsite}}', label: 'Firma Web Sitesi' },
    { value: '{{companyTaxId}}', label: 'Vergi Numarasi' },
    { value: '{{date}}', label: 'Tarih' },
    { value: '{{year}}', label: 'Yil' },
];

// Single Item Editor
function ItemEditor({
    item,
    onUpdate,
    onRemove,
    t,
}: {
    item: SectionItem;
    onUpdate: (item: SectionItem) => void;
    onRemove: () => void;
    t: (key: string) => string;
}) {
    const handleLogoChange = (file: File | null) => {
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onUpdate({ ...item, logoUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const getItemTypeLabel = (type: SectionItemType) => {
        const found = ITEM_TYPES.find(t => t.value === type);
        return found?.label || type;
    };

    return (
        <Paper p="xs" withBorder style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
            <Group justify="space-between" mb="xs">
                <Group gap="xs">
                    <IconGripVertical size={14} style={{ cursor: 'grab', color: 'var(--mantine-color-gray-5)' }} />
                    <Badge size="xs" variant="light">{getItemTypeLabel(item.type)}</Badge>
                </Group>
                <ActionIcon size="xs" color="red" variant="subtle" onClick={onRemove}>
                    <IconTrash size={12} />
                </ActionIcon>
            </Group>

            {item.type === 'logo' && (
                <Stack gap="xs">
                    <FileInput
                        size="xs"
                        placeholder={t('sections.selectLogo')}
                        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                        leftSection={<IconPhoto size={14} />}
                        onChange={handleLogoChange}
                    />
                    {item.logoUrl && (
                        <Image src={item.logoUrl} alt="Logo" h={40} w="auto" fit="contain" />
                    )}
                </Stack>
            )}

            {item.type === 'text' && (
                <TextInput
                    size="xs"
                    placeholder={t('sections.enterText')}
                    value={item.value || ''}
                    onChange={(e) => onUpdate({ ...item, value: e.target.value })}
                />
            )}

            {item.type === 'variable' && (
                <Select
                    size="xs"
                    placeholder={t('sections.selectVariable')}
                    data={VARIABLE_OPTIONS}
                    value={item.value || ''}
                    onChange={(value) => onUpdate({ ...item, value: value || '' })}
                    searchable
                    allowDeselect={false}
                />
            )}

            {(item.type === 'text' || item.type === 'variable') && (
                <Group gap="xs" mt="xs" grow>
                    <Select
                        size="xs"
                        placeholder={t('sections.fontSize')}
                        data={[
                            { value: '12', label: '12px' },
                            { value: '14', label: '14px' },
                            { value: '16', label: '16px' },
                            { value: '18', label: '18px' },
                            { value: '20', label: '20px' },
                            { value: '24', label: '24px' },
                            { value: '28', label: '28px' },
                            { value: '32', label: '32px' },
                        ]}
                        value={item.fontSize ? String(item.fontSize) : '14'}
                        onChange={(value) => onUpdate({ ...item, fontSize: value ? Number(value) : 14 })}
                    />
                    <Select
                        size="xs"
                        placeholder={t('sections.fontWeight')}
                        data={[
                            { value: 'normal', label: t('sections.normal') },
                            { value: 'bold', label: t('sections.bold') },
                        ]}
                        value={item.fontWeight || 'normal'}
                        onChange={(value) => onUpdate({ ...item, fontWeight: (value as 'normal' | 'bold') || 'normal' })}
                    />
                </Group>
            )}

            {item.type === 'divider' && (
                <Divider my="xs" />
            )}

            {item.type === 'spacer' && (
                <Box h={20} style={{ backgroundColor: 'var(--mantine-color-gray-1)', borderRadius: 4 }} />
            )}
        </Paper>
    );
}

// Column Editor
function ColumnEditor({
    column,
    columnIndex,
    onUpdate,
    t,
}: {
    column: SectionColumn;
    columnIndex: number;
    onUpdate: (column: SectionColumn) => void;
    t: (key: string) => string;
}) {
    const addItem = (type: SectionItemType) => {
        const newItem = createItem(type);
        onUpdate({
            ...column,
            items: [...column.items, newItem],
        });
    };

    const updateItem = (itemIndex: number, item: SectionItem) => {
        const newItems = [...column.items];
        newItems[itemIndex] = item;
        onUpdate({ ...column, items: newItems });
    };

    const removeItem = (itemIndex: number) => {
        onUpdate({
            ...column,
            items: column.items.filter((_, i) => i !== itemIndex),
        });
    };

    return (
        <Paper p="sm" withBorder style={{ height: '100%', minHeight: 120 }}>
            <Group justify="space-between" mb="sm">
                <Text size="xs" fw={500} c="dimmed">
                    {t('sections.column')} {columnIndex + 1}
                </Text>
                <Menu shadow="md" width={150}>
                    <Menu.Target>
                        <ActionIcon size="sm" variant="light" color="blue">
                            <IconPlus size={14} />
                        </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                        {ITEM_TYPES.map((itemType) => (
                            <Menu.Item
                                key={itemType.value}
                                leftSection={itemType.icon}
                                onClick={() => addItem(itemType.value)}
                            >
                                {itemType.label}
                            </Menu.Item>
                        ))}
                    </Menu.Dropdown>
                </Menu>
            </Group>

            <Stack gap="xs">
                {column.items.map((item, itemIndex) => (
                    <ItemEditor
                        key={item.id}
                        item={item}
                        onUpdate={(updatedItem) => updateItem(itemIndex, updatedItem)}
                        onRemove={() => removeItem(itemIndex)}
                        t={t}
                    />
                ))}
                {column.items.length === 0 && (
                    <Text size="xs" c="dimmed" ta="center" py="md">
                        {t('sections.emptyColumn')}
                    </Text>
                )}
            </Stack>
        </Paper>
    );
}

// Single Section Editor
function SingleSectionEditor({
    section,
    sectionIndex,
    onUpdate,
    onRemove,
    t,
}: {
    section: TemplateSection;
    sectionIndex: number;
    onUpdate: (section: TemplateSection) => void;
    onRemove: () => void;
    t: (key: string) => string;
}) {
    const updateColumnCount = useCallback((newCount: number) => {
        const currentCount = section.columns.length;
        let newColumns: SectionColumn[];

        if (newCount > currentCount) {
            // Add new columns
            newColumns = [
                ...section.columns,
                ...Array.from({ length: newCount - currentCount }, () => ({
                    id: generateId(),
                    items: [],
                })),
            ];
        } else {
            // Remove columns from the end
            newColumns = section.columns.slice(0, newCount);
        }

        onUpdate({ ...section, columns: newColumns });
    }, [section, onUpdate]);

    const updateColumn = (columnIndex: number, column: SectionColumn) => {
        const newColumns = [...section.columns];
        newColumns[columnIndex] = column;
        onUpdate({ ...section, columns: newColumns });
    };

    const columnCount = section.columns.length;

    return (
        <Paper p="md" withBorder mb="md">
            <Group justify="space-between" mb="md">
                <Group gap="sm">
                    <IconGripVertical size={18} style={{ cursor: 'grab', color: 'var(--mantine-color-gray-5)' }} />
                    <Badge variant="filled" size="sm">
                        {t('sections.section')} {sectionIndex + 1}
                    </Badge>
                </Group>
                <Group gap="xs">
                    <Select
                        size="xs"
                        w={100}
                        value={String(columnCount)}
                        onChange={(value) => updateColumnCount(Number(value) || 1)}
                        data={[
                            { value: '1', label: '1 ' + t('sections.columnLabel') },
                            { value: '2', label: '2 ' + t('sections.columnLabel') },
                            { value: '3', label: '3 ' + t('sections.columnLabel') },
                            { value: '4', label: '4 ' + t('sections.columnLabel') },
                        ]}
                        allowDeselect={false}
                    />
                    <ActionIcon size="sm" color="red" variant="light" onClick={onRemove}>
                        <IconTrash size={14} />
                    </ActionIcon>
                </Group>
            </Group>

            <Grid gutter="sm">
                {section.columns.map((column, columnIndex) => (
                    <Grid.Col key={column.id} span={12 / columnCount}>
                        <ColumnEditor
                            column={column}
                            columnIndex={columnIndex}
                            onUpdate={(updatedColumn) => updateColumn(columnIndex, updatedColumn)}
                            t={t}
                        />
                    </Grid.Col>
                ))}
            </Grid>
        </Paper>
    );
}

// Main SectionEditor Component
export function SectionEditor({ sections, onChange, title, t }: SectionEditorProps) {
    const addSection = () => {
        onChange([...sections, createSection(1)]);
    };

    const updateSection = (index: number, section: TemplateSection) => {
        const newSections = [...sections];
        newSections[index] = section;
        onChange(newSections);
    };

    const removeSection = (index: number) => {
        onChange(sections.filter((_, i) => i !== index));
    };

    return (
        <Paper p="md" withBorder>
            <Group justify="space-between" mb="md">
                <Title order={4}>{title}</Title>
                <Button
                    size="xs"
                    leftSection={<IconPlus size={14} />}
                    onClick={addSection}
                    variant="light"
                >
                    {t('sections.addSection')}
                </Button>
            </Group>

            {sections.length === 0 ? (
                <Text size="sm" c="dimmed" ta="center" py="xl">
                    {t('sections.noSections')}
                </Text>
            ) : (
                sections.map((section, index) => (
                    <SingleSectionEditor
                        key={section.id}
                        section={section}
                        sectionIndex={index}
                        onUpdate={(updatedSection) => updateSection(index, updatedSection)}
                        onRemove={() => removeSection(index)}
                        t={t}
                    />
                ))
            )}
        </Paper>
    );
}
