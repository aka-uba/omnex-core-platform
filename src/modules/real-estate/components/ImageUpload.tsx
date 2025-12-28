'use client';

import { useState } from 'react';
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
} from '@mantine/core';
import { IconUpload, IconX, IconStar, IconStarFilled } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import { useCoreFileManager } from '@/hooks/useCoreFileManager';
import { showToast } from '@/modules/notifications/components/ToastNotification';

interface ImageUploadProps {
  tenantId: string;
  entityId?: string;
  entityType: 'property' | 'apartment';
  images: string[];
  coverImage?: string;
  onImagesChange: (images: string[]) => void;
  onCoverImageChange: (coverImage: string | undefined) => void;
  userId: string;
}

export function ImageUpload({
  tenantId,
  entityId,
  entityType,
  images,
  coverImage,
  onImagesChange,
  onCoverImageChange,
  userId,
}: ImageUploadProps) {
  const { t } = useTranslation('modules/real-estate');
  const [uploading, setUploading] = useState(false);

  const { uploadFile } = useCoreFileManager({
    tenantId,
    module: 'real-estate',
    entityType,
    ...(entityId ? { entityId } : {}),
    userId, // We'll manually trigger uploads
  });

  // const handleFileUpload = async (file: File | null) => { // removed - unused
  //   if (!file) return;

  //   // Check if file is an image
  //   if (!file.type.startsWith('image/')) {
  //     showToast({
  //       type: 'error',
  //       title: t('form.imageUploadError'),
  //       message: t('form.invalidImageType'),
  //     });
  //     return;
  //   }

  //   setUploading(true);
  //   try {
  //     const uploadedFile = await uploadFile({
  //       file,
  //       title: file.name,
  //     });

  //     // Add the file ID to images array
  //     const newImages = [...images, uploadedFile.id];
  //     onImagesChange(newImages);

  //     // If no cover image is set, set this as cover
  //     if (!coverImage) {
  //       onCoverImageChange(uploadedFile.id);
  //     }

  //     showToast({
  //       type: 'success',
  //       title: t('form.imageUploadSuccess'),
  //       message: t('form.imageUploadSuccessMessage'),
  //     });
  //   } catch (error) {
  //     console.error('Error uploading image:', error);
  //     const errorMessage = error instanceof Error ? error.message : t('form.imageUploadError');
  //     showToast({
  //       type: 'error',
  //       title: t('form.imageUploadError'),
  //       message: errorMessage,
  //     });
  //   } finally {
  //     setUploading(false);
  //   }
  // };

  const handleMultipleFileUpload = async (files: File[] | null) => {
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

    setUploading(true);
    try {
      const uploadPromises = imageFiles.map(file => 
        uploadFile({
          file,
          title: file.name,
        })
      );

      const uploadedFiles = await Promise.all(uploadPromises);
      const newImageIds = uploadedFiles.map(file => file.id);
      
      // Add all uploaded file IDs to images array
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
        message: t('form.imageUploadSuccessMessage') || `${newImageIds.length} resim başarıyla yüklendi`,
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      const errorMessage = error instanceof Error ? error.message : t('form.imageUploadError');
      showToast({
        type: 'error',
        title: t('form.imageUploadError'),
        message: errorMessage,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (imageId: string) => {
    const newImages = images.filter((id) => id !== imageId);
    onImagesChange(newImages);

    // If removed image was cover, set first remaining image as cover or null
    if (coverImage === imageId) {
      const firstImage = newImages[0];
      onCoverImageChange(firstImage || undefined);
    }
  };

  const handleSetCover = (imageId: string) => {
    onCoverImageChange(imageId);
  };

  // Get image URL from CoreFile ID
  const getImageUrl = (fileId: string) => {
    return `/api/core-files/${fileId}/download`;
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text size="sm" fw={500}>
          {t('form.images')}
        </Text>
        <FileButton
          onChange={handleMultipleFileUpload}
          accept="image/png,image/jpeg,image/jpg,image/webp"
          multiple
          disabled={uploading}
        >
          {(props) => (
            <Button
              {...props}
              leftSection={<IconUpload size={16} />}
              loading={uploading}
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
        <SimpleGrid cols={{ base: 3, sm: 4, md: 5, lg: 6 }} spacing="xs">
          {images.map((imageId) => (
            <Card key={imageId} padding={0} radius="sm" withBorder pos="relative" style={{ overflow: 'hidden', aspectRatio: '1/1' }}>
              <Box pos="relative" style={{ width: '100%', height: '100%' }}>
                <Image
                  src={getImageUrl(imageId)}
                  alt="Property image"
                  h="100%"
                  w="100%"
                  fit="cover"
                  fallbackSrc="https://placehold.co/100x100?text=Img"
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
  );
}
