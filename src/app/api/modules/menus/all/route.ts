import { NextRequest, NextResponse } from 'next/server';
import { getAllModuleMenus, buildModuleMenuStructure } from '@/lib/modules/menuBuilder';

/**
 * GET /api/modules/menus/all
 * Returns all active module menus in a hierarchical structure
 */
export async function GET(request: NextRequest) {
  try {
    const moduleMenus = await getAllModuleMenus();
    const menuStructure = buildModuleMenuStructure(moduleMenus);

    return NextResponse.json({
      success: true,
      data: {
        menus: moduleMenus,
        structure: menuStructure,
      },
    });
  } catch (error) {
    console.error('Error fetching all module menus:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch menus',
      },
      { status: 500 }
    );
  }
}






