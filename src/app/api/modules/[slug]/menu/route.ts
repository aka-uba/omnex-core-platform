import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { verifyAuth } from '@/lib/auth/jwt';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  return withTenant<any>(
    request,
    async (tenantPrisma) => {
      try {
        const { slug } = await context.params;
        const { searchParams } = new URL(request.url);
        const locale = (searchParams.get('locale') || 'tr') as 'tr' | 'en' | 'de' | 'ar';

        if (!slug) {
          return NextResponse.json({
            success: false,
            error: 'Module slug is required',
            message: 'Module slug is required',
          }, { status: 400 });
        }

        // Verify auth to get tenant context
        const authResult = await verifyAuth(request);
        if (!authResult.valid || !authResult.payload) {
          return NextResponse.json({
            success: false,
            error: 'Unauthorized',
            message: 'Unauthorized',
          }, { status: 401 });
        }

        const tenantId = authResult.payload.tenantId;

        // Find menu items for this module from the database
        // First, find all MenuItems that have moduleSlug matching this module
        // These are the child items under the module's parent menu item
        const moduleMenuItems = await tenantPrisma.menuItem.findMany({
          where: {
            moduleSlug: slug,
            visible: true,
            tenantId: tenantId || undefined,
          },
          include: {
            children: {
              where: { visible: true },
              orderBy: { order: 'asc' },
              include: {
                children: {
                  where: { visible: true },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
          orderBy: { order: 'asc' },
        });

        // Also find items where parentId matches a module group item
        // First find the module group items
        const moduleGroupItems = await tenantPrisma.menuItem.findMany({
          where: {
            moduleSlug: slug,
            parentId: null, // Top-level module group items
            tenantId: tenantId || undefined,
          },
          select: { id: true },
        });

        const moduleGroupIds = moduleGroupItems.map(item => item.id);

        // Find children of module group items
        let childItems: any[] = [];
        if (moduleGroupIds.length > 0) {
          childItems = await tenantPrisma.menuItem.findMany({
            where: {
              parentId: { in: moduleGroupIds },
              visible: true,
            },
            include: {
              children: {
                where: { visible: true },
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          });
        }

        // Convert database items to the expected format
        const convertToMenuFormat = (items: any[], level: number = 0): any[] => {
          return items.map(item => {
            const label = item.label as Record<string, string> || {};
            return {
              id: item.id,
              title: label[locale] || label['en'] || label['tr'] || 'Untitled',
              icon: item.icon || 'Circle',
              path: item.href,
              order: item.order,
              level,
              visible: item.visible,
              target: item.target || '_self',
              children: item.children && item.children.length > 0
                ? convertToMenuFormat(item.children, level + 1)
                : undefined,
            };
          });
        };

        // Use child items if found, otherwise use module items directly
        const itemsToConvert = childItems.length > 0 ? childItems : moduleMenuItems;
        const menuItems = convertToMenuFormat(itemsToConvert);

        // Flatten the hierarchical structure for display
        const flattenItems = (items: any[], level: number = 0): any[] => {
          const flattened: any[] = [];
          items.forEach(item => {
            flattened.push({ ...item, level });
            if (item.children && item.children.length > 0) {
              flattened.push(...flattenItems(item.children, level + 1));
            }
          });
          return flattened;
        };

        const flattenedItems = flattenItems(menuItems);

        return NextResponse.json({
          success: true,
          data: {
            main: {
              items: menuItems,
            },
          },
          flatItems: flattenedItems, // Also return flattened version
          isFromDatabase: true,
          moduleGroupIds,
        });
      } catch (error) {
        console.error('Error fetching module menu:', error);
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch menu',
          message: error instanceof Error ? error.message : 'Failed to fetch menu',
        }, { status: 500 });
      }
    },
    { required: true }
  );
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  return withTenant<any>(
    request,
    async (tenantPrisma) => {
      try {
        const { slug } = await context.params;
        const body = await request.json();

        if (!slug) {
          return NextResponse.json({
            success: false,
            error: 'Module slug is required',
            message: 'Module slug is required',
          }, { status: 400 });
        }

        // Verify auth
        const authResult = await verifyAuth(request);
        if (!authResult.valid || !authResult.payload) {
          return NextResponse.json({
            success: false,
            error: 'Unauthorized',
            message: 'Unauthorized',
          }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const locale = (searchParams.get('locale') || 'tr') as 'tr' | 'en' | 'de' | 'ar';

        // Get the items to update
        const items = body.main?.items || [];

        // Update each item in the database
        for (const item of items) {
          if (!item.id) continue;

          // Build the label object - preserve existing labels and update current locale
          const existingItem = await tenantPrisma.menuItem.findUnique({
            where: { id: item.id },
            select: { label: true },
          });

          const existingLabel = (existingItem?.label as Record<string, string>) || {};
          const updatedLabel = {
            ...existingLabel,
            [locale]: item.title,
          };

          await tenantPrisma.menuItem.update({
            where: { id: item.id },
            data: {
              label: updatedLabel,
              icon: item.icon || null,
              href: item.path,
              order: item.order,
              visible: item.visible !== false,
              target: item.target || '_self',
            },
          });
        }

        return NextResponse.json({
          success: true,
          message: 'Menu configuration saved successfully',
        });
      } catch (error) {
        console.error('Error saving module menu:', error);
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to save menu',
          message: error instanceof Error ? error.message : 'Failed to save menu',
        }, { status: 500 });
      }
    },
    { required: true }
  );
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  // Reset to default is not applicable when using database
  // Instead, this could potentially reset icon to default or similar
  return NextResponse.json({
    success: true,
    message: 'Reset functionality not available for database-backed menus. Use Menu Management page to modify menu items.',
  });
}
