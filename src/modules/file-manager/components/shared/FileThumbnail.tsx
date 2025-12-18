import { Image } from '@mantine/core';
import { FileIcon } from './FileIcon';

interface FileThumbnailProps {
    fileName: string;
    mimeType?: string;
    thumbnailUrl?: string;
    type?: 'file' | 'folder';
    size?: number;
}

export function FileThumbnail({ fileName, mimeType, thumbnailUrl, type, size = 48 }: FileThumbnailProps) {
    const isImage = mimeType?.startsWith('image/');
    const isVideo = mimeType?.startsWith('video/');

    if ((isImage || isVideo) && thumbnailUrl) {
        return (
            <Image
                src={thumbnailUrl}
                alt={fileName}
                width={size}
                height={size}
                fit="cover"
                radius="sm"
                fallbackSrc="/placeholder-image.png"
            />
        );
    }

    return <FileIcon fileName={fileName} {...(mimeType ? { mimeType } : {})} {...(type ? { type } : {})} size={size} />;
}
