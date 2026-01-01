/**
 * Layout Config API
 * LayoutResolver.loadAllConfigs taraf1ndan kullan1l1r
 * Scope parametresine g�re user/role/company config d�nd�r�r
 */

import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/response';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import {
  DEFAULT_SIDEBAR_CONFIG,
  DEFAULT_TOP_CONFIG,
  DEFAULT_MOBILE_CONFIG,
  DEFAULT_CONTENT_AREA_CONFIG,
  type LayoutConfig,
} from '@/components/layouts/core/LayoutConfig';

type LayoutScope = 'user' | 'role' | 'company';

/**
 * UserPreferences'dan LayoutConfig format1na d�n�_t�r
 */
function userPreferencesToLayoutConfig(prefs: {
  layoutType?: string | null;
  themeMode?: string | null;
  direction?: string | null;
  footerVisible?: boolean | null;
  sidebarBackground?: string | null;
  sidebarCollapsed?: boolean | null;
  sidebarWidth?: number | null;
  menuColor?: string | null;
  topBarScroll?: string | null;
}): LayoutConfig {
  return {
    layoutType: (prefs.layoutType?.toLowerCase() === 'toplayout' ? 'top' : 'sidebar') as LayoutConfig['layoutType'],
    themeMode: (prefs.themeMode?.toLowerCase() || 'light') as LayoutConfig['themeMode'],
    direction: (prefs.direction?.toLowerCase() || 'ltr') as LayoutConfig['direction'],
    footerVisible: prefs.footerVisible ?? true,
    sidebar: {
      ...DEFAULT_SIDEBAR_CONFIG,
      background: (prefs.sidebarBackground as any) || DEFAULT_SIDEBAR_CONFIG.background,
      collapsed: prefs.sidebarCollapsed ?? DEFAULT_SIDEBAR_CONFIG.collapsed,
      width: prefs.sidebarWidth ?? DEFAULT_SIDEBAR_CONFIG.width,
      menuColor: (prefs.menuColor as any) || DEFAULT_SIDEBAR_CONFIG.menuColor,
    },
    top: {
      ...DEFAULT_TOP_CONFIG,
      scrollBehavior: (prefs.topBarScroll as any) || DEFAULT_TOP_CONFIG.scrollBehavior,
      menuColor: (prefs.menuColor as any) || DEFAULT_TOP_CONFIG.menuColor,
    },
    mobile: DEFAULT_MOBILE_CONFIG,
    contentArea: DEFAULT_CONTENT_AREA_CONFIG,
  };
}

/**
 * GET - Layout config'i scope'a g�re getir
 * Query params:
 * - scope: 'user' | 'role' | 'company'
 * - userId: (scope=user i�in)
 * - role: (scope=role i�in)
 * - companyId: (scope=company i�in)
 */
export async function GET(request: NextRequest) {
  return withTenant(request, async (tenantPrisma) => {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') as LayoutScope;
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    const companyId = searchParams.get('companyId');

    if (!scope) {
      return errorResponse('INVALID_REQUEST', 'scope parameter is required', null, 400);
    }

    let config = null;

    switch (scope) {
      case 'user':
        if (!userId) {
          return errorResponse('INVALID_REQUEST', 'userId parameter is required for user scope', null, 400);
        }
        // UserPreferences tablosundan kullan1c1 config'ini al
        const userPrefs = await tenantPrisma.userPreferences.findUnique({
          where: { userId },
        });
        if (userPrefs) {
          config = userPreferencesToLayoutConfig(userPrefs);
        }
        break;

      case 'role':
        if (!role) {
          return errorResponse('INVALID_REQUEST', 'role parameter is required for role scope', null, 400);
        }
        // RoleLayoutConfig tablosundan rol config'ini al
        const roleConfig = await tenantPrisma.roleLayoutConfig.findFirst({
          where: { role },
        });
        config = roleConfig?.config || null;
        break;

      case 'company':
        if (!companyId) {
          return errorResponse('INVALID_REQUEST', 'companyId parameter is required for company scope', null, 400);
        }
        // CompanyLayoutConfig tablosundan firma config'ini al
        const companyConfig = await tenantPrisma.companyLayoutConfig.findUnique({
          where: { companyId },
        });
        config = companyConfig?.config || null;
        break;

      default:
        return errorResponse('INVALID_REQUEST', 'Invalid scope. Must be user, role, or company', null, 400);
    }

    return successResponse({ config });
  }, { required: true });
}

