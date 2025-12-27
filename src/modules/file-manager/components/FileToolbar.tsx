import { Group, ActionIcon, TextInput, Button, Menu, Stack, Paper, UnstyledButton, Text, Modal, Grid } from '@mantine/core';
import classes from '../FileManagerPage.module.css';
import {
    IconSearch,
    IconLayoutGrid,
    IconLayoutList,
    IconChevronDown,
    IconDownload,
    IconTrash,
} from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { ViewMode } from '../types/file';
import { useState, useEffect } from 'react';
import { DateInput } from '@mantine/dates';

interface FileToolbarProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onUploadClick: () => void;
    onNewFolderClick: () => void;
    selectedCount: number;
    onDeleteSelected: () => void;
    onDownloadSelected: () => void;
    sortBy?: string;
    onSortByChange?: (sortBy: string) => void;
    fileType?: string | null;
    onFileTypeChange?: (fileType: string | null) => void;
    startDate?: Date | null;
    endDate?: Date | null;
    onStartDateChange?: (date: Date | null) => void;
    onEndDateChange?: (date: Date | null) => void;
    tags?: string[];
    onTagsChange?: (tags: string[]) => void;
}

export function FileToolbar({
    viewMode,
    onViewModeChange,
    searchQuery,
    onSearchChange,
    onUploadClick,
    onNewFolderClick,
    selectedCount,
    onDeleteSelected,
    onDownloadSelected,
    sortBy = 'newest',
    onSortByChange,
    fileType: externalFileType,
    onFileTypeChange,
    startDate: externalStartDate,
    endDate: externalEndDate,
    onStartDateChange,
    onEndDateChange,
    tags: externalTags,
    onTagsChange,
}: FileToolbarProps) {
    const { t } = useTranslation('modules/file-manager');
    const [mounted, setMounted] = useState(false);
    const [, setFileType] = useState<string | null>(externalFileType || null);
    const [, setStartDate] = useState<Date | null>(externalStartDate || null);
    const [, setEndDate] = useState<Date | null>(externalEndDate || null);
    const [, setTags] = useState<string[]>(externalTags || []);
    const [sortByState, setSortByState] = useState<string>(sortBy);
    const [dateRangeModalOpened, setDateRangeModalOpened] = useState(false);
    const [tempStartDate, setTempStartDate] = useState<Date | null>(externalStartDate || null);
    const [tempEndDate, setTempEndDate] = useState<Date | null>(externalEndDate || null);

    const handleFileTypeChange = (value: string | null) => {
        setFileType(value);
        if (onFileTypeChange) {
            onFileTypeChange(value);
        }
    };


    const handleTagsChange = (value: string[]) => {
        setTags(value);
        if (onTagsChange) {
            onTagsChange(value);
        }
    };

    const handleSortByChange = (value: string) => {
        setSortByState(value);
        if (onSortByChange) {
            onSortByChange(value);
        }
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        setTempStartDate(externalStartDate || null);
        setTempEndDate(externalEndDate || null);
    }, [externalStartDate, externalEndDate]);

    const handleApplyDateRange = () => {
        if (onStartDateChange) {
            onStartDateChange(tempStartDate);
        }
        if (onEndDateChange) {
            onEndDateChange(tempEndDate);
        }
        setStartDate(tempStartDate);
        setEndDate(tempEndDate);
        setDateRangeModalOpened(false);
    };

    const handleClearDateRange = () => {
        setTempStartDate(null);
        setTempEndDate(null);
        if (onStartDateChange) {
            onStartDateChange(null);
        }
        if (onEndDateChange) {
            onEndDateChange(null);
        }
        setStartDate(null);
        setEndDate(null);
        setDateRangeModalOpened(false);
    };

    return (
        <Stack gap="md" mb="md">
            {/* Search Bar */}
            <TextInput
                placeholder={t('toolbar.searchPlaceholder')}
                leftSection={mounted ? <IconSearch size={20} /> : <span style={{ width: 20, height: 20, display: 'inline-block' }} />}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.currentTarget.value)}
                size="md"
                styles={{
                    input: {
                        height: '3rem',
                    },
                }}
            />

            {/* Filter Chips & Controls */}
            <Group gap="xs" wrap="wrap" style={{ rowGap: '0.5rem' }}>
                {/* File Type Filter */}
                <Menu position="bottom-start" withinPortal>
                    <Menu.Target>
                        <UnstyledButton component="button" {...(classes.filterChip ? { className: classes.filterChip } : {})}>
                            <Text size="sm" fw={500}>{t('toolbar.fileType')}</Text>
                            {mounted ? <IconChevronDown size={16} /> : <span style={{ width: 16, height: 16, display: 'inline-block' }} />}
                        </UnstyledButton>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Menu.Item onClick={() => handleFileTypeChange(null)}>
                            {t('toolbar.allTypes')}
                        </Menu.Item>
                        <Menu.Item onClick={() => handleFileTypeChange('image')}>
                            {t('toolbar.types.image')}
                        </Menu.Item>
                        <Menu.Item onClick={() => handleFileTypeChange('pdf')}>
                            {t('toolbar.types.pdf')}
                        </Menu.Item>
                        <Menu.Item onClick={() => handleFileTypeChange('document')}>
                            {t('toolbar.types.document')}
                        </Menu.Item>
                        <Menu.Item onClick={() => handleFileTypeChange('video')}>
                            {t('toolbar.types.video')}
                        </Menu.Item>
                        <Menu.Item onClick={() => handleFileTypeChange('archive')}>
                            {t('toolbar.types.archive')}
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>

                {/* Date Range Filter */}
                <>
                    <UnstyledButton
                        component="button"
                        {...(classes.filterChip ? { className: classes.filterChip } : {})}
                        onClick={() => setDateRangeModalOpened(true)}
                    >
                        <Text size="sm" fw={500}>{t('toolbar.dateRange')}</Text>
                        {mounted ? <IconChevronDown size={16} /> : <span style={{ width: 16, height: 16, display: 'inline-block' }} />}
                    </UnstyledButton>
                    <Modal
                        opened={dateRangeModalOpened}
                        onClose={() => setDateRangeModalOpened(false)}
                        title={t('toolbar.selectDateRange')}
                        centered
                        size="md"
                    >
                        <Stack gap="md">
                            <Grid gutter="md">
                                <Grid.Col span={{ base: 12, sm: 6 }}>
                                    <DateInput
                                        label={t('toolbar.startDate')}
                                        placeholder={t('toolbar.startDatePlaceholder')}
                                        value={tempStartDate}
                                        onChange={(value) => { setTempStartDate(value as Date | null); }}
                                        clearable
                                        popoverProps={{ withinPortal: true, zIndex: 1400 }}
                                    />
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, sm: 6 }}>
                                    <DateInput
                                        label={t('toolbar.endDate')}
                                        placeholder={t('toolbar.endDatePlaceholder')}
                                        value={tempEndDate}
                                        onChange={(value) => { setTempEndDate(value as Date | null); }}
                                        clearable
                                        popoverProps={{ withinPortal: true, zIndex: 1400 }}
                                    />
                                </Grid.Col>
                            </Grid>
                            <Group justify="flex-end" gap="sm" mt="xs">
                                <Button
                                    variant="default"
                                    onClick={handleClearDateRange}
                                >
                                    {t('toolbar.clear')}
                                </Button>
                                <Button
                                    onClick={handleApplyDateRange}
                                >
                                    {t('toolbar.apply')}
                                </Button>
                            </Group>
                        </Stack>
                    </Modal>
                </>

                {/* Tags Filter */}
                <Menu position="bottom-start" withinPortal>
                    <Menu.Target>
                        <UnstyledButton component="button" {...(classes.filterChip ? { className: classes.filterChip } : {})}>
                            <Text size="sm" fw={500}>{t('toolbar.tags')}</Text>
                            {mounted ? <IconChevronDown size={16} /> : <span style={{ width: 16, height: 16, display: 'inline-block' }} />}
                        </UnstyledButton>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Menu.Item onClick={() => handleTagsChange([])}>
                            {t('toolbar.allTags')}
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Label>{t('toolbar.selectTags')}</Menu.Label>
                        {/* Tags will be populated from files */}
                    </Menu.Dropdown>
                </Menu>

                {/* Spacer - hidden on mobile */}
                <div style={{ flex: 1, minWidth: 0 }} className="hide-on-mobile" />

                {/* Bulk Actions */}
                {selectedCount > 0 && (
                    <Group gap="xs">
                        <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={onDownloadSelected}
                            title={t('toolbar.downloadSelected')}
                        >
                            <IconDownload size={18} />
                        </ActionIcon>
                        <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={onDeleteSelected}
                            title={t('toolbar.deleteSelected')}
                        >
                            <IconTrash size={18} />
                        </ActionIcon>
                    </Group>
                )}

                {/* View Mode Toggle */}
                <Paper p={4} withBorder {...(classes.viewModeToggle ? { className: classes.viewModeToggle } : {})}>
                    <UnstyledButton
                        onClick={() => onViewModeChange('grid')}
                        {...((viewMode === 'grid' ? classes.viewModeButtonActive : classes.viewModeButtonInactive) ? { className: viewMode === 'grid' ? classes.viewModeButtonActive : classes.viewModeButtonInactive } : {})}
                    >
                        {mounted ? <IconLayoutGrid size={18} /> : <span style={{ width: 18, height: 18, display: 'inline-block' }} />}
                    </UnstyledButton>
                    <UnstyledButton
                        onClick={() => onViewModeChange('list')}
                        {...((viewMode === 'list' ? classes.viewModeButtonActive : classes.viewModeButtonInactive) ? { className: viewMode === 'list' ? classes.viewModeButtonActive : classes.viewModeButtonInactive } : {})}
                    >
                        {mounted ? <IconLayoutList size={18} /> : <span style={{ width: 18, height: 18, display: 'inline-block' }} />}
                    </UnstyledButton>
                </Paper>

                {/* Sort By */}
                <Menu position="bottom-end" withinPortal>
                    <Menu.Target>
                        <UnstyledButton component="button" {...(classes.filterChip ? { className: classes.filterChip } : {})}>
                            <Text size="sm" fw={500}>{t('toolbar.sortBy')}: {t(`toolbar.sortOptions.${sortByState}`)}</Text>
                            {mounted ? <IconChevronDown size={16} /> : <span style={{ width: 16, height: 16, display: 'inline-block' }} />}
                        </UnstyledButton>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Menu.Item onClick={() => handleSortByChange('newest')}>
                            {t('toolbar.sortOptions.newest')}
                        </Menu.Item>
                        <Menu.Item onClick={() => handleSortByChange('oldest')}>
                            {t('toolbar.sortOptions.oldest')}
                        </Menu.Item>
                        <Menu.Item onClick={() => handleSortByChange('nameAsc')}>
                            {t('toolbar.sortOptions.nameAsc')}
                        </Menu.Item>
                        <Menu.Item onClick={() => handleSortByChange('nameDesc')}>
                            {t('toolbar.sortOptions.nameDesc')}
                        </Menu.Item>
                        <Menu.Item onClick={() => handleSortByChange('sizeAsc')}>
                            {t('toolbar.sortOptions.sizeAsc')}
                        </Menu.Item>
                        <Menu.Item onClick={() => handleSortByChange('sizeDesc')}>
                            {t('toolbar.sortOptions.sizeDesc')}
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Group>
        </Stack>
    );
}
