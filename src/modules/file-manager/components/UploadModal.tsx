import { useState, useCallback } from 'react';
import { Modal, Text, Group, Button, Stack, Progress, Paper, ActionIcon, useMantineColorScheme, TextInput, Select, Textarea, Radio, Divider, Badge, Grid, Input } from '@mantine/core';
import { Dropzone, FileWithPath } from '@mantine/dropzone';
import { IconUpload, IconX, IconFile, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { FileUploadItem } from '../types/file';
import { useUploadFile } from '../hooks/useFiles';
import { showToast } from '@/modules/notifications/components/ToastNotification';

interface UploadModalProps {
    opened: boolean;
    onClose: () => void;
    currentFolderId: string | null;
}

export function UploadModal({ opened, onClose, currentFolderId }: UploadModalProps) {
    const { t } = useTranslation('modules/file-manager');
    const { t: tGlobal } = useTranslation('global');
    const { colorScheme } = useMantineColorScheme();
    const [uploadQueue, setUploadQueue] = useState<FileUploadItem[]>([]);
    const [fileName, setFileName] = useState('');
    const [category, setCategory] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [accessLevel, setAccessLevel] = useState('private');
    const [project, setProject] = useState<string | null>(null);
    const uploadFile = useUploadFile();

    const handleDrop = useCallback((files: FileWithPath[]) => {
        const newItems: FileUploadItem[] = files.map((file) => ({
            id: `${Date.now()}-${Math.random()}`,
            file,
            name: fileName || file.name,
            size: file.size,
            progress: 0,
            status: 'pending' as const,
        }));
        setUploadQueue((prev) => [...prev, ...newItems]);
        // Set file name from first file if not already set
        if (!fileName && files.length > 0) {
            const firstFile = files[0];
            if (firstFile) {
                setFileName(firstFile.name.replace(/\.[^/.]+$/, ''));
            }
        }
    }, [fileName]);

    const handleUpload = async () => {
        const pendingItems = uploadQueue.filter((i) => i.status === 'pending');
        
        for (const item of pendingItems) {
            setUploadQueue((prev) =>
                prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading' as const } : i))
            );

            try {
                await uploadFile.mutateAsync({ file: item.file, folderId: currentFolderId });

                setUploadQueue((prev) => {
                    const updated = prev.map((i) => (i.id === item.id ? { ...i, status: 'completed' as const, progress: 100 } : i));
                    // Check if all items are completed or error
                    const allCompleted = updated.every((i) => i.status === 'completed' || i.status === 'error');
                    if (allCompleted) {
                        setTimeout(() => {
                            showToast({
                                type: 'success',
                                title: t('upload.success'),
                                message: t('upload.filesUploaded'),
                            });
                            handleClose();
                        }, 500);
                    }
                    return updated;
                });
            } catch (error) {
                setUploadQueue((prev) =>
                    prev.map((i) =>
                        i.id === item.id
                            ? { ...i, status: 'error' as const, error: error instanceof Error ? error.message : 'Upload failed' }
                            : i
                    )
                );
            }
        }
    };

    const handleRemove = (id: string) => {
        setUploadQueue((prev) => prev.filter((i) => i.id !== id));
    };

    const handleClose = () => {
        setUploadQueue([]);
        setFileName('');
        setCategory(null);
        setDescription('');
        setTags([]);
        setTagInput('');
        setAccessLevel('private');
        setProject(null);
        onClose();
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <Modal opened={opened} onClose={handleClose} title={t('upload.title')} size="xl" centered>
            <Stack gap="xl">
                {/* Dropzone Section */}
                <Stack gap="md">
                    <Dropzone
                        onDrop={handleDrop}
                        maxSize={50 * 1024 * 1024} // 50MB
                        accept={['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.*', 'text/*', 'video/*']}
                        styles={(theme) => ({
                            root: {
                                backgroundColor: colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
                                borderColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[3],
                                borderStyle: 'dashed',
                                borderWidth: 2,
                                padding: '2.5rem',
                            },
                        })}
                    >
                        <Stack align="center" gap="md" style={{ pointerEvents: 'none' }}>
                            <Dropzone.Accept>
                                <IconUpload size={48} stroke={1.5} />
                            </Dropzone.Accept>
                            <Dropzone.Reject>
                                <IconX size={48} stroke={1.5} />
                            </Dropzone.Reject>
                            <Dropzone.Idle>
                                <IconUpload size={48} stroke={1.5} />
                            </Dropzone.Idle>

                            <Stack align="center" gap={4}>
                                <Text size="lg" fw={600}>
                                    {t('upload.dragDrop')}
                                </Text>
                                <Text size="sm" c="dimmed">
                                    {t('upload.clickToSelect')}
                                </Text>
                            </Stack>
                            <Button variant="light" size="sm" style={{ pointerEvents: 'auto' }}>
                                {t('upload.browseFiles')}
                            </Button>
                        </Stack>
                    </Dropzone>
                </Stack>

                {/* File Details Section */}
                <Stack gap="md">
                    <Divider label={<Text size="lg" fw={700}>{t('upload.fileDetails')}</Text>} labelPosition="left" />
                    <Text size="sm" c="dimmed" ta="center">
                        {t('upload.fileDetailsDesc')}
                    </Text>

                    <Grid gutter="md">
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                            <TextInput
                                label={t('upload.fileName')}
                                placeholder={t('upload.fileNamePlaceholder')}
                                value={fileName}
                                onChange={(e) => setFileName(e.currentTarget.value)}
                                size="md"
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                            <Select
                                label={t('upload.category')}
                                placeholder={t('upload.categoryPlaceholder')}
                                data={[
                                    { value: 'design', label: t('upload.categories.design') },
                                    { value: 'contract', label: t('upload.categories.contract') },
                                    { value: 'invoice', label: t('upload.categories.invoice') },
                                    { value: 'report', label: t('upload.categories.report') },
                                ]}
                                value={category}
                                onChange={setCategory}
                                size="md"
                            />
                        </Grid.Col>
                    </Grid>

                    <Textarea
                        label={t('upload.description')}
                        placeholder={t('upload.descriptionPlaceholder')}
                        value={description}
                        onChange={(e) => setDescription(e.currentTarget.value)}
                        minRows={4}
                        size="md"
                    />

                    <Input.Wrapper label={t('upload.tags')}>
                        <Paper p="xs" withBorder mt="xs">
                            <Group gap="xs" wrap="wrap">
                                {tags.map((tag) => (
                                    <Badge
                                        key={tag}
                                        variant="light"
                                        rightSection={
                                            <ActionIcon
                                                size="xs"
                                                color="blue"
                                                radius="xl"
                                                variant="transparent"
                                                onClick={() => handleRemoveTag(tag)}
                                            >
                                                <IconX size={12} />
                                            </ActionIcon>
                                        }
                                    >
                                        {tag}
                                    </Badge>
                                ))}
                                <TextInput
                                    placeholder={t('upload.tagPlaceholder')}
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.currentTarget.value)}
                                    onKeyDown={handleTagInputKeyDown}
                                    style={{ flex: 1, minWidth: 120 }}
                                    styles={{
                                        input: {
                                            border: 'none',
                                            backgroundColor: 'transparent',
                                        },
                                    }}
                                />
                            </Group>
                        </Paper>
                    </Input.Wrapper>
                </Stack>

                {/* Access & Association Section */}
                <Stack gap="md">
                    <Divider label={<Text size="lg" fw={700}>{t('upload.accessAssociation')}</Text>} labelPosition="left" />
                    <Text size="sm" c="dimmed" ta="center">
                        {t('upload.accessAssociationDesc')}
                    </Text>

                    <Grid gutter="md">
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Input.Wrapper label={t('upload.accessLevel')}>
                                <Radio.Group value={accessLevel} onChange={setAccessLevel} mt="xs">
                                    <Group>
                                        <Radio value="private" label={t('upload.private')} />
                                        <Radio value="public" label={t('upload.public')} />
                                    </Group>
                                </Radio.Group>
                            </Input.Wrapper>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Select
                                label={t('upload.associateProject')}
                                placeholder={t('upload.associateProjectPlaceholder')}
                                data={[
                                    { value: 'phoenix', label: 'Project Phoenix' },
                                    { value: 'titan', label: 'Project Titan' },
                                    { value: 'marketing', label: 'Marketing Campaign Q4' },
                                ]}
                                value={project}
                                onChange={setProject}
                                size="md"
                            />
                        </Grid.Col>
                    </Grid>
                </Stack>

                {/* Upload Queue */}
                {uploadQueue.length > 0 && (
                    <Stack gap="xs">
                        <Text size="sm" fw={500}>
                            {t('upload.files')} ({uploadQueue.length})
                        </Text>
                        {uploadQueue.map((item) => (
                            <Paper key={item.id} p="xs" withBorder>
                                <Group justify="space-between" wrap="nowrap">
                                    <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                                        <IconFile size={20} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <Text size="sm" truncate>
                                                {item.name}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                {formatFileSize(item.size)}
                                            </Text>
                                        </div>
                                    </Group>
                                    <Group gap="xs">
                                        {item.status === 'completed' && <IconCheck size={20} color="green" />}
                                        {item.status === 'error' && <IconAlertCircle size={20} color="red" />}
                                        {item.status === 'pending' && (
                                            <ActionIcon variant="subtle" color="gray" onClick={() => handleRemove(item.id)}>
                                                <IconX size={16} />
                                            </ActionIcon>
                                        )}
                                    </Group>
                                </Group>
                                {item.status === 'uploading' && <Progress value={item.progress} size="xs" mt="xs" />}
                                {item.status === 'error' && (
                                    <Text size="xs" c="red" mt="xs">
                                        {item.error}
                                    </Text>
                                )}
                            </Paper>
                        ))}
                    </Stack>
                )}

                {/* Action Buttons */}
                <Divider />
                <Group justify="flex-end" gap="md">
                    <Button variant="default" onClick={handleClose}>
                        {tGlobal('form.cancel')}
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={uploadQueue.length === 0 || uploadQueue.every((i) => i.status !== 'pending')}
                        loading={uploadFile.isPending}
                    >
                        {t('upload.button')}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