/**
 * POST - Layout config kaydet
 * Body:
 * - config: LayoutConfig object
 * - scope: 'user' | 'role' | 'company'
 * - userId: (scope=user için)
 * - role: (scope=role için)
 * - companyId: (scope=company için)
 */
export async function POST(request: NextRequest) {
  return withTenant(request, async (tenantPrisma) => {
    const tenantContext = await getTenantFromRequest(request);
    const tenantId = tenantContext?.id || '';

    const body = await request.json();
    const { config, scope, userId, role, companyId } = body;

    if (!config) {
      return errorResponse('INVALID_REQUEST', 'config is required', null, 400);
    }

    if (!scope) {
      return errorResponse('INVALID_REQUEST', 'scope is required', null, 400);
    }

    switch (scope) {
      case 'user':
        if (!userId) {
          return errorResponse('INVALID_REQUEST', 'userId is required for user scope', null, 400);
        }
        // UserPreferences tablosuna kaydet
        await tenantPrisma.userPreferences.upsert({
          where: { userId },
          update: {
            layoutType: config.layoutType === 'top' ? 'TopLayout' : 'SidebarLayout',
            themeMode: config.themeMode,
            direction: config.direction?.toUpperCase() || 'LTR',
            footerVisible: config.footerVisible,
            sidebarBackground: config.sidebar?.background,
            sidebarCollapsed: config.sidebar?.collapsed,
            sidebarWidth: config.sidebar?.width,
            menuColor: config.sidebar?.menuColor,
            topBarScroll: config.top?.scrollBehavior,
          },
          create: {
            userId,
            tenantId,
            companyId: companyId || '',
            layoutType: config.layoutType === 'top' ? 'TopLayout' : 'SidebarLayout',
            themeMode: config.themeMode,
            direction: config.direction?.toUpperCase() || 'LTR',
            footerVisible: config.footerVisible,
            sidebarBackground: config.sidebar?.background,
            sidebarCollapsed: config.sidebar?.collapsed,
            sidebarWidth: config.sidebar?.width,
            menuColor: config.sidebar?.menuColor,
            topBarScroll: config.top?.scrollBehavior,
          },
        });
        break;

      case 'role':
        if (!role) {
          return errorResponse('INVALID_REQUEST', 'role is required for role scope', null, 400);
        }
        // RoleLayoutConfig tablosuna kaydet
        await tenantPrisma.roleLayoutConfig.upsert({
          where: { role },
          update: {
            config,
            layoutType: config.layoutType || 'sidebar',
          },
          create: {
            role,
            tenantId,
            companyId: companyId || '',
            config,
            layoutType: config.layoutType || 'sidebar',
          },
        });
        break;

      case 'company':
        if (!companyId) {
          return errorResponse('INVALID_REQUEST', 'companyId is required for company scope', null, 400);
        }
        // CompanyLayoutConfig tablosuna kaydet
        await tenantPrisma.companyLayoutConfig.upsert({
          where: { companyId },
          update: {
            config,
            layoutType: config.layoutType || 'sidebar',
          },
          create: {
            companyId,
            tenantId,
            config,
            layoutType: config.layoutType || 'sidebar',
          },
        });
        break;

      default:
        return errorResponse('INVALID_REQUEST', 'Invalid scope. Must be user, role, or company', null, 400);
    }

    return successResponse({ message: 'Config saved successfully' });
  }, { required: true });
}
