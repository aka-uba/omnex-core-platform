/**
 * Comprehensive Pages Analysis API
 * 
 * Scans ALL pages in the application:
 * - src/app/[locale] (all routes)
 * - src/app/[locale]/modules (module routes)
 * - Detects redirects, conflicts, duplicates
 * - Checks for 404 issues
 * - Groups by module and category
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
interface PageInfo {
  id: string;
  label: string;
  href: string;
  fullPath: string;
  relativePath: string;
  category: 'core' | 'module' | 'settings' | 'admin' | 'other';
  moduleSlug?: string;
  hasRedirect: boolean;
  redirectTarget?: string;
  isDynamic: boolean;
  dynamicParams?: string[];
  description?: string;
  conflicts?: string[]; // Array of conflicting page IDs
  duplicateOf?: string; // If this is a duplicate
}

interface PageCategory {
  id: string;
  label: string;
  icon: string;
  pages: PageInfo[];
  conflicts: number;
  duplicates: number;
}

interface ComprehensivePagesResult {
  categories: PageCategory[];
  allPages: PageInfo[];
  stats: {
    total: number;
    withRedirects: number;
    dynamic: number;
    conflicts: number;
    duplicates: number;
    byCategory: Record<string, number>;
  };
  conflicts: Array<{
    href: string;
    pages: PageInfo[];
  }>;
  duplicates: Array<{
    label: string;
    pages: PageInfo[];
  }>;
}

// Helper to check if page has redirect
async function checkPageForRedirect(filePath: string): Promise<{ hasRedirect: boolean; target?: string }> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Check for Next.js redirect
    const redirectMatch = content.match(/redirect\(['"`]([^'"`]+)['"`]\)/);
    if (redirectMatch) {
      return { hasRedirect: true, ...(redirectMatch[1] ? { target: redirectMatch[1] } : {}) };
    }
    
    // Check for permanentRedirect
    const permanentRedirectMatch = content.match(/permanentRedirect\(['"`]([^'"`]+)['"`]\)/);
    if (permanentRedirectMatch) {
      return { hasRedirect: true, ...(permanentRedirectMatch[1] ? { target: permanentRedirectMatch[1] } : {}) };
    }
    
    return { hasRedirect: false };
  } catch {
    return { hasRedirect: false };
  }
}

// Scan all pages in src/app/[locale]
async function scanAllPages(): Promise<PageInfo[]> {
  const pages: PageInfo[] = [];
  const basePath = path.join(process.cwd(), 'src/app/[locale]');
  
  const scanDirectory = async (
    dirPath: string,
    relativePath: string = '',
    category: PageInfo['category'] = 'other'
  ): Promise<void> => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        // Skip hidden, components, and special directories
        if (
          entry.name.startsWith('.') ||
          entry.name === 'components' ||
          entry.name === '__tests__' ||
          entry.name === 'yedek' ||
          entry.name === 'node_modules'
        ) {
          continue;
        }
        
        const fullPath = path.join(dirPath, entry.name);
        const newRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        
        if (entry.isDirectory()) {
          // Check if this directory has a page.tsx
          const pagePath = path.join(fullPath, 'page.tsx');
          
          try {
            await fs.access(pagePath);
            
            // Determine category
            let pageCategory = category;
            if (newRelativePath.startsWith('modules/')) {
              pageCategory = 'module';
            } else if (newRelativePath.startsWith('admin/')) {
              pageCategory = 'admin';
            } else if (newRelativePath.startsWith('settings')) {
              pageCategory = 'settings';
            } else if (['dashboard', 'users', 'companies', 'login', 'register'].includes(entry.name)) {
              pageCategory = 'core';
            }
            
            // Extract module slug if in modules directory
            const moduleMatch = newRelativePath.match(/^modules\/([^\/]+)/);
            const moduleSlug = moduleMatch ? moduleMatch[1] : undefined;
            
            // Check for dynamic routes
            const isDynamic = entry.name.startsWith('[') && entry.name.endsWith(']');
            const dynamicParams = isDynamic ? [entry.name.slice(1, -1)] : undefined;
            
            // Check for redirect
            const redirectInfo = await checkPageForRedirect(pagePath);
            
            // Generate href (remove [locale] prefix, add /)
            const href = `/${newRelativePath}`;
            
            // Generate unique ID
            const pageId = newRelativePath.replace(/\//g, '-').replace(/\[|\]/g, '');
            
            // Format label
            const label = formatLabel(entry.name);
            
            pages.push({
              id: pageId,
              label,
              href,
              fullPath: pagePath,
              relativePath: newRelativePath,
              category: pageCategory,
              ...(moduleSlug ? { moduleSlug } : {}),
              hasRedirect: redirectInfo.hasRedirect,
              ...(redirectInfo.target ? { redirectTarget: redirectInfo.target } : {}),
              isDynamic: !!isDynamic,
              ...(dynamicParams ? { dynamicParams } : {}),
            });
          } catch {
            // No page.tsx, continue scanning
          }
          
          // Recursively scan subdirectories
          await scanDirectory(fullPath, newRelativePath, category);
        }
      }
    } catch (error) {
      console.error(`Error scanning ${dirPath}:`, error);
    }
  };
  
  await scanDirectory(basePath);
  return pages;
}

// Detect conflicts (same href, different paths)
function detectConflicts(pages: PageInfo[]): void {
  const hrefMap = new Map<string, PageInfo[]>();
  
  // Group pages by href
  pages.forEach(page => {
    if (!hrefMap.has(page.href)) {
      hrefMap.set(page.href, []);
    }
    hrefMap.get(page.href)!.push(page);
  });
  
  // Mark conflicts
  hrefMap.forEach((pageList, href) => {
    if (pageList.length > 1) {
      const conflictIds = pageList.map(p => p.id);
      pageList.forEach(page => {
        page.conflicts = conflictIds.filter(id => id !== page.id);
      });
    }
  });
}

// Detect duplicates (same label, different paths)
function detectDuplicates(pages: PageInfo[]): void {
  const labelMap = new Map<string, PageInfo[]>();
  
  // Group pages by label
  pages.forEach(page => {
    const key = page.label.toLowerCase();
    if (!labelMap.has(key)) {
      labelMap.set(key, []);
    }
    labelMap.get(key)!.push(page);
  });
  
  // Mark duplicates
  labelMap.forEach((pageList, label) => {
    if (pageList.length > 1) {
      // Mark all but first as duplicates
      const firstPage = pageList[0];
      if (firstPage?.id) {
        for (let i = 1; i < pageList.length; i++) {
          const page = pageList[i];
          if (page) {
            page.duplicateOf = firstPage.id;
          }
        }
      }
    }
  });
}

function formatLabel(slug: string): string {
  // Remove brackets from dynamic routes
  const cleanSlug = slug.replace(/\[|\]/g, '');
  return cleanSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Organize pages into categories
function organizePages(pages: PageInfo[]): PageCategory[] {
  const categories = new Map<string, PageInfo[]>();
  
  pages.forEach(page => {
    const categoryId = page.category;
    if (!categories.has(categoryId)) {
      categories.set(categoryId, []);
    }
    categories.get(categoryId)!.push(page);
  });
  
  const categoryConfig: Record<string, { label: string; icon: string }> = {
    core: { label: 'Core Sayfalar', icon: 'Layout' },
    module: { label: 'Modül Sayfaları', icon: 'Apps' },
    settings: { label: 'Ayarlar', icon: 'Settings' },
    admin: { label: 'Admin Sayfaları', icon: 'Shield' },
    other: { label: 'Diğer Sayfalar', icon: 'File' },
  };
  
  const result: PageCategory[] = [];
  
  categories.forEach((pageList, categoryId) => {
    const config = categoryConfig[categoryId] || categoryConfig.other;
    const conflicts = pageList.filter(p => p.conflicts && p.conflicts.length > 0).length;
    const duplicates = pageList.filter(p => p.duplicateOf).length;
    
    result.push({
      id: categoryId,
      label: config?.label || categoryId,
      icon: config?.icon || 'IconFile',
      pages: pageList.sort((a, b) => a.href.localeCompare(b.href)),
      conflicts,
      duplicates,
    });
  });
  
  return result.sort((a, b) => {
    const order = ['core', 'module', 'settings', 'admin', 'other'];
    return order.indexOf(a.id) - order.indexOf(b.id);
  });
}

export async function GET(request: NextRequest) {
  try {
    // Scan all pages
    const allPages = await scanAllPages();
    
    // Detect conflicts and duplicates
    detectConflicts(allPages);
    detectDuplicates(allPages);
    
    // Organize into categories
    const categories = organizePages(allPages);
    
    // Calculate stats
    const stats = {
      total: allPages.length,
      withRedirects: allPages.filter(p => p.hasRedirect).length,
      dynamic: allPages.filter(p => p.isDynamic).length,
      conflicts: allPages.filter(p => p.conflicts && p.conflicts.length > 0).length,
      duplicates: allPages.filter(p => p.duplicateOf).length,
      byCategory: {} as Record<string, number>,
    };
    
    categories.forEach(cat => {
      stats.byCategory[cat.id] = cat.pages.length;
    });
    
    // Group conflicts
    const conflicts: Array<{ href: string; pages: PageInfo[] }> = [];
    const conflictMap = new Map<string, PageInfo[]>();
    allPages.forEach(page => {
      if (page.conflicts && page.conflicts.length > 0) {
        if (!conflictMap.has(page.href)) {
          conflictMap.set(page.href, []);
        }
        conflictMap.get(page.href)!.push(page);
      }
    });
    conflictMap.forEach((pageList, href) => {
      conflicts.push({ href, pages: pageList });
    });
    
    // Group duplicates
    const duplicates: Array<{ label: string; pages: PageInfo[] }> = [];
    const duplicateMap = new Map<string, PageInfo[]>();
    allPages.forEach(page => {
      if (page.duplicateOf) {
        const key = page.label.toLowerCase();
        if (!duplicateMap.has(key)) {
          duplicateMap.set(key, []);
        }
        duplicateMap.get(key)!.push(page);
      }
    });
    duplicateMap.forEach((pageList, label) => {
      duplicates.push({ label, pages: pageList });
    });
    
    const result: ComprehensivePagesResult = {
      categories,
      allPages,
      stats,
      conflicts,
      duplicates,
    };
    
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in comprehensive-pages API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to scan pages',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}






