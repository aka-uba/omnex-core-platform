import { NextResponse } from 'next/server';
import { ModuleLoader } from '@/lib/modules/loader';

export async function GET() {
  try {
    const loader = new ModuleLoader();
    const modules = await loader.loadAllModules();

    return NextResponse.json({
      success: true,
      modules: modules.map((m) => {
        // Get menu from module (could be undefined, null, or object)
        const menu = m.menu;
        const metadataMenu = m.metadata?.menu || menu;
        
        // Build response object explicitly to ensure menu is included
        const response: any = {
          id: m.id,
          name: m.name,
          slug: m.slug,
          version: m.version,
          description: m.description,
          icon: m.icon,
          author: m.author,
          status: m.status,
          path: m.path,
          settings: m.settings,
          installedAt: m.installedAt.toISOString(),
          activatedAt: m.activatedAt?.toISOString(),
          updatedAt: m.updatedAt?.toISOString(),
          category: m.category,
          tags: m.tags,
          dependencies: m.dependencies,
          error: m.error,
          // Explicitly include menu property (even if undefined)
          menu: menu !== undefined ? menu : null,
          metadata: {
            ...m.metadata,
            // Ensure menu is in metadata
            menu: metadataMenu !== undefined ? metadataMenu : null,
          },
        };
        
        return response;
      }),
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch modules' },
      { status: 500 }
    );
  }
}






