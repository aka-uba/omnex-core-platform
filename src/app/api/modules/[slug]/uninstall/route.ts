import { NextRequest, NextResponse } from 'next/server';
import { getModuleRegistry } from '@/lib/modules/registry';
import { rm } from 'fs/promises';
import { join } from 'path';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const registry = getModuleRegistry();

    const module = registry.getModule(slug);
    if (!module) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      );
    }

    // Remove module directory
    const modulePath = join(process.cwd(), 'src', 'modules', slug);
    try {
      await rm(modulePath, { recursive: true, force: true });
    } catch (error) {
      console.error('Error removing module directory:', error);
    }

    // Unregister module
    await registry.unregisterModule(slug);

    return NextResponse.json({
      success: true,
      message: 'Module uninstalled successfully',
    });
  } catch (error) {
    console.error('Error uninstalling module:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to uninstall module',
      },
      { status: 500 }
    );
  }
}






