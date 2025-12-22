'use client';

import { useState, useMemo } from 'react';
import {
  Stack,
  Group,
  Button,
  Text,
  Card,
  Image,
  ActionIcon,
  Badge,
  Box,
  FileButton,
  Tooltip,
  Modal,
  Paper,
  Loader,
  Tabs,
  useMantineColorScheme,
  ScrollArea,
  Code,
  AspectRatio,
  Center,
  ThemeIcon,
} from '@mantine/core';
import {
  IconUpload,
  IconX,
  IconStar,
  IconStarFilled,
  IconDownload,
  IconPhoto,
  IconFileText,
  IconFile,
  IconFileZip,
  IconVideo,
  IconMusic,
  IconEye,
  IconMaximize,
} from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { useCoreFileManager } from '@/hooks/useCoreFileManager';
import { showToast } from '@/modules/notifications/components/ToastNotification';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// File type for CoreFile
interface CoreFileInfo {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  extension?: string;
}

interface MediaGalleryProps {
  tenantId: string;
  entityId?: string;
  entityType: 'property' | 'apartment';
  images: string[];
  documents: string[];
  coverImage?: string;
  onImagesChange: (images: string[]) => void;
  onDocumentsChange: (documents: string[]) => void;
  onCoverImageChange: (coverImage: string | undefined) => void;
  userId: string;
}

// Get file extension from filename or mimeType
const getFileExtension = (filename: string, mimeType?: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (ext) return ext;

  // Fallback to mimeType
  if (mimeType) {
    const mimeExt = mimeType.split('/').pop()?.toLowerCase() || '';
    return mimeExt;
  }
  return '';
};

// Check if file is an image
const isImageFile = (filename: string, mimeType?: string): boolean => {
  const ext = getFileExtension(filename, mimeType);
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
  return imageExts.includes(ext) || (mimeType?.startsWith('image/') ?? false);
};

// Check if file is a PDF
const isPdfFile = (filename: string, mimeType?: string): boolean => {
  const ext = getFileExtension(filename, mimeType);
  return ext === 'pdf' || mimeType === 'application/pdf';
};

// Check if file is a video
const isVideoFile = (filename: string, mimeType?: string): boolean => {
  const ext = getFileExtension(filename, mimeType);
  const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'wmv', 'flv', 'mkv'];
  return videoExts.includes(ext) || (mimeType?.startsWith('video/') ?? false);
};

// Check if file is audio
const isAudioFile = (filename: string, mimeType?: string): boolean => {
  const ext = getFileExtension(filename, mimeType);
  const audioExts = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'];
  return audioExts.includes(ext) || (mimeType?.startsWith('audio/') ?? false);
};

// Check if file is a Word document
const isWordFile = (filename: string, mimeType?: string): boolean => {
  const ext = getFileExtension(filename, mimeType);
  return ['doc', 'docx'].includes(ext) ||
    (mimeType?.includes('word') ?? false) ||
    (mimeType?.includes('msword') ?? false);
};

// Check if file is an Excel document
const isExcelFile = (filename: string, mimeType?: string): boolean => {
  const ext = getFileExtension(filename, mimeType);
  return ['xls', 'xlsx'].includes(ext) ||
    (mimeType?.includes('excel') ?? false) ||
    (mimeType?.includes('spreadsheet') ?? false);
};

// Check if file is text/markdown
const isTextFile = (filename: string, mimeType?: string): boolean => {
  const ext = getFileExtension(filename, mimeType);
  const textExts = ['txt', 'log', 'json', 'xml', 'yaml', 'yml', 'ini', 'conf', 'md', 'markdown'];
  return textExts.includes(ext) || (mimeType?.startsWith('text/') ?? false);
};

// Get icon for file type
const getFileIcon = (filename: string, mimeType?: string, size: number = 48) => {
  if (isImageFile(filename, mimeType)) return <IconPhoto size={size} />;
  if (isPdfFile(filename, mimeType)) return <IconFileText size={size} />;
  if (isVideoFile(filename, mimeType)) return <IconVideo size={size} />;
  if (isAudioFile(filename, mimeType)) return <IconMusic size={size} />;
  if (isWordFile(filename, mimeType) || isExcelFile(filename, mimeType)) return <IconFileText size={size} />;
  if (isTextFile(filename, mimeType)) return <IconFileText size={size} />;
  const ext = getFileExtension(filename, mimeType);
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return <IconFileZip size={size} />;
  return <IconFile size={size} />;
};

