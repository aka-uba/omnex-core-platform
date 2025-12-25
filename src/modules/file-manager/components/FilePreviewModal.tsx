import { Modal, Text, Stack, Group, Button, Paper, Code, ScrollArea, Loader, useMantineColorScheme } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { FileItem } from '../types/file';
import { useTranslation } from '@/lib/i18n/client';
import { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FilePreviewModalProps {
    opened: boolean;
    onClose: () => void;
    file: FileItem | null;
    onDownload?: (file: FileItem) => void;
}

export function FilePreviewModal({ opened, onClose, file, onDownload }: FilePreviewModalProps) {
    const { t } = useTranslation('modules/file-manager');
    const { colorScheme } = useMantineColorScheme();
    const [textContent, setTextContent] = useState<string>('');
    const [loadingText, setLoadingText] = useState(false);

    // Calculate file properties safely (must be after hooks)
    const fileName = useMemo(() => file?.name.toLowerCase() || '', [file?.name]);
    const fileExtension = useMemo(() => file?.extension?.toLowerCase() || '', [file?.extension]);
    const mimeType = useMemo(() => file?.mimeType || '', [file?.mimeType]);

    // Determine file type (memoized to avoid hooks order issues)
    const isText = useMemo(() => 
        mimeType.startsWith('text/') || /\.(txt|log|json|xml|yaml|yml|ini|conf)$/i.test(fileName),
        [mimeType, fileName]
    );
    const isMarkdown = useMemo(() => 
        /\.(md|markdown)$/i.test(fileName),
        [fileName]
    );

    // Load text content when file changes (must be after all hooks)
    useEffect(() => {
        if (opened && file && (isText || isMarkdown)) {
            setLoadingText(true);
            // Determine fetch URL based on path type
            let fetchUrl: string;
            if (file.path.startsWith('/storage/')) {
                // Use storage API for /storage/ paths
                fetchUrl = `/api${file.path}`;
            } else if (file.path.startsWith('http://') || file.path.startsWith('https://')) {
                // Use direct URL for http/https
                fetchUrl = file.path;
            } else {
                // Use file-manager API for other paths
                fetchUrl = `/api/file-manager/download?path=${encodeURIComponent(file.path)}`;
            }
            fetch(fetchUrl)
                .then(res => res.text())
                .then(text => {
                    setTextContent(text);
                    setLoadingText(false);
                })
                .catch(err => {
                    console.error('Error loading text file:', err);
                    setTextContent('Dosya yüklenirken hata oluştu.');
                    setLoadingText(false);
                });
        } else {
            setTextContent('');
        }
    }, [opened, file?.id, file?.path, isText, isMarkdown]);

    // Early return after all hooks
    if (!file) return null;

    // Determine other file types (after early return check)
    const isImage = mimeType.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|svg|bmp|ico)$/i.test(fileName);
    const isPdf = mimeType === 'application/pdf' || fileExtension === 'pdf' || fileName.endsWith('.pdf');
    const isVideo = mimeType.startsWith('video/') || /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i.test(fileName);
    const isAudio = mimeType.startsWith('audio/') || /\.(mp3|wav|ogg|aac|flac|m4a|wma)$/i.test(fileName);
    const isWord = /\.(doc|docx)$/i.test(fileName) || mimeType.includes('word') || mimeType.includes('msword');
    const isExcel = /\.(xls|xlsx)$/i.test(fileName) || mimeType.includes('excel') || mimeType.includes('spreadsheet');

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '-';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    // Get preview URL
    const getPreviewUrl = () => {
        if (!file) return '';
        // If path starts with /storage/, use storage API
        if (file.path.startsWith('/storage/')) {
            // Convert /storage/tenants/... to /api/storage/tenants/...
            return `/api${file.path}`;
        }
        // If path is already a full URL (http/https), use it directly
        if (file.path.startsWith('http://') || file.path.startsWith('https://')) {
            return file.path;
        }
        // Otherwise use file-manager download API
        const baseUrl = `/api/file-manager/download?path=${encodeURIComponent(file.path)}&inline=true`;
        return baseUrl;
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={file.name}
            size="xl"
            centered
            styles={{
                content: {
                    maxHeight: '90vh',
                },
                body: {
                    padding: 0,
                },
            }}
        >
            <Stack gap={0} style={{ maxHeight: '80vh' }}>
                {/* Preview Content */}
                <div style={{ 
                    minHeight: '400px', 
                    maxHeight: '70vh', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: '20px',
                    overflow: 'auto',
                }}>
                    {isImage ? (
                        <img 
                            src={getPreviewUrl()}
                            alt={file.name}
                            style={{ 
                                maxWidth: '100%', 
                                maxHeight: '70vh', 
                                objectFit: 'contain',
                                borderRadius: '8px',
                            }}
                            onError={(e) => {
                                console.error('Image load error:', e);
                                (e.target as HTMLImageElement).src = '/placeholder-image.png';
                            }}
                        />
                    ) : isPdf ? (
                        <iframe
                            src={getPreviewUrl() + '#toolbar=1'}
                            style={{
                                width: '100%',
                                height: '70vh',
                                border: 'none',
                                borderRadius: '8px',
                            }}
                            title={file.name}
                        />
                    ) : isVideo ? (
                        <video
                            src={getPreviewUrl()}
                            controls
                            style={{
                                maxWidth: '100%',
                                maxHeight: '70vh',
                                borderRadius: '8px',
                                backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5',
                            }}
                            onError={(e) => {
                                console.error('Video load error:', e);
                            }}
                        >
                            Tarayıcınız video oynatmayı desteklemiyor.
                        </video>
                    ) : isAudio ? (
                        <div style={{ 
                            width: '100%', 
                            maxWidth: '600px', 
                            padding: '24px',
                            borderRadius: '8px',
                            backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)',
                        }}>
                            <audio
                                src={getPreviewUrl()}
                                controls
                                style={{ width: '100%' }}
                                onError={(e) => {
                                    console.error('Audio load error:', e);
                                }}
                            >
                                Tarayıcınız ses oynatmayı desteklemiyor.
                            </audio>
                        </div>
                    ) : isText || isMarkdown ? (
                        <ScrollArea h="70vh" style={{ width: '100%' }}>
                            <Paper p="md" withBorder style={{ 
                                backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)',
                            }}>
                                {loadingText ? (
                                    <Stack align="center" gap="md">
                                        <Loader size="md" />
                                        <Text size="sm" c="dimmed">Yükleniyor...</Text>
                                    </Stack>
                                ) : isMarkdown ? (
                                    <div style={{ 
                                        color: colorScheme === 'dark' ? 'var(--mantine-color-gray-0)' : 'var(--mantine-color-dark-9)',
                                    }}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {textContent}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <Code block style={{ 
                                        whiteSpace: 'pre-wrap',
                                        fontFamily: 'monospace',
                                        fontSize: '14px',
                                        backgroundColor: 'transparent',
                                        color: colorScheme === 'dark' ? 'var(--mantine-color-gray-0)' : 'var(--mantine-color-dark-9)',
                                    }}>
                                        {textContent}
                                    </Code>
                                )}
                            </Paper>
                        </ScrollArea>
                    ) : isWord || isExcel ? (
                        <Paper p="xl" withBorder style={{ 
                            width: '100%',
                            textAlign: 'center',
                            backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)',
                        }}>
                            <Stack gap="md" align="center">
                                <Text size="64px" style={{ lineHeight: 1 }}>
                                    {isWord ? '📝' : '📊'}
                                </Text>
                                <Text size="lg" fw={500}>
                                    {isWord ? 'Word Belgesi' : 'Excel Dosyası'}
                                </Text>
                                <Text size="sm" c="dimmed" style={{ maxWidth: '400px' }}>
                                    Bu dosya türü tarayıcıda önizlenemez. Dosyayı indirip uygun uygulamada açabilirsiniz.
                                </Text>
                                {onDownload && (
                                    <Button
                                        leftSection={<IconDownload size={16} />}
                                        onClick={() => onDownload(file)}
                                        mt="md"
                                    >
                                        {t('actions.download')}
                                    </Button>
                                )}
                            </Stack>
                        </Paper>
                    ) : (
                        <Paper p="xl" withBorder style={{ 
                            width: '100%',
                            textAlign: 'center',
                            backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)',
                        }}>
                            <Stack gap="sm" align="center">
                                <Text size="48px" style={{ lineHeight: 1 }}>📎</Text>
                                <Text size="sm" c="dimmed" ta="center">
                                    {t('preview.noPreview')}
                                </Text>
                                <Text size="xs" c="dimmed">
                                    {formatFileSize(file.size)}
                                </Text>
                            </Stack>
                        </Paper>
                    )}
                </div>

                {/* Footer */}
                <Paper p="md" withBorder style={{ 
                    borderTop: `1px solid ${colorScheme === 'dark' ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-3)'}`,
                }}>
                    <Group justify="space-between">
                        <Stack gap={4}>
                            <Text size="sm" fw={500}>
                                {file.name}
                            </Text>
                            <Text size="xs" c="dimmed">
                                {formatFileSize(file.size)} • {file.mimeType || '-'}
                            </Text>
                        </Stack>
                        {onDownload && (
                            <Button
                                leftSection={<IconDownload size={16} />}
                                onClick={() => onDownload(file)}
                            >
                                {t('actions.download')}
                            </Button>
                        )}
                    </Group>
                </Paper>
            </Stack>
        </Modal>
    );
}




