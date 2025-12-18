'use client';

import { SimpleGrid, Card, Image, Text, Group, ActionIcon, Badge, Overlay, Box } from '@mantine/core';
import { IconDownload, IconShare, IconMaximize } from '@tabler/icons-react';
import { GeneratedContent } from '../../types';
import classes from '../../AIModule.module.css';

interface ImageGalleryProps {
    images: GeneratedContent[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
    if (images.length === 0) {
        return (
            <Box h="100%" display="flex" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Text c="dimmed">No images generated yet</Text>
            </Box>
        );
    }

    return (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
            {images.map((image) => (
                <Card key={image.id} padding="xs" radius="md" withBorder {...(classes.imageCard ? { className: classes.imageCard } : {})}>
                    <Card.Section>
                        <Box pos="relative" {...(classes.imageWrapper ? { className: classes.imageWrapper } : {})}>
                            <Image
                                src={image.url}
                                height={200}
                                alt={image.prompt}
                                fallbackSrc="https://placehold.co/600x400?text=Generating..."
                            />
                            <Overlay opacity={0} {...(classes.imageOverlay ? { className: classes.imageOverlay } : {})} zIndex={1}>
                                <Group gap="xs" justify="center" h="100%">
                                    <ActionIcon variant="filled" color="dark" aria-label="Preview">
                                        <IconMaximize size={16} />
                                    </ActionIcon>
                                    <ActionIcon variant="filled" color="dark" aria-label="Download">
                                        <IconDownload size={16} />
                                    </ActionIcon>
                                    <ActionIcon variant="filled" color="dark" aria-label="Share">
                                        <IconShare size={16} />
                                    </ActionIcon>
                                </Group>
                            </Overlay>
                        </Box>
                    </Card.Section>

                    <Text size="xs" mt="xs" lineClamp={2} fw={500}>
                        {image.prompt}
                    </Text>

                    <Group justify="space-between" mt="xs">
                        <Badge size="xs" variant="light">
                            {image.metadata?.resolution || '1024x1024'}
                        </Badge>
                        <Text size="xs" c="dimmed">
                            {new Date(image.createdAt).toLocaleTimeString()}
                        </Text>
                    </Group>
                </Card>
            ))}
        </SimpleGrid>
    );
}
