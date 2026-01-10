import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/jwt';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import {
  BRANDING_FILENAMES,
  getCompanyBrandingDir,
  DEFAULT_BRANDING_DIR,
} from '@/lib/branding/config';
import { getTenantPrisma } from '@/lib/db/tenantDb';
import { getTenantFromRequest } from '@/lib/api/tenantContext';

type BrandingType = 'logo' | 'logoLight' | 'logoDark' | 'favicon' | 'pwaIcon';

/**
 * POST /api/branding/upload
 * Upload branding files (logo, favicon, pwaIcon)
 * Files are saved to company-specific directories: /branding/{companyId}/
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.valid || !authResult.payload) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Only SuperAdmin, Admin, TenantAdmin, CompanyAdmin can upload branding
    const userRole = authResult.payload.role;
    const allowedRoles = ['SuperAdmin', 'Admin', 'TenantAdmin', 'CompanyAdmin'];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ success: false, error: 'Only administrators can update branding' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const brandingType = (formData.get('type') as BrandingType) || 'logo';
    const companyIdFromForm = formData.get('companyId') as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Get company ID from user's context or form data
    let companyId = companyIdFromForm;

    if (!companyId) {
      // Try to get company ID from user's context
      try {
        const tenantContext = await getTenantFromRequest(request);
        if (tenantContext?.id) {
          const tenantPrisma = await getTenantPrisma(tenantContext.id);
          // Get user's company
          const user = await tenantPrisma.user.findUnique({
            where: { id: authResult.payload.userId },
            select: { companyId: true },
          });
          companyId = user?.companyId || null;
        }
      } catch {
        // If we can't get tenant context, continue without company ID
      }
    }

    // Validate file type based on branding type
    const allowedTypes: Record<BrandingType, string[]> = {
      logo: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      logoLight: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      logoDark: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
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
      return NextResponse.json({ success: false, error: `Only ${allowedFormats} files are allowed` }, { status: 400 });
    }

    // Validate file size (max 5MB for logos, 1MB for favicon/pwaIcon)
    const isLogoType = brandingType === 'logo' || brandingType === 'logoLight' || brandingType === 'logoDark';
    const maxSize = isLogoType ? 5 * 1024 * 1024 : 1 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: `File size must be less than ${isLogoType ? '5MB' : '1MB'}` }, { status: 400 });
    }

    // Determine branding directory based on company ID
    const brandingSubDir = companyId ? companyId : 'default';
    const brandingDir = join(process.cwd(), 'public', 'branding', brandingSubDir);

    // Create branding directory if not exists
    if (!existsSync(brandingDir)) {
      await mkdir(brandingDir, { recursive: true });
    }

    // Determine fixed filename based on type
    const fixedFilenames: Record<BrandingType, string> = {
      logo: BRANDING_FILENAMES.logo,
      logoLight: BRANDING_FILENAMES.logoLight,
      logoDark: BRANDING_FILENAMES.logoDark,
      favicon: BRANDING_FILENAMES.favicon,
      pwaIcon: BRANDING_FILENAMES.pwaIcon,
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
    const imageUrl = `${getCompanyBrandingDir(companyId)}/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        url: imageUrl,
        type: brandingType,
        companyId: companyId || null,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * GET /api/branding/upload
 * Check which branding files exist for a company
 * Query params: companyId (optional)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    let companyId = searchParams.get('companyId');

    // If no companyId provided, try to get from user's context
    if (!companyId) {
      try {
        const authResult = await verifyAuth(request);
        if (authResult.valid && authResult.payload) {
          const tenantContext = await getTenantFromRequest(request);
          if (tenantContext?.id) {
            const tenantPrisma = await getTenantPrisma(tenantContext.id);
            const user = await tenantPrisma.user.findUnique({
              where: { id: authResult.payload.userId },
              select: { companyId: true },
            });
            companyId = user?.companyId || null;
          }
        }
      } catch {
        // Continue without company ID
      }
    }

    // Check company directory first, then default
    const companyBrandingDir = companyId
      ? join(process.cwd(), 'public', 'branding', companyId)
      : null;
    const defaultBrandingDir = join(process.cwd(), 'public', 'branding', 'default');

    const checkExists = (type: BrandingType): { exists: boolean; url: string | null; isDefault: boolean } => {
      const filename = BRANDING_FILENAMES[type];

      // Check company directory first
      if (companyBrandingDir && existsSync(join(companyBrandingDir, filename))) {
        return {
          exists: true,
          url: `/branding/${companyId}/${filename}`,
          isDefault: false,
        };
      }

      // Check default directory
      if (existsSync(join(defaultBrandingDir, filename))) {
        return {
          exists: true,
          url: `${DEFAULT_BRANDING_DIR}/${filename}`,
          isDefault: true,
        };
      }

      return { exists: false, url: null, isDefault: false };
    };

    const result = {
      logo: checkExists('logo'),
      logoLight: checkExists('logoLight'),
      logoDark: checkExists('logoDark'),
      favicon: checkExists('favicon'),
      pwaIcon: checkExists('pwaIcon'),
      companyId: companyId || null,
    };

    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json({
      success: true,
      data: {
        logo: { exists: false, url: null, isDefault: false },
        logoLight: { exists: false, url: null, isDefault: false },
        logoDark: { exists: false, url: null, isDefault: false },
        favicon: { exists: false, url: null, isDefault: false },
        pwaIcon: { exists: false, url: null, isDefault: false },
        companyId: null,
      },
    });
  }
}

/**
 * DELETE /api/branding/upload
 * Delete a branding file from company directory
 * Query params: type (required), companyId (optional)
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.valid || !authResult.payload) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Only SuperAdmin, Admin, TenantAdmin, CompanyAdmin can delete branding
    const userRole = authResult.payload.role;
    const allowedRoles = ['SuperAdmin', 'Admin', 'TenantAdmin', 'CompanyAdmin'];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ success: false, error: 'Only administrators can delete branding' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const brandingType = searchParams.get('type') as BrandingType;
    let companyId = searchParams.get('companyId');

    if (!brandingType || !['logo', 'logoLight', 'logoDark', 'favicon', 'pwaIcon'].includes(brandingType)) {
      return NextResponse.json({ success: false, error: 'Type must be logo, logoLight, logoDark, favicon, or pwaIcon' }, { status: 400 });
    }

    // If no companyId provided, try to get from user's context
    if (!companyId) {
      try {
        const tenantContext = await getTenantFromRequest(request);
        if (tenantContext?.id) {
          const tenantPrisma = await getTenantPrisma(tenantContext.id);
          const user = await tenantPrisma.user.findUnique({
            where: { id: authResult.payload.userId },
            select: { companyId: true },
          });
          companyId = user?.companyId || null;
        }
      } catch {
        // Continue without company ID
      }
    }

    // Only delete from company directory, not default
    if (!companyId) {
      return NextResponse.json({ success: false, error: 'Cannot delete default branding files' }, { status: 400 });
    }

    const brandingDir = join(process.cwd(), 'public', 'branding', companyId);
    const filePath = join(brandingDir, BRANDING_FILENAMES[brandingType]);

    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    return NextResponse.json({ success: true, data: { deleted: true, companyId } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
