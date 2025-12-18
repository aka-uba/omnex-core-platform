import { NextRequest, NextResponse } from 'next/server';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { getModuleRegistry } from '@/lib/modules/registry';
import AdmZip from 'adm-zip';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('module') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.zip')) {
      return NextResponse.json(
        { success: false, error: 'Only .zip files are accepted' },
        { status: 400 }
      );
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 50MB' },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract ZIP
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();

    // Find module.json
    const manifestEntry = zipEntries.find((entry) => entry.entryName === 'module.json');
    if (!manifestEntry) {
      return NextResponse.json(
        { success: false, error: 'module.json not found in the root of the archive' },
        { status: 400 }
      );
    }

    // Parse manifest
    const manifestContent = manifestEntry.getData().toString('utf-8');
    const manifest = JSON.parse(manifestContent);

    // Validate manifest
    if (!manifest.name || !manifest.slug || !manifest.version) {
      return NextResponse.json(
        { success: false, error: 'Invalid module.json: name, slug, and version are required' },
        { status: 400 }
      );
    }

    // Create module directory
    const modulesPath = join(process.cwd(), 'src', 'modules', manifest.slug);
    if (!existsSync(modulesPath)) {
      await mkdir(modulesPath, { recursive: true });
    }

    // Extract all files
    zip.extractAllTo(modulesPath, true);

    // Register module
    const registry = getModuleRegistry();
    const moduleRecord = await registry.registerModule(manifest, modulesPath);

    return NextResponse.json({
      success: true,
      module: {
        ...moduleRecord,
        installedAt: moduleRecord.installedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error uploading module:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload module',
      },
      { status: 500 }
    );
  }
}