// Format file size
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '-';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Preview Modal Component
interface PreviewModalProps {
  opened: boolean;
  onClose: () => void;
  fileId: string | null;
  fileInfo?: CoreFileInfo | null;
}

function PreviewModal({ opened, onClose, fileId, fileInfo }: PreviewModalProps) {
  const { t } = useTranslation('modules/real-estate');
  const { colorScheme } = useMantineColorScheme();
  const [textContent, setTextContent] = useState<string>('');
  const [loadingText, setLoadingText] = useState(false);
  const [loading, setLoading] = useState(true);

  const previewUrl = fileId ? `/api/core-files/${fileId}/download` : '';
  const filename = fileInfo?.originalName || fileInfo?.filename || 'file';
  const mimeType = fileInfo?.mimeType || '';

  const isImage = isImageFile(filename, mimeType);
  const isPdf = isPdfFile(filename, mimeType);
  const isVideo = isVideoFile(filename, mimeType);
  const isAudio = isAudioFile(filename, mimeType);
  const isWord = isWordFile(filename, mimeType);
  const isExcel = isExcelFile(filename, mimeType);
  const isText = isTextFile(filename, mimeType);
  const isMarkdown = /\.(md|markdown)$/i.test(filename);

  // Load text content for text files
  useMemo(() => {
    if (opened && fileId && (isText || isMarkdown)) {
      setLoadingText(true);
      fetch(previewUrl)
        .then(res => res.text())
        .then(text => {
          setTextContent(text);
          setLoadingText(false);
        })
        .catch(() => {
          setTextContent('Dosya yüklenirken hata oluştu.');
          setLoadingText(false);
        });
    } else {
      setTextContent('');
    }
  }, [opened, fileId, isText, isMarkdown, previewUrl]);

  const handleDownload = () => {
    if (fileId) {
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!fileId) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={filename}
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
              src={previewUrl}
              alt={filename}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
              onLoad={() => setLoading(false)}
              onError={(e) => {
                setLoading(false);
                (e.target as HTMLImageElement).src = '/placeholder-image.png';
              }}
            />
          ) : isPdf ? (
            <iframe
              src={previewUrl + '#toolbar=1'}
              style={{
                width: '100%',
                height: '70vh',
                border: 'none',
                borderRadius: '8px',
              }}
              title={filename}
              onLoad={() => setLoading(false)}
            />
          ) : isVideo ? (
            <video
              src={previewUrl}
              controls
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                borderRadius: '8px',
                backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5',
              }}
              onLoadedData={() => setLoading(false)}
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
                src={previewUrl}
                controls
                style={{ width: '100%' }}
                onLoadedData={() => setLoading(false)}
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
                <Button
                  leftSection={<IconDownload size={16} />}
                  onClick={handleDownload}
                  mt="md"
                >
                  {t('form.download')}
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
                  Bu dosya türü önizlenemez
                </Text>
                <Text size="xs" c="dimmed">
                  {formatFileSize(fileInfo?.size)}
                </Text>
                <Button
                  leftSection={<IconDownload size={16} />}
                  onClick={handleDownload}
                  mt="md"
                >
                  {t('form.download')}
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
                {filename}
              </Text>
              <Text size="xs" c="dimmed">
                {formatFileSize(fileInfo?.size)} • {mimeType || '-'}
              </Text>
            </Stack>
            <Button
              leftSection={<IconDownload size={16} />}
              onClick={handleDownload}
            >
              {t('form.download')}
            </Button>
          </Group>
        </Paper>
      </Stack>
    </Modal>
  );
}

// Media Card Component for Images
interface MediaCardProps {
  fileId: string;
  type: 'image' | 'document';
  isCover?: boolean;
  onRemove: () => void;
  onSetCover?: () => void;
  onPreview: () => void;
}

