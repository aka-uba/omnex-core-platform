import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/jwt';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { BRANDING_PATHS } from '@/lib/branding/config';

type BrandingType = 'logo' | 'logoLight' | 'logoDark' | 'favicon' | 'pwaIcon';

/**
 * POST /api/branding/upload
 * Upload branding files (logo, favicon, pwaIcon)
 * Files are saved with fixed names, overwriting existing files
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.valid || !authResult.payload) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Only SuperAdmin or Admin can upload branding
    const userRole = authResult.payload.role;
    if (userRole !== 'SuperAdmin' && userRole !== 'Admin') {
      return NextResponse.json({ success: false, error: 'Only administrators can update branding' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const brandingType = (formData.get('type') as BrandingType) || 'logo';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
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

    // Create branding directory if not exists
    const brandingDir = join(process.cwd(), 'public', 'branding');
    if (!existsSync(brandingDir)) {
      await mkdir(brandingDir, { recursive: true });
    }

    // Determine fixed filename based on type
    const fixedFilenames: Record<BrandingType, string> = {
      logo: 'logo.png',
      logoLight: 'logo-light.png',
      logoDark: 'logo-dark.png',
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

    return NextResponse.json({
      success: true,
      data: {
        url: imageUrl,
        type: brandingType,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * GET /api/branding/upload
 * Check which branding files exist
 */
export async function GET(): Promise<NextResponse> {
  try {
    const brandingDir = join(process.cwd(), 'public', 'branding');

    const exists = {
      logo: existsSync(join(brandingDir, 'logo.png')),
      logoLight: existsSync(join(brandingDir, 'logo-light.png')),
      logoDark: existsSync(join(brandingDir, 'logo-dark.png')),
      favicon: existsSync(join(brandingDir, 'favicon.ico')),
      pwaIcon: existsSync(join(brandingDir, 'pwa-icon.png')),
    };

    return NextResponse.json({ success: true, data: exists });
  } catch {
    return NextResponse.json({
      success: true,
      data: {
        logo: false,
        logoLight: false,
        logoDark: false,
        favicon: false,
        pwaIcon: false,
      },
    });
  }
}

/**
 * DELETE /api/branding/upload
 * Delete a branding file
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.valid || !authResult.payload) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    // Only SuperAdmin or Admin can delete branding
    const userRole = authResult.payload.role;
    if (userRole !== 'SuperAdmin' && userRole !== 'Admin') {
      return NextResponse.json({ success: false, error: 'Only administrators can delete branding' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const brandingType = searchParams.get('type') as BrandingType;

    if (!brandingType || !['logo', 'logoLight', 'logoDark', 'favicon', 'pwaIcon'].includes(brandingType)) {
      return NextResponse.json({ success: false, error: 'Type must be logo, logoLight, logoDark, favicon, or pwaIcon' }, { status: 400 });
    }

    const fixedFilenames: Record<BrandingType, string> = {
      logo: 'logo.png',
      logoLight: 'logo-light.png',
      logoDark: 'logo-dark.png',
      favicon: 'favicon.ico',
      pwaIcon: 'pwa-icon.png',
    };

    const brandingDir = join(process.cwd(), 'public', 'branding');
    const filePath = join(brandingDir, fixedFilenames[brandingType]);

    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
