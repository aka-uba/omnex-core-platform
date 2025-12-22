'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Stack,
  Group,
  Button,
  Text,
  SimpleGrid,
  Card,
  Image,
  ActionIcon,
  Badge,
  Box,
  FileButton,
  Tooltip,
  Tabs,
  Modal,
  Paper,
  Code,
  ScrollArea,
  Loader,
  useMantineColorScheme,
} from '@mantine/core';
import {
  IconUpload,
  IconX,
  IconStar,
  IconStarFilled,
  IconPhoto,
  IconFile,
  IconFileTypePdf,
  IconFileTypeDoc,
  IconFileTypeXls,
  IconEye,
  IconDownload,
} from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { useCoreFileManager } from '@/hooks/useCoreFileManager';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import { useDisclosure } from '@mantine/hooks';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CoreFileInfo {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  extension: string;
}

interface MediaGalleryProps {
  tenantId: string;
  entityId?: string;
  entityType: 'property' | 'apartment' | 'tenant';
  images: string[];
  documents?: string[];
  coverImage?: string;
  onImagesChange: (images: string[]) => void;
  onDocumentsChange?: (documents: string[]) => void;
  onCoverImageChange: (coverImage: string | undefined) => void;
  userId: string;
}

interface FilePreviewModalProps {
  opened: boolean;
  onClose: () => void;
  fileId: string | null;
  fileInfo?: CoreFileInfo | null;
}

