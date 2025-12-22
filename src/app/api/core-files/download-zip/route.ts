// Core Files API Route - Download Multiple Files as ZIP
// POST /api/core-files/download-zip - Download multiple files as ZIP

import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { errorResponse } from '@/lib/api/errorHandler';
import { verifyAuth } from '@/lib/auth/jwt';
import { promises as fs } from 'fs';
import JSZip from 'jszip';

// POST /api/core-files/download-zip - Download multiple files as ZIP
export async function POST(request: NextRequest) {
  return withTenant(
    request,
    async (tenantPrisma) => {
      // Get user from JWT token or header
      const authResult = await verifyAuth(request);
      const userId = authResult.valid && authResult.payload
        ? authResult.payload.userId
        : request.headers.get('x-user-id');

      try {
        const body = await request.json();
        const { fileIds, filename = 'files.zip' } = body;

        if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
          return errorResponse('Bad Request', 'fileIds array is required', 400);
        }

        // Limit the number of files
        if (fileIds.length > 100) {
          return errorResponse('Bad Request', 'Maximum 100 files allowed per download', 400);
        }

        // Get all files
        const files = await tenantPrisma.coreFile.findMany({
          where: { id: { in: fileIds } },
        });

        if (files.length === 0) {
          return errorResponse('Not Found', 'No files found', 404);
        }

        // Create ZIP
        const zip = new JSZip();
        const filenameCount: Record<string, number> = {};

        for (const file of files) {
          try {
            // Check access for non-public files
            const permissions = file.permissions as unknown as { isPublic?: boolean };
            const isPublic = permissions?.isPublic === true;
            const isRealEstateFile = file.module === 'real-estate' &&
              (file.entityType === 'apartment' || file.entityType === 'property' || file.entityType === 'tenant');

            if (!isPublic && !isRealEstateFile && !userId) {
              continue; // Skip files without access
            }

            // Read file
            const fileBuffer = await fs.readFile(file.fullPath);

            // Handle duplicate filenames
            let finalFilename = file.originalName;
            if (filenameCount[file.originalName]) {
              const ext = file.originalName.lastIndexOf('.');
              const name = ext > 0 ? file.originalName.substring(0, ext) : file.originalName;
              const extension = ext > 0 ? file.originalName.substring(ext) : '';
              finalFilename = `${name}_${filenameCount[file.originalName]}${extension}`;
            }
            filenameCount[file.originalName] = (filenameCount[file.originalName] || 0) + 1;

            zip.file(finalFilename, fileBuffer);
          } catch (err) {
            console.error(`Error adding file ${file.id} to ZIP:`, err);
            // Continue with other files
          }
        }

        // Check if any files were added
        if (Object.keys(zip.files).length === 0) {
          return errorResponse('Bad Request', 'No accessible files found', 400);
        }

        // Generate ZIP
        const zipBuffer = await zip.generateAsync({
          type: 'nodebuffer',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 },
        });

        // Return ZIP file
        return new NextResponse(zipBuffer, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': zipBuffer.length.toString(),
          },
        });
      } catch (error) {
        console.error('Error creating ZIP:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to create ZIP file';
        return errorResponse('Internal Server Error', errorMessage, 500);
      }
    },
    { required: true, module: 'core-files' }
  );
}
