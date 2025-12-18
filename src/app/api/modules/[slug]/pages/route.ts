import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface PageInfo {
  path: string;
  title: string;
  order: number;
  icon?: string;
}

/**
 * Get page title from translation file or generate from path
 */
async function getPageTitle(
  moduleSlug: string,
  routePath: string,
  locale: string = 'tr'
): Promise<string> {
  // Try to load translation file
  const translationPath = join(
    process.cwd(),
    'src/locales/modules',
    moduleSlug,
    `${locale}.json`
  );

  if (existsSync(translationPath)) {
    try {
      const translationContent = await readFile(translationPath, 'utf-8');
      const translations = JSON.parse(translationContent);

      // Try to find page title in translations
      // Common patterns: pages.{pageName}.title, {pageName}.title, menu.items[].title
      const pathParts = routePath.split('/').filter(Boolean);
      
      if (pathParts.length === 0) {
        // Main module page
        return translations.title || translations.menu?.label || moduleSlug;
      }

      const pageName = pathParts[pathParts.length - 1];
      
      // Try different translation keys
      const possibleKeys = [
        `pages.${pageName}.title`,
        `${pageName}.title`,
        `menu.items.${pageName}`,
        `menu.${pageName}`,
        `menu.${pageName}.title`,
      ];
      
      // For HR module, check specific keys
      if (moduleSlug === 'hr') {
        if (pageName === 'employees') possibleKeys.unshift('employees.title');
        if (pageName === 'leaves') possibleKeys.unshift('leaves.title');
        if (pageName === 'payrolls') possibleKeys.unshift('payrolls.title');
      }
      
      // For maintenance module
      if (moduleSlug === 'maintenance') {
        if (pageName === 'dashboard') possibleKeys.unshift('dashboard.title');
        if (pageName === 'records') possibleKeys.unshift('title');
        if (pageName === 'calendar') possibleKeys.unshift('calendar.title');
      }

      for (const key of possibleKeys) {
        const keys = key.split('.');
        let value: any = translations;
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k];
          } else {
            value = null;
            break;
          }
        }
        if (typeof value === 'string' && value) {
          return value;
        }
      }

      // Check menu items
      if (translations.menu?.items) {
        for (const item of translations.menu.items) {
          if (item.path && item.path.includes(pageName)) {
            return item.title || item.label || pageName;
          }
        }
      }
    } catch (error) {
      console.error(`Error reading translation file for ${moduleSlug}:`, error);
    }
  }

  // Fallback: Generate title from path
  const pathParts = routePath.split('/').filter(Boolean);
  if (pathParts.length === 0) {
    return 'Dashboard';
  }

  const pageName = pathParts[pathParts.length - 1];
  
  // Skip special pages that shouldn't be in menu
  if (!pageName || ['create', 'edit', 'settings', 'all'].includes(pageName.toLowerCase())) {
    return '';
  }

  // Convert kebab-case to Title Case
  return pageName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Check if a directory contains a page.tsx (list page)
 * Function removed - unused
 */
// async function hasListPage(dirPath: string): Promise<boolean> {
//   const pagePath = join(dirPath, 'page.tsx');
//   return existsSync(pagePath);
// }

/**
 * Recursively scan module pages directory
 */
async function scanModulePages(
  basePath: string,
  moduleSlug: string,
  currentPath: string = '',
  order: number = 0,
  locale: string = 'tr'
): Promise<PageInfo[]> {
  const pages: PageInfo[] = [];
  const fullPath = join(basePath, currentPath);

  if (!existsSync(fullPath)) {
    return pages;
  }

  try {
    const entries = await readdir(fullPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = join(currentPath, entry.name);

      // Skip node_modules, .next, and other hidden/system directories
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }

      // Skip dynamic route directories like [id], [slug]
      if (entry.name.startsWith('[') && entry.name.endsWith(']')) {
        // Check if parent directory has a page.tsx (list page)
        const parentPagePath = join(fullPath, 'page.tsx');
        if (existsSync(parentPagePath)) {
          // This is a list page with detail routes, include the parent (list page)
          const routePath = currentPath.replace(/\\/g, '/');
          const fullRoute = routePath ? `/${moduleSlug}/${routePath}` : `/${moduleSlug}`;
          const title = await getPageTitle(moduleSlug, routePath, locale);
          
          if (title && title.trim() !== '') {
            // Check if this page is already added
            const existingPage = pages.find(p => p.path === fullRoute);
            if (!existingPage) {
              pages.push({
                path: fullRoute,
                title,
                order: order + pages.length,
              });
            }
          }
        }
        continue; // Skip scanning inside dynamic routes
      }

      if (entry.isDirectory()) {
        // Skip special directories
        if (['create', 'edit', 'settings', 'all'].includes(entry.name.toLowerCase())) {
          continue;
        }
        
        // Check if this directory has a page.tsx
        const dirPagePath = join(fullPath, entry.name, 'page.tsx');
        if (existsSync(dirPagePath)) {
          const routePath = entryPath.replace(/\\/g, '/');
          const fullRoute = `/${moduleSlug}/${routePath}`;
          const title = await getPageTitle(moduleSlug, routePath, locale);
          
          if (title && title.trim() !== '') {
            pages.push({
              path: fullRoute,
              title,
              order: order + pages.length,
            });
          }
        }
        
        // Recursively scan subdirectories (but skip if it's a dynamic route)
        const subPages = await scanModulePages(basePath, moduleSlug, entryPath, order + pages.length, locale);
        pages.push(...subPages);
      } else if (entry.isFile() && entry.name === 'page.tsx') {
        // Found a page.tsx file at root level
        const routePath = currentPath.replace(/\\/g, '/');
        const pathParts = routePath.split('/').filter(Boolean);
        const pageName = pathParts.length > 0 ? pathParts[pathParts.length - 1] : '';
        
        // Skip special pages that shouldn't be in menu
        if (pageName && ['create', 'edit', 'settings', 'all'].includes(pageName.toLowerCase())) {
          continue;
        }
        
        const fullRoute = routePath ? `/${moduleSlug}/${routePath}` : `/${moduleSlug}`;
        const title = await getPageTitle(moduleSlug, routePath, locale);
        
        if (title && title.trim() !== '') {
          // Check if this page is already added
          const existingPage = pages.find(p => p.path === fullRoute);
          if (!existingPage) {
            pages.push({
              path: fullRoute,
              title,
              order: order + pages.length,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning module pages at ${fullPath}:`, error);
  }

  return pages;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale');
    
    // Support both /modules/{slug} and /{slug} routes
    const appModulesPath = join(process.cwd(), 'src/app/[locale]/modules', slug);
    
    if (!existsSync(appModulesPath)) {
      return NextResponse.json({
        success: true,
        pages: [],
      });
    }
    
    const pages = await scanModulePages(appModulesPath, slug, '', 0, locale || undefined);
    
    // Remove duplicates and filter out empty titles
    const uniquePages = pages.filter((page, index, self) => {
      return page.title && 
             index === self.findIndex((p) => p.path === page.path);
    });
    
    // Sort by order and path
    uniquePages.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.path.localeCompare(b.path);
    });

    return NextResponse.json({
      success: true,
      pages: uniquePages,
    });
  } catch (error) {
    console.error('Error fetching module pages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch module pages' },
      { status: 500 }
    );
  }
}