function MediaCard({ fileId, type, isCover, onRemove, onSetCover, onPreview }: MediaCardProps) {
  const { t } = useTranslation('modules/real-estate');
  const [fileInfo, setFileInfo] = useState<CoreFileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const imageUrl = `/api/core-files/${fileId}/download`;

  // Fetch file info
  useMemo(() => {
    fetch(`/api/core-files/${fileId}`)
      .then(res => res.json())
      .then(data => {
        if (data.file) {
          setFileInfo(data.file);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setError(true);
      });
  }, [fileId]);

  const filename = fileInfo?.originalName || fileInfo?.filename || 'file';
  const mimeType = fileInfo?.mimeType || '';
  const isImage = type === 'image' || isImageFile(filename, mimeType);

  return (
    <Card
      padding={0}
      radius="md"
      withBorder
      pos="relative"
      style={{
        cursor: 'pointer',
        overflow: 'hidden',
      }}
      onClick={onPreview}
    >
      <AspectRatio ratio={4/3}>
        {loading ? (
          <Center h="100%" bg="gray.1">
            <Loader size="sm" />
          </Center>
        ) : error ? (
          <Center h="100%" bg="gray.1">
            <IconFile size={48} opacity={0.5} />
          </Center>
        ) : isImage ? (
          <Image
            src={imageUrl}
            alt={filename}
            fit="cover"
            fallbackSrc="https://placehold.co/400x300?text=Image"
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <Center
            h="100%"
            style={{
              backgroundColor: 'var(--mantine-color-gray-1)',
            }}
          >
            <Stack align="center" gap="xs">
              <ThemeIcon size={48} variant="light" color="gray">
                {getFileIcon(filename, mimeType, 28)}
              </ThemeIcon>
              <Text size="xs" c="dimmed" ta="center" lineClamp={2} px="xs">
                {filename}
              </Text>
            </Stack>
          </Center>
        )}
      </AspectRatio>

      {/* Overlay Actions */}
      <Box
        pos="absolute"
        top={8}
        right={8}
        style={{ zIndex: 1 }}
      >
        <Group gap={4}>
          <Tooltip label={t('form.preview')}>
            <ActionIcon
              variant="filled"
              color="dark"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPreview();
              }}
            >
              <IconMaximize size={14} />
            </ActionIcon>
          </Tooltip>
          {type === 'image' && onSetCover && (
            <Tooltip label={isCover ? t('form.coverImage') : t('form.setAsCover')}>
              <ActionIcon
                variant="filled"
                color={isCover ? 'yellow' : 'dark'}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetCover();
                }}
              >
                {isCover ? (
                  <IconStarFilled size={14} />
                ) : (
                  <IconStar size={14} />
                )}
              </ActionIcon>
            </Tooltip>
          )}
          <ActionIcon
            variant="filled"
            color="red"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <IconX size={14} />
          </ActionIcon>
        </Group>
      </Box>

      {/* Cover Badge */}
      {isCover && (
        <Badge
          pos="absolute"
          bottom={8}
          left={8}
          color="yellow"
          variant="filled"
          size="sm"
        >
          {t('form.coverImage')}
        </Badge>
      )}
    </Card>
  );
}

