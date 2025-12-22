'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Paper,
  Text,
  Stack,
  Group,
  SimpleGrid,
  Card,
  Button,
  ActionIcon,
  Modal,
  Loader,
  Badge,
  Code,
  ScrollArea,
  useMantineColorScheme,
} from '@mantine/core';
import {
  IconFile,
  IconFileTypePdf,
  IconFileTypeDoc,
  IconFileTypeXls,
  IconFileText,
  IconDownload,
  IconChevronLeft,
  IconChevronRight,
  IconX,
  IconEye,
} from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FileInfo {
  id: string;
  filename?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  extension?: string;
}

interface EntityFilesTabProps {
  documents: string[];
  entityName?: string;
  onDownloadAll?: () => void;
  downloadAllLoading?: boolean;
}

const CARD_HEIGHT = 140;

export function EntityFilesTab({
  documents,
  entityName,
  onDownloadAll,
  downloadAllLoading = false,
}: EntityFilesTabProps) {
  const { t } = useTranslation('modules/real-estate');
  const { colorScheme } = useMantineColorScheme();

  const [previewOpened, setPreviewOpened] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fileInfoMap, setFileInfoMap] = useState<Record<string, FileInfo>>({});
  const [loadingInfo, setLoadingInfo] = useState<Record<string, boolean>>({});
  const [textContent, setTextContent] = useState<string>('');
  const [loadingText, setLoadingText] = useState(false);

  const safeDocs = Array.isArray(documents) ? documents : [];

  // Fetch file info for a document
  const fetchFileInfo = useCallback(async (docId: string) => {
    if (fileInfoMap[docId] || loadingInfo[docId]) return;

    setLoadingInfo((prev) => ({ ...prev, [docId]: true }));
    try {
      const res = await fetch(`/api/core-files/${docId}`);
      if (res.ok) {
        const data = await res.json();
        const fileData = data?.data?.file || data?.file || data;
        if (fileData) {
          setFileInfoMap((prev) => ({ ...prev, [docId]: { id: docId, ...fileData } }));
        }
      }
    } catch (err) {
      console.error('Error fetching file info:', err);
    } finally {
      setLoadingInfo((prev) => ({ ...prev, [docId]: false }));
    }
  }, [fileInfoMap, loadingInfo]);

  // Fetch info for all documents on mount
  useEffect(() => {
    safeDocs.forEach((docId) => {
      if (!fileInfoMap[docId] && !loadingInfo[docId]) {
        fetchFileInfo(docId);
      }
    });
  }, [safeDocs, fetchFileInfo, fileInfoMap, loadingInfo]);

  const openPreview = useCallback((index: number) => {
    setCurrentIndex(index);
    setPreviewOpened(true);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewOpened(false);
    setTextContent('');
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : safeDocs.length - 1));
  }, [safeDocs.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < safeDocs.length - 1 ? prev + 1 : 0));
  }, [safeDocs.length]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    } else if (e.key === 'Escape') {
      closePreview();
    }
  }, [goToPrevious, goToNext, closePreview]);

  const handleDownload = useCallback((docId: string) => {
    const fileInfo = fileInfoMap[docId];
    const link = document.createElement('a');
    link.href = `/api/core-files/${docId}/download`;
    link.download = fileInfo?.originalName || fileInfo?.filename || `file-${docId}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [fileInfoMap]);

  const getDocumentIcon = (fileInfo?: FileInfo) => {
    const ext = fileInfo?.extension?.toLowerCase() || '';
    const mime = fileInfo?.mimeType || '';

    if (ext === 'pdf' || mime === 'application/pdf') {
      return <IconFileTypePdf size={40} color="var(--mantine-color-red-6)" />;
    }
    if (['doc', 'docx'].includes(ext) || mime.includes('word')) {
      return <IconFileTypeDoc size={40} color="var(--mantine-color-blue-6)" />;
    }
    if (['xls', 'xlsx'].includes(ext) || mime.includes('excel') || mime.includes('spreadsheet')) {
      return <IconFileTypeXls size={40} color="var(--mantine-color-green-6)" />;
    }
    if (['txt', 'log', 'md', 'json', 'xml', 'yaml', 'yml'].includes(ext) || mime.startsWith('text/')) {
      return <IconFileText size={40} color="var(--mantine-color-gray-6)" />;
    }
    return <IconFile size={40} color="var(--mantine-color-gray-6)" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const currentDocId = safeDocs[currentIndex];
  const currentFileInfo = currentDocId ? fileInfoMap[currentDocId] : null;

  // Determine file type for preview
  const getFileType = (fileInfo?: FileInfo | null) => {
    if (!fileInfo) return 'unknown';
    const ext = fileInfo.extension?.toLowerCase() || '';
    const mime = fileInfo.mimeType || '';
    const name = (fileInfo.originalName || fileInfo.filename || '').toLowerCase();

    if (mime.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|svg|bmp|ico)$/i.test(name)) return 'image';
    if (ext === 'pdf' || mime === 'application/pdf') return 'pdf';
    if (mime.startsWith('video/') || /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i.test(name)) return 'video';
    if (mime.startsWith('audio/') || /\.(mp3|wav|ogg|aac|flac|m4a|wma)$/i.test(name)) return 'audio';
    if (/\.(md|markdown)$/i.test(name)) return 'markdown';
    if (mime.startsWith('text/') || /\.(txt|log|json|xml|yaml|yml|ini|conf)$/i.test(name)) return 'text';
    if (['doc', 'docx'].includes(ext) || mime.includes('word')) return 'word';
    if (['xls', 'xlsx'].includes(ext) || mime.includes('excel')) return 'excel';
    return 'unknown';
  };

  // Load text content for preview
  useEffect(() => {
    if (previewOpened && currentDocId && currentFileInfo) {
      const fileType = getFileType(currentFileInfo);
      if (fileType === 'text' || fileType === 'markdown') {
        setLoadingText(true);
        fetch(`/api/core-files/${currentDocId}/download?inline=true`)
          .then((res) => res.text())
          .then((text) => {
            setTextContent(text);
            setLoadingText(false);
          })
          .catch((err) => {
            console.error('Error loading text file:', err);
            setTextContent('Error loading file');
            setLoadingText(false);
          });
      } else {
        setTextContent('');
      }
    }
  }, [previewOpened, currentDocId, currentFileInfo]);

  if (safeDocs.length === 0) {
    return (
      <Paper shadow="xs" p="md">
        <Stack align="center" gap="md" py="xl">
          <IconFile size={48} color="gray" />
          <Text c="dimmed" ta="center">
            {t('mediaGallery.noDocuments') || 'No documents available'}
          </Text>
        </Stack>
      </Paper>
    );
  }

  const fileType = getFileType(currentFileInfo);
  const downloadUrl = currentDocId ? `/api/core-files/${currentDocId}/download?inline=true` : '';

  return (
    <Paper shadow="xs" p="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="lg" fw={600}>
            {t('mediaGallery.documents') || 'Documents'} ({safeDocs.length})
          </Text>
          {onDownloadAll && safeDocs.length > 0 && (
            <Button
              variant="light"
              leftSection={<IconDownload size={16} />}
              onClick={onDownloadAll}
              loading={downloadAllLoading}
            >
              {t('mediaGallery.downloadAll') || 'Download All (ZIP)'}
            </Button>
          )}
        </Group>

        <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
          {safeDocs.map((docId, index) => {
            const fileInfo = fileInfoMap[docId];
            const isLoading = loadingInfo[docId];

            return (
              <Card
                key={docId}
                padding="md"
                radius="md"
                withBorder
                h={CARD_HEIGHT}
                style={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
                onClick={() => openPreview(index)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Stack align="center" gap="xs" style={{ flex: 1, justifyContent: 'center' }}>
                  {isLoading ? (
                    <Loader size="sm" />
                  ) : (
                    getDocumentIcon(fileInfo)
                  )}
                  <Text size="xs" ta="center" lineClamp={2} fw={500}>
                    {fileInfo?.originalName || fileInfo?.filename || docId.slice(0, 12) + '...'}
                  </Text>
                  {fileInfo?.size && (
                    <Badge size="xs" variant="light" color="gray">
                      {formatFileSize(fileInfo.size)}
                    </Badge>
                  )}
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      </Stack>

      {/* File Preview Modal */}
      <Modal
        opened={previewOpened}
        onClose={closePreview}
        title={currentFileInfo?.originalName || currentFileInfo?.filename || t('mediaGallery.preview')}
        size="xl"
        centered
        styles={{
          content: { maxHeight: '90vh' },
          body: { padding: 0 },
        }}
        onKeyDown={handleKeyDown}
      >
        <Stack gap={0} style={{ maxHeight: '80vh' }}>
          {/* Navigation Buttons */}
          {safeDocs.length > 1 && (
            <Group justify="space-between" px="md" py="xs" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
              <ActionIcon variant="light" onClick={goToPrevious}>
                <IconChevronLeft size={20} />
              </ActionIcon>
              <Text size="sm" c="dimmed">
                {currentIndex + 1} / {safeDocs.length}
              </Text>
              <ActionIcon variant="light" onClick={goToNext}>
                <IconChevronRight size={20} />
              </ActionIcon>
            </Group>
          )}

          {/* Preview Content */}
          <div
            style={{
              minHeight: '400px',
              maxHeight: '60vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              overflow: 'auto',
            }}
          >
            {fileType === 'image' ? (
              <img
                src={downloadUrl}
                alt={currentFileInfo?.originalName || 'Preview'}
                style={{
                  maxWidth: '100%',
                  maxHeight: '60vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                }}
              />
            ) : fileType === 'pdf' ? (
              <iframe
                src={downloadUrl + '#toolbar=1'}
                style={{
                  width: '100%',
                  height: '60vh',
                  border: 'none',
                  borderRadius: '8px',
                }}
                title={currentFileInfo?.originalName || 'PDF Preview'}
              />
            ) : fileType === 'video' ? (
              <video
                src={downloadUrl}
                controls
                style={{
                  maxWidth: '100%',
                  maxHeight: '60vh',
                  borderRadius: '8px',
                }}
              >
                Video not supported
              </video>
            ) : fileType === 'audio' ? (
              <Paper p="xl" withBorder style={{ width: '100%', maxWidth: '500px' }}>
                <audio src={downloadUrl} controls style={{ width: '100%' }}>
                  Audio not supported
                </audio>
              </Paper>
            ) : fileType === 'text' || fileType === 'markdown' ? (
              <ScrollArea h="60vh" style={{ width: '100%' }}>
                <Paper
                  p="md"
                  withBorder
                  style={{
                    backgroundColor:
                      colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)',
                  }}
                >
                  {loadingText ? (
                    <Stack align="center" gap="md">
                      <Loader size="md" />
                      <Text size="sm" c="dimmed">Loading...</Text>
                    </Stack>
                  ) : fileType === 'markdown' ? (
                    <div>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{textContent}</ReactMarkdown>
                    </div>
                  ) : (
                    <Code
                      block
                      style={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        backgroundColor: 'transparent',
                      }}
                    >
                      {textContent}
                    </Code>
                  )}
                </Paper>
              </ScrollArea>
            ) : (
              <Paper p="xl" withBorder style={{ width: '100%', textAlign: 'center' }}>
                <Stack gap="md" align="center">
                  {getDocumentIcon(currentFileInfo)}
                  <Text size="lg" fw={500}>
                    {currentFileInfo?.originalName || currentFileInfo?.filename}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {t('mediaGallery.previewNotAvailable') || 'Preview not available for this file type'}
                  </Text>
                  {currentFileInfo?.size && (
                    <Badge size="sm" variant="light">
                      {formatFileSize(currentFileInfo.size)}
                    </Badge>
                  )}
                </Stack>
              </Paper>
            )}
          </div>

          {/* Footer */}
          <Paper
            p="md"
            withBorder
            style={{
              borderTop: `1px solid ${colorScheme === 'dark' ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-3)'}`,
            }}
          >
            <Group justify="space-between">
              <Stack gap={4}>
                <Text size="sm" fw={500}>
                  {currentFileInfo?.originalName || currentFileInfo?.filename || '-'}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatFileSize(currentFileInfo?.size)} {currentFileInfo?.mimeType && `• ${currentFileInfo.mimeType}`}
                </Text>
              </Stack>
              <Button
                leftSection={<IconDownload size={16} />}
                onClick={() => currentDocId && handleDownload(currentDocId)}
              >
                {t('mediaGallery.download') || 'Download'}
              </Button>
            </Group>
          </Paper>
        </Stack>
      </Modal>
    </Paper>
  );
}
