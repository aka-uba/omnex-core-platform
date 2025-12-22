'use client';

import { useState, useCallback } from 'react';
import {
  Paper,
  Text,
  Stack,
  Group,
  SimpleGrid,
  Card,
  Image,
  Badge,
  Box,
  Button,
  ActionIcon,
  Modal,
  Loader,
} from '@mantine/core';
import {
  IconPhoto,
  IconDownload,
  IconChevronLeft,
  IconChevronRight,
  IconX,
} from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';

interface EntityImagesTabProps {
  images: string[];
  coverImage?: string | null;
  entityName?: string;
  onDownloadAll?: () => void;
  downloadAllLoading?: boolean;
}

const IMAGE_SIZE = 160; // Fixed size for all image cards

export function EntityImagesTab({
  images,
  coverImage,
  entityName,
  onDownloadAll,
  downloadAllLoading = false,
}: EntityImagesTabProps) {
  const { t } = useTranslation('modules/real-estate');
  const { t: tGlobal } = useTranslation('global');

  const [previewOpened, setPreviewOpened] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(false);

  const safeImages = Array.isArray(images) ? images : [];

  const openPreview = useCallback((index: number) => {
    setCurrentIndex(index);
    setPreviewOpened(true);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewOpened(false);
  }, []);

  const goToPrevious = useCallback(() => {
    setImageLoading(true);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : safeImages.length - 1));
  }, [safeImages.length]);

  const goToNext = useCallback(() => {
    setImageLoading(true);
    setCurrentIndex((prev) => (prev < safeImages.length - 1 ? prev + 1 : 0));
  }, [safeImages.length]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    } else if (e.key === 'Escape') {
      closePreview();
    }
  }, [goToPrevious, goToNext, closePreview]);

  const handleDownload = useCallback((imageId: string) => {
    const link = document.createElement('a');
    link.href = `/api/core-files/${imageId}/download`;
    link.download = `image-${imageId}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const currentImageId = safeImages[currentIndex];

  if (safeImages.length === 0) {
    return (
      <Paper shadow="xs" p="md">
        <Stack align="center" gap="md" py="xl">
          <IconPhoto size={48} color="gray" />
          <Text c="dimmed" ta="center">
            {t('mediaGallery.noImages') || 'No images available'}
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper shadow="xs" p="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="lg" fw={600}>
            {t('mediaGallery.images') || 'Images'} ({safeImages.length})
          </Text>
          {onDownloadAll && safeImages.length > 0 && (
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
          {safeImages.map((imageId, index) => (
            <Card
              key={imageId}
              padding={0}
              radius="md"
              withBorder
              style={{
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
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
              <Box
                style={{
                  width: '100%',
                  height: IMAGE_SIZE,
                  position: 'relative',
                }}
              >
                <Image
                  src={`/api/core-files/${imageId}/download?inline=true`}
                  alt={`Image ${index + 1}`}
                  h={IMAGE_SIZE}
                  w="100%"
                  fit="cover"
                  fallbackSrc={`https://placehold.co/${IMAGE_SIZE}x${IMAGE_SIZE}?text=Image`}
                />
                {coverImage === imageId && (
                  <Badge
                    pos="absolute"
                    top={8}
                    left={8}
                    color="yellow"
                    variant="filled"
                    size="sm"
                  >
                    {t('form.coverImage') || 'Cover'}
                  </Badge>
                )}
              </Box>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>

      {/* Image Preview Modal */}
      <Modal
        opened={previewOpened}
        onClose={closePreview}
        size="xl"
        centered
        withCloseButton={false}
        padding={0}
        styles={{
          content: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
          },
          body: {
            padding: 0,
          },
        }}
        onKeyDown={handleKeyDown}
      >
        <Box
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '70vh',
          }}
        >
          {/* Close Button */}
          <ActionIcon
            variant="filled"
            color="dark"
            size="lg"
            radius="xl"
            pos="absolute"
            top={-40}
            right={0}
            onClick={closePreview}
            style={{ zIndex: 10 }}
          >
            <IconX size={20} />
          </ActionIcon>

          {/* Previous Button */}
          {safeImages.length > 1 && (
            <ActionIcon
              variant="filled"
              color="dark"
              size="xl"
              radius="xl"
              pos="absolute"
              left={-60}
              onClick={goToPrevious}
              style={{ zIndex: 10 }}
            >
              <IconChevronLeft size={24} />
            </ActionIcon>
          )}

          {/* Image Container */}
          <Box
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '80vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {imageLoading && (
              <Box
                pos="absolute"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 5,
                }}
              >
                <Loader size="lg" color="white" />
              </Box>
            )}
            {currentImageId && (
              <img
                src={`/api/core-files/${currentImageId}/download?inline=true`}
                alt={`Preview ${currentIndex + 1}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                }}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
              />
            )}
          </Box>

          {/* Next Button */}
          {safeImages.length > 1 && (
            <ActionIcon
              variant="filled"
              color="dark"
              size="xl"
              radius="xl"
              pos="absolute"
              right={-60}
              onClick={goToNext}
              style={{ zIndex: 10 }}
            >
              <IconChevronRight size={24} />
            </ActionIcon>
          )}

          {/* Footer Info */}
          <Paper
            pos="absolute"
            bottom={-50}
            p="sm"
            radius="md"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
            }}
          >
            <Group gap="md">
              <Text size="sm" c="white">
                {currentIndex + 1} / {safeImages.length}
              </Text>
              {currentImageId && (
                <ActionIcon
                  variant="subtle"
                  color="white"
                  onClick={() => handleDownload(currentImageId)}
                >
                  <IconDownload size={18} />
                </ActionIcon>
              )}
            </Group>
          </Paper>
        </Box>
      </Modal>
    </Paper>
  );
}
