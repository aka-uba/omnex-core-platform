import { NextRequest, NextResponse } from 'next/server';
import { getServerStatus } from '../../status/route';
import { fileManagerService } from '@/modules/file-manager/services/file-manager.service';
import { FileItem } from '@/modules/file-manager/types/file';
function formatFileSize(bytes: number): string {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        // Tenant control
        const { getTenantFromRequest } = await import('@/lib/api/tenantContext');
        const tenant = await getTenantFromRequest(request);
        if (!tenant) {
            return NextResponse.json(
                { error: 'Tenant context is required' },
                { 
                    status: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type',
                    }
                }
            );
        }

        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Handle preflight
        if (request.method === 'OPTIONS') {
            return new NextResponse(null, { status: 200, headers: corsHeaders });
        }

        const { id } = await params;
        const status = getServerStatus();

        // Get all files (not just from shared folder) to find the file
        // Try to find file in all possible folders
        let file: FileItem | undefined;
        
        // First try the shared folder
        const folderId = status.folderId || null;
        const files = await fileManagerService.getFiles(folderId);
        file = files.find((f: FileItem) => f.id === id);
        
        // If not found, try root folder
        if (!file) {
            const rootFiles = await fileManagerService.getFiles(null);
            file = rootFiles.find((f: FileItem) => f.id === id);
        }
        
        // If still not found, try to get file directly
        if (!file) {
            file = await fileManagerService.getFile(id) || undefined;
        }
        
        if (!file || file.type === 'folder') {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            );
        }

        // Generate file content based on file type
        let fileContent: string | Buffer;
        let contentType = file.mimeType || 'application/octet-stream';
        
        if (file.extension === 'txt') {
            const createdAt = file.createdAt instanceof Date ? file.createdAt.toISOString() : file.createdAt;
            const modifiedAt = file.modifiedAt instanceof Date ? file.modifiedAt.toISOString() : file.modifiedAt;
            fileContent = `Bu ${file.name} dosyasının içeriğidir.\n\nDosya Adı: ${file.name}\nBoyut: ${formatFileSize(file.size || 0)}\nOluşturulma: ${createdAt}\nDeğiştirilme: ${modifiedAt}`;
            contentType = 'text/plain; charset=utf-8';
        } else if (file.extension === 'pdf') {
            // Create a simple PDF content (minimal PDF structure)
            fileContent = Buffer.from(`%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj
4 0 obj
<<
/Length 100
>>
stream
BT
/F1 12 Tf
100 700 Td
(${file.name}) Tj
ET
endstream
endobj
5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000306 00000 n 
0000000440 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
550
%%EOF`);
            contentType = 'application/pdf';
        } else if (['jpg', 'jpeg', 'png', 'gif'].includes(file.extension || '')) {
            // Return a placeholder image (1x1 transparent PNG)
            fileContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
            contentType = file.mimeType || 'image/png';
        } else if (file.extension === 'mp4') {
            // Return minimal video file (not a real video, just for demo)
            fileContent = Buffer.from('Video file placeholder - ' + file.name);
            contentType = 'video/mp4';
        } else if (['xlsx', 'xls'].includes(file.extension || '')) {
            // Return Excel-like content (CSV format as fallback)
            fileContent = `Dosya Adı,${file.name}\nBoyut,${file.size}\nTarih,${file.modifiedAt}`;
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else if (['docx', 'doc'].includes(file.extension || '')) {
            // Return text content
            const createdAt = file.createdAt instanceof Date ? file.createdAt.toISOString() : file.createdAt;
            const modifiedAt = file.modifiedAt instanceof Date ? file.modifiedAt.toISOString() : file.modifiedAt;
            fileContent = `Dosya: ${file.name}\n\nBu bir Word belgesi örneğidir.\n\nDosya bilgileri:\n- Boyut: ${formatFileSize(file.size || 0)}\n- Oluşturulma: ${createdAt}\n- Değiştirilme: ${modifiedAt}`;
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else {
            // Default: return text content
            const modifiedAt = file.modifiedAt instanceof Date ? file.modifiedAt.toISOString() : file.modifiedAt;
            fileContent = `Dosya: ${file.name}\nBoyut: ${formatFileSize(file.size || 0)}\nTarih: ${modifiedAt}`;
        }

        // Convert string to Buffer if needed
        const buffer = typeof fileContent === 'string' 
            ? Buffer.from(fileContent, 'utf-8')
            : fileContent;

        // Return file as download
        return new NextResponse(buffer as any, {
            headers: {
                ...corsHeaders,
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${encodeURIComponent(file.name)}"`,
                'Content-Length': buffer.length.toString(),
            },
        });
    } catch (error) {
        // Use logger if available (modül bağımsızlığı için optional)
        try {
            const { logger } = await import('@/lib/utils/logger');
            logger.error('Error downloading file', error, 'file-manager');
        } catch {
            // Logger not available - modül bağımsızlığı
        }
        return NextResponse.json(
            { error: 'Failed to download file' },
            { 
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            }
        );
    }
}

