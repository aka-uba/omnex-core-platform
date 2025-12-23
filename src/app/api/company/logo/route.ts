import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromBody } from '@/lib/api/companyContext';
import { verifyAuth } from '@/lib/auth/jwt';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

type ImageType = 'logo' | 'favicon' | 'pwaIcon';

interface UploadResponse {
  logoUrl?: string;
  logoFile?: string;
  faviconUrl?: string;
  faviconFile?: string;
  pwaIconUrl?: string;
  pwaIconFile?: string;
}

/**
 * POST /api/company/logo
 * Upload company logo, favicon, or PWA icon
 */
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<UploadResponse>>(
    request,
    async (tenantPrisma) => {
      try {
        const authResult = await verifyAuth(request);
        if (!authResult.valid || !authResult.payload) {
          return errorResponse('Unauthorized', 'Authentication required', 401);
        }

        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
          return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const imageType = (formData.get('type') as ImageType) || 'logo';
        const companyIdFromForm = formData.get('companyId') as string | null;
        const companyId = companyIdFromForm || (await getCompanyIdFromBody({ companyId: companyIdFromForm }, tenantPrisma)) || undefined;

        if (!file) {
          return errorResponse('File required', 'No file provided', 400);
        }

        if (!companyId) {
          return errorResponse('Company not found', 'No company found for this tenant', 404);
        }

        // Check if user has permission
        const userRole = authResult.payload.role;
        if (userRole !== 'SuperAdmin') {
          // For non-SuperAdmin users, verify they belong to the company
          const user = await tenantPrisma.user.findFirst({
            where: {
              id: authResult.payload.userId,
            },
            select: { id: true },
          });
          if (!user) {
            return errorResponse('Forbidden', 'You can only update your own company', 403);
          }
        }

        // Validate file type based on image type
        const allowedTypes: Record<ImageType, string[]> = {
          logo: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
          favicon: ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/svg+xml', 'image/gif'],
          pwaIcon: ['image/png', 'image/svg+xml'],
        };

        // For .ico files, the type might be empty or application/octet-stream
        const isIcoFile = file.name.toLowerCase().endsWith('.ico');
        if (!isIcoFile && !allowedTypes[imageType].includes(file.type)) {
          return errorResponse('Invalid file type', `Only ${imageType === 'favicon' ? 'ICO, PNG, SVG, GIF' : imageType === 'pwaIcon' ? 'PNG, SVG' : 'image'} files are allowed`, 400);
        }

        // Validate file size (max 5MB for logo, 1MB for favicon/pwaIcon)
        const maxSize = imageType === 'logo' ? 5 * 1024 * 1024 : 1 * 1024 * 1024;
        if (file.size > maxSize) {
          return errorResponse('File too large', `File size must be less than ${imageType === 'logo' ? '5MB' : '1MB'}`, 400);
        }

        // Create upload directory
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'companies', companyId);
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const extension = file.name.split('.').pop();
        const filename = `${imageType}-${timestamp}.${extension}`;
        const filePath = join(uploadDir, filename);

        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Generate URL
        const imageUrl = `/uploads/companies/${companyId}/${filename}`;
        const imageFile = `uploads/companies/${companyId}/${filename}`;

        // Update company based on image type
        const updateData: Record<string, string> = {};
        if (imageType === 'logo') {
          updateData.logo = imageUrl;
          updateData.logoFile = imageFile;
        } else if (imageType === 'favicon') {
          updateData.favicon = imageUrl;
          updateData.faviconFile = imageFile;
        } else if (imageType === 'pwaIcon') {
          updateData.pwaIcon = imageUrl;
          updateData.pwaIconFile = imageFile;
        }

        await tenantPrisma.company.update({
          where: { id: companyId },
          data: updateData,
        });

        // Return response based on image type
        const response: UploadResponse = {};
        if (imageType === 'logo') {
          response.logoUrl = imageUrl;
          response.logoFile = imageFile;
        } else if (imageType === 'favicon') {
          response.faviconUrl = imageUrl;
          response.faviconFile = imageFile;
        } else if (imageType === 'pwaIcon') {
          response.pwaIconUrl = imageUrl;
          response.pwaIconFile = imageFile;
        }

        return successResponse(response);
      } catch (error: any) {
        return errorResponse('Failed to upload image', error.message || 'An error occurred', 500);
      }
    },
    { required: true }
  );
}