function FilePreviewModal({ opened, onClose, fileId, fileInfo }: FilePreviewModalProps) {
  const { t } = useTranslation('modules/real-estate');
  const { colorScheme } = useMantineColorScheme();
  const [localFileInfo, setLocalFileInfo] = useState<CoreFileInfo | null>(null);
  const [textContent, setTextContent] = useState<string>('');
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [loadingText, setLoadingText] = useState(false);

  // Effective file info
  const effectiveFileInfo = localFileInfo || fileInfo;

  // Calculate file properties safely (must be after hooks)
  const fileName = useMemo(() => effectiveFileInfo?.originalName?.toLowerCase() || effectiveFileInfo?.filename?.toLowerCase() || '', [effectiveFileInfo]);
  const fileExtension = useMemo(() => effectiveFileInfo?.extension?.toLowerCase() || '', [effectiveFileInfo]);
  const mimeType = useMemo(() => effectiveFileInfo?.mimeType || '', [effectiveFileInfo]);

  // Determine file type (memoized to avoid hooks order issues)
  const isText = useMemo(() =>
    mimeType.startsWith('text/') || /\.(txt|log|json|xml|yaml|yml|ini|conf)$/i.test(fileName),
    [mimeType, fileName]
  );
  const isMarkdown = useMemo(() =>
    /\.(md|markdown)$/i.test(fileName),
    [fileName]
  );
  const isImage = useMemo(() =>
    mimeType.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|svg|bmp|ico)$/i.test(fileName),
    [mimeType, fileName]
  );
  const isPdf = useMemo(() =>
    mimeType === 'application/pdf' || fileExtension === 'pdf' || fileName.endsWith('.pdf'),
    [mimeType, fileExtension, fileName]
  );
  const isVideo = useMemo(() =>
    mimeType.startsWith('video/') || /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i.test(fileName),
    [mimeType, fileName]
  );
  const isAudio = useMemo(() =>
    mimeType.startsWith('audio/') || /\.(mp3|wav|ogg|aac|flac|m4a|wma)$/i.test(fileName),
    [mimeType, fileName]
  );
  const isWord = useMemo(() =>
    /\.(doc|docx)$/i.test(fileName) || mimeType.includes('word') || mimeType.includes('msword'),
    [mimeType, fileName]
  );
  const isExcel = useMemo(() =>
    /\.(xls|xlsx)$/i.test(fileName) || mimeType.includes('excel') || mimeType.includes('spreadsheet'),
    [mimeType, fileName]
  );

  // Fetch file info when modal opens
  useEffect(() => {
    if (opened && fileId && !fileInfo) {
      setLoadingInfo(true);
      fetch(`/api/core-files/${fileId}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          const fileData = data?.data?.file || data?.file;
          if (fileData) {
            setLocalFileInfo(fileData);
          }
        })
        .catch(err => console.error('Error fetching file info:', err))
        .finally(() => setLoadingInfo(false));
    } else if (fileInfo) {
      setLocalFileInfo(fileInfo);
    }
  }, [opened, fileId, fileInfo]);

  // Load text content when file changes
  useEffect(() => {
    if (opened && fileId && effectiveFileInfo && (isText || isMarkdown)) {
      setLoadingText(true);
      fetch(`/api/core-files/${fileId}/download?inline=true`)
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
  }, [opened, fileId, effectiveFileInfo?.id, isText, isMarkdown]);

  // Reset state when modal closes
  useEffect(() => {
    if (!opened) {
      setLocalFileInfo(null);
      setTextContent('');
    }
  }, [opened]);

  if (!fileId) return null;

  const downloadUrl = `/api/core-files/${fileId}/download?inline=true`;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `/api/core-files/${fileId}/download`;
    link.download = effectiveFileInfo?.originalName || 'file';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={effectiveFileInfo?.originalName || t('mediaGallery.preview') || 'Preview'}
      size="xl"
      centered
      styles={{
        content: { maxHeight: '90vh' },
        body: { padding: 0 },
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
          {loadingInfo ? (
            <Stack align="center" gap="md">
              <Loader size="md" />
              <Text size="sm" c="dimmed">{t('mediaGallery.loading') || 'Loading...'}</Text>
            </Stack>
          ) : isImage ? (
            <img
              src={downloadUrl}
              alt={effectiveFileInfo?.originalName || 'Preview'}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
              onError={(e) => {
                console.error('Image load error');
                (e.target as HTMLImageElement).src = '/placeholder-image.png';
              }}
            />
          ) : isPdf ? (
            <iframe
              src={downloadUrl + '#toolbar=1'}
              style={{
                width: '100%',
                height: '70vh',
                border: 'none',
                borderRadius: '8px',
              }}
              title={effectiveFileInfo?.originalName || 'PDF Preview'}
            />
          ) : isVideo ? (
            <video
              src={downloadUrl}
              controls
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                borderRadius: '8px',
                backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5',
              }}
            >
              {t('mediaGallery.videoNotSupported') || 'Your browser does not support the video tag.'}
            </video>
          ) : isAudio ? (
            <div style={{
              width: '100%',
              maxWidth: '600px',
              padding: '24px',
              borderRadius: '8px',
              backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)',
            }}>
              <audio src={downloadUrl} controls style={{ width: '100%' }}>
                {t('mediaGallery.audioNotSupported') || 'Your browser does not support the audio tag.'}
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
                    <Text size="sm" c="dimmed">{t('mediaGallery.loading') || 'Loading...'}</Text>
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
                  {t('mediaGallery.previewNotAvailable') || 'Bu dosya türü tarayıcıda önizlenemez. Dosyayı indirip uygun uygulamada açabilirsiniz.'}
                </Text>
                <Button
                  leftSection={<IconDownload size={16} />}
                  onClick={handleDownload}
                  mt="md"
                >
                  {t('mediaGallery.download') || 'Download'}
                </Button>
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
                  {t('mediaGallery.previewNotAvailable') || 'Preview not available for this file type'}
                </Text>
                <Text size="xs" c="dimmed">
                  {formatFileSize(effectiveFileInfo?.size)}
                </Text>
                <Button
                  leftSection={<IconDownload size={16} />}
                  onClick={handleDownload}
                  mt="md"
                >
                  {t('mediaGallery.download') || 'Download'}
                </Button>
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
                {effectiveFileInfo?.originalName || effectiveFileInfo?.filename || '-'}
              </Text>
              <Text size="xs" c="dimmed">
                {formatFileSize(effectiveFileInfo?.size)} • {effectiveFileInfo?.mimeType || '-'}
              </Text>
            </Stack>
            <Button
              leftSection={<IconDownload size={16} />}
              onClick={handleDownload}
            >
              {t('mediaGallery.download') || 'Download'}
            </Button>
          </Group>
        </Paper>
      </Stack>
    </Modal>
  );
}

export function MediaGallery({
  tenantId,
  entityId,
  entityType,
  images = [],
  documents = [],
  coverImage,
  onImagesChange,
  onDocumentsChange,
  onCoverImageChange,
  userId,
}: MediaGalleryProps) {
  const { t } = useTranslation('modules/real-estate');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [previewOpened, { open: openPreview, close: closePreview }] = useDisclosure(false);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [previewFileInfo, setPreviewFileInfo] = useState<CoreFileInfo | null>(null);

  const { uploadFile } = useCoreFileManager({
    tenantId,
    module: 'real-estate',
    entityType,
    ...(entityId ? { entityId } : {}),
    userId,
  });

  const handleImageUpload = async (files: File[] | null) => {
    if (!files || files.length === 0) return;

    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      showToast({
        type: 'error',
        title: t('form.imageUploadError'),
        message: t('form.invalidImageType'),
      });
      return;
    }

    setUploadingImages(true);
    try {
      const uploadPromises = imageFiles.map(file =>
        uploadFile({
          file,
          title: file.name,
        })
      );

      const uploadedFiles = await Promise.all(uploadPromises);
      const newImageIds = uploadedFiles.map(file => file.id);

      const newImages = [...images, ...newImageIds];
      onImagesChange(newImages);

      if (!coverImage && newImageIds.length > 0) {
        const firstImageId = newImageIds[0];
        if (firstImageId) {
          onCoverImageChange(firstImageId);
        }
      }

      showToast({
        type: 'success',
        title: t('form.imageUploadSuccess'),
        message: `${newImageIds.length} ${t('mediaGallery.imagesUploaded') || 'images uploaded'}`,
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      showToast({
        type: 'error',
        title: t('form.imageUploadError'),
        message: error instanceof Error ? error.message : t('form.imageUploadError'),
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDocumentUpload = async (files: File[] | null) => {
    if (!files || files.length === 0 || !onDocumentsChange) return;

    setUploadingDocs(true);
    try {
      const uploadPromises = files.map(file =>
        uploadFile({
          file,
          title: file.name,
        })
      );

      const uploadedFiles = await Promise.all(uploadPromises);
      const newDocIds = uploadedFiles.map(file => file.id);

      const newDocs = [...documents, ...newDocIds];
      onDocumentsChange(newDocs);

      showToast({
        type: 'success',
        title: t('mediaGallery.documentUploadSuccess') || 'Documents uploaded',
        message: `${newDocIds.length} ${t('mediaGallery.documentsUploaded') || 'documents uploaded'}`,
      });
    } catch (error) {
      console.error('Error uploading documents:', error);
      showToast({
        type: 'error',
        title: t('mediaGallery.documentUploadError') || 'Document upload error',
        message: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setUploadingDocs(false);
    }
  };

  const handleRemoveImage = (imageId: string) => {
    const currentImages = Array.isArray(images) ? images : [];
    const newImages = currentImages.filter((id) => id !== imageId);
    onImagesChange(newImages);

    if (coverImage === imageId) {
      const firstImage = newImages[0];
      onCoverImageChange(firstImage || undefined);
    }
  };

  const handleRemoveDocument = (docId: string) => {
    if (!onDocumentsChange) return;
    const currentDocs = Array.isArray(documents) ? documents : [];
    const newDocs = currentDocs.filter((id) => id !== docId);
    onDocumentsChange(newDocs);
  };

  const handleSetCover = (imageId: string) => {
    onCoverImageChange(imageId);
  };

  const handlePreview = (fileId: string, info?: CoreFileInfo) => {
    setPreviewFileId(fileId);
    setPreviewFileInfo(info || null);
    openPreview();
  };

  const getImageUrl = (fileId: string) => {
    return `/api/core-files/${fileId}/download`;
  };

  const getDocumentIcon = (extension?: string) => {
    switch (extension?.toLowerCase()) {
      case 'pdf':
        return <IconFileTypePdf size={32} />;
      case 'doc':
      case 'docx':
        return <IconFileTypeDoc size={32} />;
      case 'xls':
      case 'xlsx':
        return <IconFileTypeXls size={32} />;
      default:
        return <IconFile size={32} />;
    }
  };

  // Ensure arrays are valid
  const safeImages = Array.isArray(images) ? images : [];
  const safeDocs = Array.isArray(documents) ? documents : [];

  return (
    <Stack gap="md">
      <Tabs defaultValue="images">
        <Tabs.List>
          <Tabs.Tab value="images" leftSection={<IconPhoto size={16} />}>
            {t('mediaGallery.images') || 'Images'} ({safeImages.length})
          </Tabs.Tab>
          {onDocumentsChange && (
            <Tabs.Tab value="documents" leftSection={<IconFile size={16} />}>
              {t('mediaGallery.documents') || 'Documents'} ({safeDocs.length})
            </Tabs.Tab>
          )}
        </Tabs.List>

        <Tabs.Panel value="images" pt="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="sm" fw={500}>
                {t('form.images')}
              </Text>
              <FileButton
                onChange={handleImageUpload}
                accept="image/png,image/jpeg,image/jpg,image/webp"
                multiple
                disabled={uploadingImages}
              >
                {(props) => (
                  <Button
                    {...props}
                    leftSection={<IconUpload size={16} />}
                    loading={uploadingImages}
                    size="sm"
                  >
                    {t('form.uploadImages')}
                  </Button>
                )}
              </FileButton>
            </Group>

            <Text size="xs" c="dimmed">
              {t('form.uploadImagesHint')}
            </Text>

            {safeImages.length === 0 ? (
              <Box
                p="xl"
                style={{
                  border: '2px dashed var(--mantine-color-default-border)',
                  borderRadius: 'var(--mantine-radius-md)',
                  textAlign: 'center',
                }}
              >
                <Text size="sm" c="dimmed">
                  {t('form.noImages')}
                </Text>
              </Box>
            ) : (
              <SimpleGrid cols={{ base: 3, sm: 4, md: 5, lg: 6 }} spacing="xs">
                {safeImages.map((imageId) => (
                  <Card key={imageId} padding={0} radius="sm" withBorder pos="relative" style={{ overflow: 'hidden' }}>
                    <Box pos="relative" h={80}>
                      <Image
                        src={getImageUrl(imageId)}
                        alt="Property image"
                        h={80}
                        w="100%"
                        fit="cover"
                        fallbackSrc="https://placehold.co/100x80?text=Img"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handlePreview(imageId)}
                      />
                      <Box
                        pos="absolute"
                        top={4}
                        right={4}
                        style={{ zIndex: 1 }}
                      >
                        <Group gap={2}>
                          <Tooltip label={coverImage === imageId ? t('form.coverImage') : t('form.setAsCover')}>
                            <ActionIcon
                              variant="filled"
                              color={coverImage === imageId ? 'yellow' : 'dark'}
                              size="xs"
                              onClick={() => handleSetCover(imageId)}
                            >
                              {coverImage === imageId ? (
                                <IconStarFilled size={12} />
                              ) : (
                                <IconStar size={12} />
                              )}
                            </ActionIcon>
                          </Tooltip>
                          <ActionIcon
                            variant="filled"
                            color="red"
                            size="xs"
                            onClick={() => handleRemoveImage(imageId)}
                          >
                            <IconX size={12} />
                          </ActionIcon>
                        </Group>
                      </Box>
                      {coverImage === imageId && (
                        <Badge
                          pos="absolute"
                          bottom={4}
                          left={4}
                          color="yellow"
                          variant="filled"
                          size="xs"
                        >
                          {t('form.coverImage')}
                        </Badge>
                      )}
                    </Box>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Stack>
        </Tabs.Panel>

        {onDocumentsChange && (
          <Tabs.Panel value="documents" pt="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  {t('mediaGallery.documents') || 'Documents'}
                </Text>
                <FileButton
                  onChange={handleDocumentUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                  multiple
                  disabled={uploadingDocs}
                >
                  {(props) => (
                    <Button
                      {...props}
                      leftSection={<IconUpload size={16} />}
                      loading={uploadingDocs}
                      size="sm"
                    >
                      {t('mediaGallery.uploadDocuments') || 'Upload Documents'}
                    </Button>
                  )}
                </FileButton>
              </Group>

              <Text size="xs" c="dimmed">
                {t('mediaGallery.uploadDocumentsHint') || 'Supported: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV'}
              </Text>

              {safeDocs.length === 0 ? (
                <Box
                  p="xl"
                  style={{
                    border: '2px dashed var(--mantine-color-default-border)',
                    borderRadius: 'var(--mantine-radius-md)',
                    textAlign: 'center',
                  }}
                >
                  <Text size="sm" c="dimmed">
                    {t('mediaGallery.noDocuments') || 'No documents uploaded'}
                  </Text>
                </Box>
              ) : (
                <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
                  {safeDocs.map((docId) => (
                    <Card key={docId} padding="md" radius="md" withBorder>
                      <Stack align="center" gap="xs">
                        {getDocumentIcon()}
                        <Text size="xs" ta="center" lineClamp={2}>
                          {docId.slice(0, 8)}...
                        </Text>
                        <Group gap="xs">
                          <Tooltip label={t('mediaGallery.preview') || 'Preview'}>
                            <ActionIcon
                              variant="light"
                              color="blue"
                              size="sm"
                              onClick={() => handlePreview(docId)}
                            >
                              <IconEye size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label={t('mediaGallery.download') || 'Download'}>
                            <ActionIcon
                              component="a"
                              href={`/api/core-files/${docId}/download`}
                              download
                              variant="light"
                              color="green"
                              size="sm"
                            >
                              <IconDownload size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <ActionIcon
                            variant="light"
                            color="red"
                            size="sm"
                            onClick={() => handleRemoveDocument(docId)}
                          >
                            <IconX size={16} />
                          </ActionIcon>
                        </Group>
                      </Stack>
                    </Card>
                  ))}
                </SimpleGrid>
              )}
            </Stack>
          </Tabs.Panel>
        )}
      </Tabs>

      <FilePreviewModal
        opened={previewOpened}
        onClose={closePreview}
        fileId={previewFileId}
        fileInfo={previewFileInfo}
      />
    </Stack>
  );
}
