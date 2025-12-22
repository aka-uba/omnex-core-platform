// Core Files API Route - Download File
// FAZ 0.1: Merkezi Dosya Yönetim Sistemi
// GET /api/core-files/[id]/download - Download file

import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { errorResponse } from '@/lib/api/errorHandler';
import { CoreFileService } from '@/lib/core-file-manager/CoreFileService';
import { verifyAuth } from '@/lib/auth/jwt';
import { promises as fs } from 'fs';
// GET /api/core-files/[id]/download - Download file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant(
    request,
    async (tenantPrisma) => {
      // Get user from JWT token or header (optional for public files)
      const authResult = await verifyAuth(request);
      const userId = authResult.valid && authResult.payload 
        ? authResult.payload.userId 
        : request.headers.get('x-user-id');

      const { id } = await params;
      const fileId = id;
      const searchParams = request.nextUrl.searchParams;
      const inline = searchParams.get('inline') === 'true'; // For preview, use inline

      try {
        const fileService = new CoreFileService(tenantPrisma);
        
        // Önce dosyayı kontrol et
        const file = await tenantPrisma.coreFile.findUnique({
          where: { id: fileId },
        });

        if (!file) {
          return errorResponse('Not Found', 'File not found', 404);
        }

        // Public dosyalar için userId gerekmez
        const permissions = file.permissions as unknown as { isPublic?: boolean; read?: string[] };
        const isPublic = permissions?.isPublic === true;
        
        // Real-estate modülündeki apartment, property ve tenant dosyalarını otomatik olarak public kabul et
        // (Eski dosyalar için backward compatibility)
        const isRealEstateFile = file.module === 'real-estate' &&
          (file.entityType === 'apartment' || file.entityType === 'property' || file.entityType === 'tenant');
        
        const shouldAllowAccess = isPublic || isRealEstateFile;

        if (!shouldAllowAccess) {
          // Public değilse ve real-estate görseli değilse userId gerekli
          if (!userId) {
            return errorResponse('Unauthorized', 'User ID is required for private files', 401);
          }
          
          // İzin kontrolü
          const hasAccess = await fileService.checkFileAccess(fileId, userId, 'read');
          if (!hasAccess) {
            return errorResponse('Forbidden', 'Unauthorized: No permission to download this file', 403);
          }
        }

        // Dosyayı oku
        const fileBuffer = await fs.readFile(file.fullPath);

        // accessedAt güncelle
        await tenantPrisma.coreFile.update({
          where: { id: fileId },
          data: { accessedAt: new Date() },
        });

        // Response döndür
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': file.mimeType,
            'Content-Disposition': inline 
              ? `inline; filename="${file.originalName}"` 
              : `attachment; filename="${file.originalName}"`,
            'Content-Length': file.size.toString(),
            'Cache-Control': 'public, max-age=3600',
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to download file';
        return errorResponse('Internal Server Error', errorMessage, 500);
      }
    },
    { required: true, module: 'core-files' }
  );
}

