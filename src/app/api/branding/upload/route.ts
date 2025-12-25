import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { verifyAuth } from '@/lib/auth/jwt';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync, readdirSync } from 'fs';
import { BRANDING_PATHS } from '@/lib/branding/config';

type BrandingType = 'logo' | 'favicon' | 'pwaIcon';

interface UploadResponse {
  url: string;
  type: BrandingType;
}

/**
 * POST /api/branding/upload
 * Upload branding files (logo, favicon, pwaIcon)
 * Files are saved with fixed names, overwriting existing files
 */
export async function POST(request: NextRequest): Promise<ApiResponse<UploadResponse>> {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.valid || !authResult.payload) {
      return errorResponse('Unauthorized', 'Authentication required', 401);
    }

    // Only SuperAdmin or Admin can upload branding
    const userRole = authResult.payload.role;
    if (userRole !== 'SuperAdmin' && userRole !== 'Admin') {
      return errorResponse('Forbidden', 'Only administrators can update branding', 403);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const brandingType = (formData.get('type') as BrandingType) || 'logo';

    if (!file) {
      return errorResponse('File required', 'No file provided', 400);
    }

    // Validate file type based on branding type
    const allowedTypes: Record<BrandingType, string[]> = {
      logo: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      favicon: ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/svg+xml', 'image/gif'],
      pwaIcon: ['image/png', 'image/svg+xml'],
    };

    // For .ico files, the type might be empty or application/octet-stream
    const isIcoFile = file.name.toLowerCase().endsWith('.ico');
    if (!isIcoFile && !allowedTypes[brandingType].includes(file.type)) {
      const allowedFormats = brandingType === 'favicon'
        ? 'ICO, PNG, SVG, GIF'
        : brandingType === 'pwaIcon'
          ? 'PNG, SVG'
          : 'JPEG, PNG, GIF, WEBP, SVG';
      return errorResponse('Invalid file type', `Only ${allowedFormats} files are allowed`, 400);
    }

    // Validate file size (max 5MB for logo, 1MB for favicon/pwaIcon)
    const maxSize = brandingType === 'logo' ? 5 * 1024 * 1024 : 1 * 1024 * 1024;
    if (file.size > maxSize) {
      return errorResponse('File too large', `File size must be less than ${brandingType === 'logo' ? '5MB' : '1MB'}`, 400);
    }

    // Create branding directory if not exists
    const brandingDir = join(process.cwd(), 'public', 'branding');
    if (!existsSync(brandingDir)) {
      await mkdir(brandingDir, { recursive: true });
    }

    // Determine fixed filename based on type
    const fixedFilenames: Record<BrandingType, string> = {
      logo: 'logo.png',
      favicon: 'favicon.ico',
      pwaIcon: 'pwa-icon.png',
    };

    const filename = fixedFilenames[brandingType];
    const filePath = join(brandingDir, filename);

    // Delete existing file if exists (to ensure clean overwrite)
    if (existsSync(filePath)) {
      try {
        await unlink(filePath);
      } catch {
        // Ignore deletion errors
      }
    }

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Generate URL
    const imageUrl = `${BRANDING_PATHS.directory}/${filename}`;

    return successResponse({
      url: imageUrl,
      type: brandingType,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    return errorResponse('Failed to upload branding', message, 500);
  }
}

/**
 * GET /api/branding/upload
 * Check which branding files exist
 */
export async function GET(): Promise<ApiResponse<Record<string, boolean>>> {
  try {
    const brandingDir = join(process.cwd(), 'public', 'branding');

    const exists = {
      logo: existsSync(join(brandingDir, 'logo.png')),
      favicon: existsSync(join(brandingDir, 'favicon.ico')),
      pwaIcon: existsSync(join(brandingDir, 'pwa-icon.png')),
    };

    return successResponse(exists);
  } catch {
    return successResponse({
      logo: false,
      favicon: false,
      pwaIcon: false,
    });
  }
}

/**
 * DELETE /api/branding/upload
 * Delete a branding file
 */
export async function DELETE(request: NextRequest): Promise<ApiResponse<{ deleted: boolean }>> {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.valid || !authResult.payload) {
      return errorResponse('Unauthorized', 'Authentication required', 401);
    }

    // Only SuperAdmin or Admin can delete branding
    const userRole = authResult.payload.role;
    if (userRole !== 'SuperAdmin' && userRole !== 'Admin') {
      return errorResponse('Forbidden', 'Only administrators can delete branding', 403);
    }

    const { searchParams } = new URL(request.url);
    const brandingType = searchParams.get('type') as BrandingType;

    if (!brandingType || !['logo', 'favicon', 'pwaIcon'].includes(brandingType)) {
      return errorResponse('Invalid type', 'Type must be logo, favicon, or pwaIcon', 400);
    }

    const fixedFilenames: Record<BrandingType, string> = {
      logo: 'logo.png',
      favicon: 'favicon.ico',
      pwaIcon: 'pwa-icon.png',
    };

    const brandingDir = join(process.cwd(), 'public', 'branding');
    const filePath = join(brandingDir, fixedFilenames[brandingType]);

    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    return successResponse({ deleted: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    return errorResponse('Failed to delete branding', message, 500);
  }
}
