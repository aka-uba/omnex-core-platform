/**
 * Menu Pages Checker API
 *
 * GET /api/menu-management/check-pages
 *
 * Bu endpoint menülerdeki href değerlerini kontrol eder ve
 * [locale] klasöründe karşılık gelen sayfaların olup olmadığını kontrol eder.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/jwt';
import { withTenant } from '@/lib/api/withTenant';
import fs from 'fs';
import path from 'path';

interface MenuItemCheck {
  id: string;
  label: string;
  href: string;
  menuName: string;
  menuId: string;
  exists: boolean;
  filePath?: string;
  expectedPath?: string;
}

export async function GET(request: NextRequest) {
  // Verify authentication first
  const authResult = await verifyAuth(request);
  if (!authResult.valid || !authResult.payload) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return withTenant(request, async (prisma) => {
    const appLocalePath = path.join(process.cwd(), 'src/app/[locale]');
    const results: MenuItemCheck[] = [];

    // Tüm aktif menüleri ve item'larını getir
    const menus = await prisma.menu.findMany({
      where: {
        isActive: true,
      },
      include: {
        items: {
          where: {
            visible: true,
          },
          include: {
            children: {
              where: {
                visible: true,
              },
              include: {
                children: {
                  where: {
                    visible: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Recursive function to check all menu items
    function checkMenuItem(item: any, menuName: string, menuId: string, locale: string = 'tr') {
      const href = item.href;

      // Skip dynamic routes like [id], [slug]
      if (href.includes('[') && href.includes(']')) {
        return;
      }

      // Remove locale prefix if exists (e.g., /tr/dashboard -> /dashboard)
      let cleanHref = href;
      if (href.startsWith(`/${locale}/`)) {
        cleanHref = href.replace(`/${locale}`, '');
      } else if (href.startsWith(`/${locale}`)) {
        cleanHref = href.replace(`/${locale}`, '');
      }

      // Ensure href starts with /
      if (!cleanHref.startsWith('/')) {
        cleanHref = `/${cleanHref}`;
      }

      // Check if page exists
      let pagePath: string | undefined;
      let exists = false;
      const expectedPath = path.join(appLocalePath, cleanHref.startsWith('/') ? cleanHref.slice(1) : cleanHref, 'page.tsx');

      // Remove leading slash for path construction
      const relativePath = cleanHref.startsWith('/') ? cleanHref.slice(1) : cleanHref;

      // Check for page.tsx
      const pageFilePath = path.join(appLocalePath, relativePath, 'page.tsx');
      if (fs.existsSync(pageFilePath)) {
        exists = true;
        pagePath = pageFilePath;
      } else {
        // Check if it's a root page (e.g., /dashboard -> [locale]/dashboard/page.tsx)
        const rootPagePath = path.join(appLocalePath, relativePath === '' ? 'page.tsx' : `${relativePath}/page.tsx`);
        if (fs.existsSync(rootPagePath)) {
          exists = true;
          pagePath = rootPagePath;
        }
      }

      // Get label (handle JSON format)
      let label = 'Unknown';
      if (typeof item.label === 'string') {
        label = item.label;
      } else if (typeof item.label === 'object' && item.label !== null) {
        label = item.label[locale] || item.label['tr'] || item.label['en'] || JSON.stringify(item.label);
      }

      results.push({
        id: item.id,
        label,
        href: item.href,
        menuName,
        menuId,
        exists,
        ...(pagePath ? { filePath: pagePath } : {}),
        ...(expectedPath ? { expectedPath } : {}),
      });

      // Check children recursively
      if (item.children && item.children.length > 0) {
        item.children.forEach((child: any) => {
          checkMenuItem(child, menuName, menuId, locale);
        });
      }
    }

    // Process all menus
    menus.forEach((menu) => {
      menu.items.forEach((item) => {
        // Only check root items (parentId is null)
        if (!item.parentId) {
          checkMenuItem(item, menu.name, menu.id, menu.locale);
        }
      });
    });

    // Calculate statistics
    const existing = results.filter(r => r.exists);
    const missing = results.filter(r => !r.exists);

    // Group missing pages by menu
    const groupedByMenu = missing.reduce((acc, item) => {
      if (!acc[item.menuName]) {
        acc[item.menuName] = [];
      }
      if (acc[item.menuName]) {
        acc[item.menuName]?.push(item);
      }
      return acc;
    }, {} as Record<string, MenuItemCheck[]>);

    // Summary by menu
    const menuSummary = results.reduce((acc, item) => {
      if (!acc[item.menuName]) {
        acc[item.menuName] = { total: 0, existing: 0, missing: 0, menuId: item.menuId };
      }
      if (acc[item.menuName]) {
        acc[item.menuName]!.total++;
        if (item.exists) {
          acc[item.menuName]!.existing++;
        } else {
          acc[item.menuName]!.missing++;
        }
      }
      return acc;
    }, {} as Record<string, { total: number; existing: number; missing: number; menuId: string }>);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: results.length,
          existing: existing.length,
          missing: missing.length,
        },
        missingPages: groupedByMenu,
        menuSummary: Object.entries(menuSummary).map(([menuName, stats]) => ({
          menuName,
          menuId: stats.menuId,
          total: stats.total,
          existing: stats.existing,
          missing: stats.missing,
          status: stats.missing === 0 ? 'ok' : 'warning',
        })),
        allResults: results,
      },
    });
  }, { required: true, module: 'menu-management' });
}