export function MediaGallery({
  tenantId,
  entityId,
  entityType,
  images,
  documents,
  coverImage,
  onImagesChange,
  onDocumentsChange,
  onCoverImageChange,
  userId,
}: MediaGalleryProps) {
  const { t } = useTranslation('modules/real-estate');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [previewFileInfo, setPreviewFileInfo] = useState<CoreFileInfo | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('images');

  const { uploadFile } = useCoreFileManager({
    tenantId,
    module: 'real-estate',
    entityType,
    ...(entityId ? { entityId } : {}),
    userId,
  });

  // Handle multiple image upload
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

      // If no cover image is set, set the first uploaded image as cover
      if (!coverImage && newImageIds.length > 0) {
        const firstImageId = newImageIds[0];
        if (firstImageId) {
          onCoverImageChange(firstImageId);
        }
      }

      showToast({
        type: 'success',
        title: t('form.imageUploadSuccess'),
        message: `${newImageIds.length} ${t('mediaGallery.imagesUploaded')}`,
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

  // Handle document upload
  const handleDocumentUpload = async (files: File[] | null) => {
    if (!files || files.length === 0) return;

    // Accept all file types for documents
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

      const newDocuments = [...documents, ...newDocIds];
      onDocumentsChange(newDocuments);

      showToast({
        type: 'success',
        title: t('mediaGallery.documentUploadSuccess'),
        message: `${newDocIds.length} ${t('mediaGallery.documentsUploaded')}`,
      });
    } catch (error) {
      console.error('Error uploading documents:', error);
      showToast({
        type: 'error',
        title: t('mediaGallery.documentUploadError'),
        message: error instanceof Error ? error.message : t('mediaGallery.documentUploadError'),
      });
    } finally {
      setUploadingDocs(false);
    }
  };

  const handleRemoveImage = (imageId: string) => {
    const newImages = images.filter((id) => id !== imageId);
    onImagesChange(newImages);

    if (coverImage === imageId) {
      const firstImage = newImages[0];
      onCoverImageChange(firstImage || undefined);
    }
  };

  const handleRemoveDocument = (docId: string) => {
    const newDocuments = documents.filter((id) => id !== docId);
    onDocumentsChange(newDocuments);
  };

  const handleSetCover = (imageId: string) => {
    onCoverImageChange(imageId);
  };

  const handlePreview = async (fileId: string) => {
    setPreviewFileId(fileId);

    // Fetch file info for preview modal
    try {
      const res = await fetch(`/api/core-files/${fileId}`);
      const data = await res.json();
      if (data.file) {
        setPreviewFileInfo(data.file);
      }
    } catch (err) {
      console.error('Error fetching file info:', err);
    }
  };

  return (
    <Stack gap="md">
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="images" leftSection={<IconPhoto size={16} />}>
            {t('mediaGallery.images')} {images.length > 0 && <Badge size="xs" ml="xs">{images.length}</Badge>}
          </Tabs.Tab>
          <Tabs.Tab value="documents" leftSection={<IconFileText size={16} />}>
            {t('mediaGallery.documents')} {documents.length > 0 && <Badge size="xs" ml="xs">{documents.length}</Badge>}
          </Tabs.Tab>
        </Tabs.List>

        {/* Images Tab */}
        <Tabs.Panel value="images" pt="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="sm" fw={500}>
                {t('mediaGallery.apartmentImages')}
              </Text>
              <FileButton
                onChange={handleImageUpload}
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
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

            {images.length === 0 ? (
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
              <Box
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '12px',
                }}
              >
                {images.map((imageId) => (
                  <MediaCard
                    key={imageId}
                    fileId={imageId}
                    type="image"
                    isCover={coverImage === imageId}
                    onRemove={() => handleRemoveImage(imageId)}
                    onSetCover={() => handleSetCover(imageId)}
                    onPreview={() => handlePreview(imageId)}
                  />
                ))}
              </Box>
            )}
          </Stack>
        </Tabs.Panel>

        {/* Documents Tab */}
        <Tabs.Panel value="documents" pt="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="sm" fw={500}>
                {t('mediaGallery.apartmentDocuments')}
              </Text>
              <FileButton
                onChange={handleDocumentUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
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
                    {t('mediaGallery.uploadDocuments')}
                  </Button>
                )}
              </FileButton>
            </Group>

            <Text size="xs" c="dimmed">
              {t('mediaGallery.uploadDocumentsHint')}
            </Text>

            {documents.length === 0 ? (
              <Box
                p="xl"
                style={{
                  border: '2px dashed var(--mantine-color-default-border)',
                  borderRadius: 'var(--mantine-radius-md)',
                  textAlign: 'center',
                }}
              >
                <Text size="sm" c="dimmed">
                  {t('mediaGallery.noDocuments')}
                </Text>
              </Box>
            ) : (
              <Box
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '12px',
                }}
              >
                {documents.map((docId) => (
                  <MediaCard
                    key={docId}
                    fileId={docId}
                    type="document"
                    onRemove={() => handleRemoveDocument(docId)}
                    onPreview={() => handlePreview(docId)}
                  />
                ))}
              </Box>
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {/* Preview Modal */}
      <PreviewModal
        opened={!!previewFileId}
        onClose={() => {
          setPreviewFileId(null);
          setPreviewFileInfo(null);
        }}
        fileId={previewFileId}
        fileInfo={previewFileInfo}
      />
    </Stack>
  );
}
