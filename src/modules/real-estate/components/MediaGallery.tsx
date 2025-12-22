'use client';

import { useState, useEffect } from 'react';
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
  const [localFileInfo, setLocalFileInfo] = useState<CoreFileInfo | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch file info when modal opens
  useEffect(() => {
    if (opened && fileId && !fileInfo) {
      setLoading(true);
      fetch(`/api/core-files/${fileId}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          // API returns { success: true, data: { file: {...} } } or { file: {...} }
          const fileData = data?.data?.file || data?.file;
          if (fileData) {
            setLocalFileInfo(fileData);
          } else {
            console.error('File data not found in response:', data);
          }
        })
        .catch(err => console.error('Error fetching file info:', err))
        .finally(() => setLoading(false));
    } else if (fileInfo) {
      setLocalFileInfo(fileInfo);
    }
  }, [opened, fileId, fileInfo]);

  // Fetch text content for text files
  useEffect(() => {
    if (!opened || !fileId || !localFileInfo) return;

    const mime = localFileInfo.mimeType;
    if (mime.startsWith('text/') || mime === 'application/json' ||
        mime === 'application/javascript' || mime === 'application/xml') {
      fetch(`/api/core-files/${fileId}/download`)
        .then(res => res.text())
        .then(content => setTextContent(content))
        .catch(err => console.error('Error fetching text content:', err));
    }
  }, [opened, fileId, localFileInfo]);

  // Reset state when modal closes
  useEffect(() => {
    if (!opened) {
      setLocalFileInfo(null);
      setTextContent(null);
    }
  }, [opened]);

  const effectiveFileInfo = localFileInfo || fileInfo;

  if (!fileId) return null;

  const downloadUrl = `/api/core-files/${fileId}/download`;
  const mimeType = effectiveFileInfo?.mimeType || '';
  const extension = effectiveFileInfo?.extension?.toLowerCase() || '';

  const renderPreview = () => {
    if (loading) {
      return (
        <Box ta="center" py="xl">
          <Text c="dimmed">{t('mediaGallery.loading') || 'Loading...'}</Text>
        </Box>
      );
    }

    // Image preview
    if (mimeType.startsWith('image/')) {
      return (
        <Image
          src={downloadUrl}
          alt={effectiveFileInfo?.originalName || 'Preview'}
          fit="contain"
          mah={500}
        />
      );
    }

    // PDF preview
    if (mimeType === 'application/pdf' || extension === 'pdf') {
      return (
        <iframe
          src={downloadUrl}
          style={{ width: '100%', height: '500px', border: 'none' }}
          title={effectiveFileInfo?.originalName || 'PDF Preview'}
        />
      );
    }

    // Video preview
    if (mimeType.startsWith('video/')) {
      return (
        <video
          controls
          style={{ width: '100%', maxHeight: '500px' }}
          src={downloadUrl}
        >
          {t('mediaGallery.videoNotSupported') || 'Your browser does not support the video tag.'}
        </video>
      );
    }

    // Audio preview
    if (mimeType.startsWith('audio/')) {
      return (
        <audio controls style={{ width: '100%' }} src={downloadUrl}>
          {t('mediaGallery.audioNotSupported') || 'Your browser does not support the audio tag.'}
        </audio>
      );
    }

    // Text/code preview
    if (textContent !== null) {
      if (mimeType === 'text/markdown' || extension === 'md') {
        return (
          <ScrollArea h={400}>
            <Paper p="md">
              <ReactMarkdown>{textContent}</ReactMarkdown>
            </Paper>
          </ScrollArea>
        );
      }
      return (
        <ScrollArea h={400}>
          <Code block>{textContent}</Code>
        </ScrollArea>
      );
    }

    // Unsupported file type
    return (
      <Box ta="center" py="xl">
        <IconFile size={64} color="gray" />
        <Text c="dimmed" mt="md">
          {t('mediaGallery.previewNotAvailable') || 'Preview not available for this file type'}
        </Text>
        <Button
          component="a"
          href={downloadUrl}
          download
          leftSection={<IconDownload size={16} />}
          mt="md"
        >
          {t('mediaGallery.download') || 'Download'}
        </Button>
      </Box>
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={effectiveFileInfo?.originalName || t('mediaGallery.preview') || 'Preview'}
      size="xl"
    >
      {renderPreview()}
      <Group justify="flex-end" mt="md">
        <Button
          component="a"
          href={downloadUrl}
          download
          leftSection={<IconDownload size={16} />}
          variant="light"
        >
          {t('mediaGallery.download') || 'Download'}
        </Button>
      </Group>
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
