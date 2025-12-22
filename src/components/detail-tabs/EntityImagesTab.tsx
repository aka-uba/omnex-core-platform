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
} from '@mantine/core';
import {
  IconPhoto,
  IconDownload,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';

interface EntityImagesTabProps {
  images: string[];
  coverImage?: string | null;
  entityName?: string;
  onDownloadAll?: () => void;
  downloadAllLoading?: boolean;
}

const THUMB_SIZE = 80; // Thumbnail size

export function EntityImagesTab({
  images,
  coverImage,
  entityName,
  onDownloadAll,
  downloadAllLoading = false,
}: EntityImagesTabProps) {
  const { t } = useTranslation('modules/real-estate');

  const [currentIndex, setCurrentIndex] = useState(0);

  const safeImages = Array.isArray(images) ? images : [];

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : safeImages.length - 1));
  }, [safeImages.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < safeImages.length - 1 ? prev + 1 : 0));
  }, [safeImages.length]);

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
        {/* Header */}
        <Group justify="space-between">
          <Text size="lg" fw={600}>
            {t('mediaGallery.images') || 'Images'} ({safeImages.length})
          </Text>
          <Group gap="xs">
            {currentImageId && (
              <Button
                variant="light"
                size="sm"
                leftSection={<IconDownload size={16} />}
                onClick={() => handleDownload(currentImageId)}
              >
                {t('mediaGallery.download') || 'Download'}
              </Button>
            )}
            {onDownloadAll && safeImages.length > 1 && (
              <Button
                variant="light"
                size="sm"
                leftSection={<IconDownload size={16} />}
                onClick={onDownloadAll}
                loading={downloadAllLoading}
              >
                {t('mediaGallery.downloadAll') || 'Download All (ZIP)'}
              </Button>
            )}
          </Group>
        </Group>

        {/* Main Image Display - Inline (not modal) */}
        <Box
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--mantine-color-gray-1)',
            borderRadius: 'var(--mantine-radius-md)',
            minHeight: '400px',
            maxHeight: '500px',
            overflow: 'hidden',
          }}
        >
          {/* Previous Button */}
          {safeImages.length > 1 && (
            <ActionIcon
              variant="filled"
              color="dark"
              size="xl"
              radius="xl"
              pos="absolute"
              left={16}
              onClick={goToPrevious}
              style={{ zIndex: 10 }}
            >
              <IconChevronLeft size={24} />
            </ActionIcon>
          )}

          {/* Main Image */}
          {currentImageId && (
            <img
              src={`/api/core-files/${currentImageId}/download?inline=true`}
              alt={`Image ${currentIndex + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: '500px',
                objectFit: 'contain',
              }}
            />
          )}

          {/* Next Button */}
          {safeImages.length > 1 && (
            <ActionIcon
              variant="filled"
              color="dark"
              size="xl"
              radius="xl"
              pos="absolute"
              right={16}
              onClick={goToNext}
              style={{ zIndex: 10 }}
            >
              <IconChevronRight size={24} />
            </ActionIcon>
          )}

          {/* Cover Badge */}
          {coverImage === currentImageId && (
            <Badge
              pos="absolute"
              top={16}
              left={16}
              color="yellow"
              variant="filled"
              size="lg"
            >
              {t('form.coverImage') || 'Cover'}
            </Badge>
          )}

          {/* Image Counter */}
          <Paper
            pos="absolute"
            bottom={16}
            p="xs"
            px="md"
            radius="md"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
            }}
          >
            <Text size="sm" c="white" fw={500}>
              {currentIndex + 1} / {safeImages.length}
            </Text>
          </Paper>
        </Box>

        {/* Thumbnail Strip */}
        {safeImages.length > 1 && (
          <SimpleGrid cols={{ base: 4, sm: 6, md: 8, lg: 10 }} spacing="xs">
            {safeImages.map((imageId, index) => (
              <Card
                key={imageId}
                padding={0}
                radius="sm"
                withBorder
                style={{
                  cursor: 'pointer',
                  overflow: 'hidden',
                  opacity: index === currentIndex ? 1 : 0.6,
                  border: index === currentIndex
                    ? '2px solid var(--mantine-color-blue-6)'
                    : '1px solid var(--mantine-color-gray-3)',
                  transition: 'all 0.2s',
                }}
                onClick={() => setCurrentIndex(index)}
              >
                <Box
                  style={{
                    width: '100%',
                    height: THUMB_SIZE,
                    position: 'relative',
                  }}
                >
                  <Image
                    src={`/api/core-files/${imageId}/download?inline=true`}
                    alt={`Thumbnail ${index + 1}`}
                    h={THUMB_SIZE}
                    w="100%"
                    fit="cover"
                    fallbackSrc={`https://placehold.co/${THUMB_SIZE}x${THUMB_SIZE}?text=${index + 1}`}
                  />
                  {coverImage === imageId && (
                    <Badge
                      pos="absolute"
                      top={2}
                      left={2}
                      color="yellow"
                      variant="filled"
                      size="xs"
                    >
                      {t('form.coverImage') || 'Cover'}
                    </Badge>
                  )}
                </Box>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Paper>
  );
}
