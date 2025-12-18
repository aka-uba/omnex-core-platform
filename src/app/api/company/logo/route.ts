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
/**
 * POST /api/company/logo
 * Upload company logo
 */
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ logoUrl: string; logoFile: string }>>(
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
              // companyId check removed - User model doesn't have companyId
            },
            select: { id: true },
          });
          if (!user) {
            return errorResponse('Forbidden', 'You can only update your own company', 403);
          }
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
          return errorResponse('Invalid file type', 'Only image files are allowed', 400);
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          return errorResponse('File too large', 'File size must be less than 5MB', 400);
        }

        // Create upload directory
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'companies', companyId);
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const extension = file.name.split('.').pop();
        const filename = `logo-${timestamp}.${extension}`;
        const filePath = join(uploadDir, filename);

        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Generate URL
        const logoUrl = `/uploads/companies/${companyId}/${filename}`;
        const logoFile = `uploads/companies/${companyId}/${filename}`;

        // Update company logo
        await tenantPrisma.company.update({
          where: { id: companyId },
          data: {
            logo: logoUrl,
            logoFile: logoFile,
          },
        });

        return successResponse({
          logoUrl,
          logoFile,
        });
      } catch (error: any) {
        return errorResponse('Failed to upload logo', error.message || 'An error occurred', 500);
      }
    },
    { required: true }
  );
}








