import {
    IconFile,
    IconFileText,
    IconFileZip,
    IconFileCode,
    IconPhoto,
    IconFolder,
    IconMusic,
    IconVideo,
} from '@tabler/icons-react';

interface FileIconProps {
    fileName: string;
    mimeType?: string;
    type?: 'file' | 'folder';
    size?: number;
}

export function FileIcon({ fileName, mimeType, type, size = 24 }: FileIconProps) {
    if (type === 'folder') {
        return <IconFolder size={size} />;
    }

    const extension = fileName.split('.').pop()?.toLowerCase();

    // Image files
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(extension || '')) {
        return <IconPhoto size={size} />;
    }

    // PDF, Word, Excel, PowerPoint - use generic file icon
    if (
        ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension || '') ||
        mimeType?.includes('pdf') ||
        mimeType?.includes('word') ||
        mimeType?.includes('excel') ||
        mimeType?.includes('powerpoint') ||
        mimeType?.includes('spreadsheet') ||
        mimeType?.includes('presentation')
    ) {
        return <IconFileText size={size} />;
    }

    // Archives
    if (
        mimeType === 'application/zip' ||
        mimeType === 'application/x-rar-compressed' ||
        ['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')
    ) {
        return <IconFileZip size={size} />;
    }

    // Code files
    if (
        ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'css', 'scss', 'html', 'xml', 'json', 'yaml', 'yml'].includes(
            extension || ''
        )
    ) {
        return <IconFileCode size={size} />;
    }

    // Audio files
    if (mimeType?.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(extension || '')) {
        return <IconMusic size={size} />;
    }

    // Video files
    if (mimeType?.startsWith('video/') || ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'].includes(extension || '')) {
        return <IconVideo size={size} />;
    }

    // Text files
    if (mimeType?.startsWith('text/') || ['txt', 'md', 'log'].includes(extension || '')) {
        return <IconFileText size={size} />;
    }

    // Default
    return <IconFile size={size} />;
}
