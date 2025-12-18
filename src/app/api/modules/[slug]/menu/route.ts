import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const { searchParams } = new URL(request.url);
    const locale = (searchParams.get('locale')) as 'tr' | 'en' | 'de' | 'ar';

    if (!slug) {
      return NextResponse.json(
        { error: 'Module slug is required' },
        { status: 400 }
      );
    }

    // Try to load saved menu first
    const savedMenuPath = path.join(
      process.cwd(),
      'data',
      'module-menus',
      `${slug}.json`
    );

    if (fs.existsSync(savedMenuPath)) {
      const savedContent = fs.readFileSync(savedMenuPath, 'utf-8');
      const savedMenu = JSON.parse(savedContent);
      return NextResponse.json({
        success: true,
        data: savedMenu,
        isCustom: true,
      });
    }

    // If no saved menu, get hierarchical pages from available-pages
    try {
      // Import and use scanModulePages directly
      const { scanModulePages } = await import('@/app/api/menu-management/available-pages/route');
      
      // Get locale from query params
      const categories = await scanModulePages(locale);
      
      // Find module category
      const moduleCategory = categories.find(
        (cat: any) => cat.id === `module-${slug}`
      );
      
      if (moduleCategory && moduleCategory.pages) {
        // Try to load config to get order values
        const configOrderMap: Record<string, number> = {};
        try {
          const configPath = path.join(
            process.cwd(),
            'src',
            'modules',
            slug,
            'module.config.yaml'
          );
          if (fs.existsSync(configPath)) {
            const configContent = fs.readFileSync(configPath, 'utf-8');
            const config = yaml.load(configContent) as any;
            if (config.menu?.main?.items) {
              config.menu.main.items.forEach((item: any) => {
                if (item.path) {
                  configOrderMap[item.path] = item.order || 999;
                }
              });
            }
          }
        } catch (error) {
          // Ignore config loading errors
        }
        
        // Build hierarchical menu structure from flat pages with parentId
        const buildMenuItems = (pages: any[], parentId?: string, level = 0, parentOrder?: number): any[] => {
          const items: any[] = [];
          
          pages.forEach((page, index) => {
            // Only include pages that match the parent relationship
            const isChild = parentId ? page.parentId === parentId : !page.parentId;
            
            if (isChild) {
              // Get order from config if available
              let order = configOrderMap[page.href];
              
              // If no order in config and this is a child, use parent's order + small offset
              if (order === undefined) {
                if (parentOrder !== undefined && level > 0) {
                  // Child items: use parent order + 0.01 * index to keep them together
                  order = parentOrder + 0.01 * (index + 1);
                } else {
                  // Root items: use index + 1
                  order = index + 1;
                }
              }
              
              const item = {
                id: page.id,
                title: page.label,
                icon: page.icon || 'Circle',
                path: page.href,
                order: order,
                level,
                children: buildMenuItems(pages, page.id, level + 1, order),
              };
              items.push(item);
            }
          });
          
          // Sort items by order
          items.sort((a, b) => {
            const orderA = typeof a.order === 'number' ? a.order : 999;
            const orderB = typeof b.order === 'number' ? b.order : 999;
            return orderA - orderB;
          });
          
          return items;
        };
        
        const hierarchicalItems = buildMenuItems(moduleCategory.pages);
        
        return NextResponse.json({
          success: true,
          data: {
            main: {
              items: hierarchicalItems,
            },
          },
          isCustom: false,
        });
      }
    } catch (error) {
      // Fallback to config file if available-pages fails
      console.error('Error loading from available-pages:', error);
    }

    // Fallback: If no saved menu and available-pages API failed, load from module.config.yaml
    const configPath = path.join(
      process.cwd(),
      'src',
      'modules',
      slug,
      'module.config.yaml'
    );

    if (!fs.existsSync(configPath)) {
      return NextResponse.json(
        { error: 'Module configuration not found' },
        { status: 404 }
      );
    }

    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = yaml.load(configContent) as any;

    // Extract menu from config
    const menu = config.menu || {};
    
    // Sort menu items by order if they exist
    if (menu.main && menu.main.items && Array.isArray(menu.main.items)) {
      menu.main.items.sort((a: any, b: any) => {
        const orderA = typeof a.order === 'number' ? a.order : 999;
        const orderB = typeof b.order === 'number' ? b.order : 999;
        return orderA - orderB;
      });
    }

    return NextResponse.json({
      success: true,
      data: menu,
      isCustom: false,
    });
  } catch (error) {
    console.error('Error fetching module menu:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch menu',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await request.json();

    if (!slug) {
      return NextResponse.json(
        { error: 'Module slug is required' },
        { status: 400 }
      );
    }

    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data', 'module-menus');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Save menu to JSON file
    const menuPath = path.join(dataDir, `${slug}.json`);
    fs.writeFileSync(menuPath, JSON.stringify(body, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Menu configuration saved successfully',
      data: body,
    });
  } catch (error) {
    console.error('Error saving module menu:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save menu',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Module slug is required' },
        { status: 400 }
      );
    }

    // Delete saved menu file to reset to default
    const savedMenuPath = path.join(
      process.cwd(),
      'data',
      'module-menus',
      `${slug}.json`
    );

    if (fs.existsSync(savedMenuPath)) {
      fs.unlinkSync(savedMenuPath);
    }

    return NextResponse.json({
      success: true,
      message: 'Menu reset to default successfully',
    });
  } catch (error) {
    console.error('Error resetting module menu:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset menu',
      },
      { status: 500 }
    );
  }
}

