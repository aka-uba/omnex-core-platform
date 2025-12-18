/**
 * Layout Config API
 * GET: Layout yapılandırmasını yükle
 * POST: Layout yapılandırmasını kaydet
 */

import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { requireCompanyId } from '@/lib/api/companyContext';
// Simple LayoutConfig type for API compatibility
export interface LayoutConfig {
  layoutType?: 'sidebar' | 'top' | 'mobile';
  themeMode?: 'light' | 'dark' | 'auto';
  direction?: 'ltr' | 'rtl';
  footerVisible?: boolean;
  layoutSource?: 'role' | 'user' | 'company' | 'default';
  [key: string]: any; // Allow additional properties
}

// GET: Layout yapılandırmasını yükle
export async function GET(request: NextRequest) {
  // Try to get tenant context, but don't fail if not found
  try {
    return await withTenant<ApiResponse<{ config: LayoutConfig | null }>>(
      request,
      async (tenantPrisma) => {
        try {
          // Tenant context yoksa null döndür (non-critical)
          if (!tenantPrisma) {
            return successResponse({ config: null });
          }


          const searchParams = request.nextUrl.searchParams;
          const scope = searchParams.get('scope'); // user | role | company
          const userId = searchParams.get('userId')?.trim() || undefined;
          const role = searchParams.get('role')?.trim() || undefined;
          const companyId = searchParams.get('companyId')?.trim() || undefined;

          let config: LayoutConfig | null = null;

          // Eğer hiçbir parametre yoksa, null döndür (hata değil)
          if (!userId && !role && !companyId) {
            return successResponse({ config: null });
          }

          if (scope === 'user' && userId) {
            // Kullanıcı özel ayarı
            try {
              const userPrefs = await tenantPrisma.userPreferences.findUnique({
                where: { userId },
                select: {
                  layoutType: true,
                  themeMode: true,
                  direction: true,
                  layoutConfig: true,
                  preferences: true,
                  layoutSource: true,
                },
              });

              if (userPrefs) {
                // Önce direkt alanlardan config oluştur
                const layoutTypeValue = userPrefs.layoutType 
                    ? (userPrefs.layoutType === 'SidebarLayout' ? 'sidebar' 
                      : userPrefs.layoutType === 'TopLayout' ? 'top' 
                      : userPrefs.layoutType === 'MobileLayout' ? 'mobile' 
                      : userPrefs.layoutType.toLowerCase() as 'sidebar' | 'top' | 'mobile')
                    : undefined;
                const themeModeValue = userPrefs.themeMode
                    ? (userPrefs.themeMode === 'Light' ? 'light'
                      : userPrefs.themeMode === 'Dark' ? 'dark'
                      : userPrefs.themeMode === 'Auto' ? 'auto'
                      : userPrefs.themeMode.toLowerCase() as 'light' | 'dark' | 'auto')
                    : undefined;
                const directionValue = userPrefs.direction
                    ? (userPrefs.direction === 'LTR' ? 'ltr'
                      : userPrefs.direction === 'RTL' ? 'rtl'
                      : userPrefs.direction.toLowerCase() as 'ltr' | 'rtl')
                    : undefined;
                const layoutSourceValue = (userPrefs.layoutSource as 'role' | 'user' | 'company' | 'default') || undefined;
                
                const directConfig: LayoutConfig = {
                  ...(layoutTypeValue ? { layoutType: layoutTypeValue } : {}),
                  ...(themeModeValue ? { themeMode: themeModeValue } : {}),
                  ...(directionValue ? { direction: directionValue } : {}),
                  layoutSource: layoutSourceValue || 'default',
                };

                // preferences.layoutConfig varsa onu kullan (daha detaylı)
                let preferencesConfig: LayoutConfig | null = null;
                if (userPrefs.preferences) {
                  try {
                    const prefs = typeof userPrefs.preferences === 'string'
                      ? JSON.parse(userPrefs.preferences)
                      : userPrefs.preferences;
                    if (prefs?.layoutConfig) {
                      preferencesConfig = prefs.layoutConfig;
                    }
                  } catch (err) {
                    // Silently fail - preferences parse hatası
                  }
                }

                // layoutConfig direkt alan varsa onu kullan
                let directLayoutConfig: LayoutConfig | null = null;
                if (userPrefs.layoutConfig) {
                  try {
                    directLayoutConfig = typeof userPrefs.layoutConfig === 'string'
                      ? JSON.parse(userPrefs.layoutConfig)
                      : userPrefs.layoutConfig as LayoutConfig;
                  } catch (err) {
                    // Silently fail
                  }
                }

                // Öncelik: directLayoutConfig > preferencesConfig > directConfig
                config = directLayoutConfig || preferencesConfig || directConfig;
              }
            } catch (dbError) {
              // Database hatası - gracefully handle, null döndür
              // UserPreferences tablosu yoksa veya migration eksikse hata verme
              return successResponse({ config: null });
            }
          } else if (scope === 'role' && role) {
            // Rol ayarı - model mevcut değil, şimdilik atlanıyor
            // TODO: Implement roleLayoutConfig model
          } else if (scope === 'company' && companyId) {
            // Firma ayarı - model mevcut değil, şimdilik atlanıyor
            // TODO: Implement companyLayoutConfig model
          }

          return successResponse({ config });
        } catch (error) {
          // Unexpected error - gracefully return null instead of failing
          return successResponse({ config: null });
        }
      },
      { required: false, module: 'layout-config' } // Tenant optional - graceful degradation
    );
  } catch (error) {
    // If withTenant itself fails, return null (non-critical)
    return successResponse({ config: null });
  }
}

// POST: Layout yapılandırmasını kaydet
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse>(
    request,
    async (tenantPrisma) => {
      try {
        // Tenant context yoksa hata döndür (POST için gerekli)
        if (!tenantPrisma) {
          return errorResponse('Tenant context required', 'Tenant context is required to save layout config', 400);
        }

        const body = await request.json();
        const { config, scope, userId, role, companyId } = body;

        // Boş string'leri undefined'a çevir
        const cleanUserId = userId?.trim() || undefined;
        const cleanRole = role?.trim() || undefined;
        const cleanCompanyId = companyId?.trim() || undefined;

        if (!config) {
          return errorResponse('Validation error', 'Config is required', 400);
        }

        if (!scope) {
          return errorResponse('Validation error', 'Scope is required (user, role, or company)', 400);
        }

        if (scope === 'user' && cleanUserId) {
          // Kullanıcı özel ayarı kaydet

          // Get tenant context
          const tenantContext = await getTenantFromRequest(request);
          if (!tenantContext) {
            return errorResponse('Tenant context required', 'Tenant context is required to save layout config', 400);
          }

          // Get companyId
          let companyId: string;
          try {
            companyId = await requireCompanyId(request, tenantPrisma);
          } catch (companyError: any) {
            return errorResponse(
              'Company ID error',
              companyError.message || 'Company ID is required',
              400
            );
          }

          // Get existing preferences or create new object
          const existingPrefs = await tenantPrisma.userPreferences.findUnique({
            where: { userId: cleanUserId },
            select: {
              preferences: true,
            },
          });

          const currentPrefs = existingPrefs?.preferences
            ? (typeof existingPrefs.preferences === 'string'
              ? JSON.parse(existingPrefs.preferences)
              : existingPrefs.preferences)
            : {};

          const updatedPrefs = {
            ...currentPrefs,
            layoutConfig: typeof config === 'string' ? JSON.parse(config) : config,
          };

          // Map layoutType from API format to schema format
          const layoutTypeMap: Record<string, string> = {
            'sidebar': 'SidebarLayout',
            'top': 'TopLayout',
            'mobile': 'MobileLayout',
          };
          const mappedLayoutType = config.layoutType 
            ? (layoutTypeMap[config.layoutType] || config.layoutType)
            : 'SidebarLayout';

          // Map themeMode from API format to schema format
          const themeModeMap: Record<string, string> = {
            'light': 'Light',
            'dark': 'Dark',
            'auto': 'Auto',
          };
          const mappedThemeMode = config.themeMode
            ? (themeModeMap[config.themeMode] || config.themeMode)
            : 'Auto';

          // Map direction from API format to schema format
          const directionMap: Record<string, string> = {
            'ltr': 'LTR',
            'rtl': 'RTL',
          };
          const mappedDirection = config.direction
            ? (directionMap[config.direction] || config.direction.toUpperCase())
            : 'LTR';

          await tenantPrisma.userPreferences.upsert({
            where: { userId: cleanUserId },
            update: {
              preferences: updatedPrefs as any, // Prisma handles JSON automatically
              layoutConfig: typeof config === 'string' ? JSON.parse(config) : config, // Direct layoutConfig field
              layoutType: mappedLayoutType,
              themeMode: mappedThemeMode,
              direction: mappedDirection,
              updatedAt: new Date(),
            },
            create: {
              userId: cleanUserId,
              tenantId: tenantContext.id,
              companyId: companyId,
              preferences: updatedPrefs as any, // Prisma handles JSON automatically
              layoutConfig: typeof config === 'string' ? JSON.parse(config) : config, // Direct layoutConfig field
              layoutType: mappedLayoutType,
              themeMode: mappedThemeMode,
              direction: mappedDirection,
            },
          });
          return successResponse(undefined, 'Layout config saved successfully');
        } else if (scope === 'role' && cleanRole) {
          // Rol ayarı kaydet

          // Get tenant context
          const tenantContextForRole = await getTenantFromRequest(request);
          if (!tenantContextForRole) {
            return errorResponse('Tenant context required', 'Tenant context is required to save layout config', 400);
          }

          // Önce Role modelini kontrol et
          let roleModel = await tenantPrisma.role.findUnique({
            where: { name: cleanRole },
          });

          if (!roleModel) {
            // Role yoksa oluştur
            const companyId = await requireCompanyId(request, tenantPrisma);
            roleModel = await tenantPrisma.role.create({
              data: {
                tenantId: tenantContextForRole.id,
                companyId: companyId,
                name: cleanRole,
                description: `Layout config for ${role} role`,
              },
            });
          }

          // TODO: roleLayoutConfig model mevcut değil
          // await tenantPrisma.roleLayoutConfig.upsert({
          //   where: { role },
          //   update: {
          //     config: configString,
          //     layoutType: config.layoutType || 'sidebar',
          //     updatedAt: new Date(),
          //   },
          //   create: {
          //     role,
          //     config: configString,
          //     layoutType: config.layoutType || 'sidebar',
          //   },
          // });
          return errorResponse(
            'Not implemented',
            'roleLayoutConfig model is not implemented yet',
            501
          );
        }

        if (scope === 'company' && cleanCompanyId) {
          // Firma ayarı kaydet

          // TODO: companyLayoutConfig model mevcut değil
          // await tenantPrisma.companyLayoutConfig.upsert({
          //   where: { companyId },
          //   update: {
          //     config: configString,
          //     layoutType: config.layoutType || 'sidebar',
          //     updatedAt: new Date(),
          //   },
          //   create: {
          //     companyId,
          //     config: configString,
          //     layoutType: config.layoutType || 'sidebar',
          //   },
          // });
          return errorResponse(
            'Not implemented',
            'companyLayoutConfig model is not implemented yet',
            501
          );
        }

        return errorResponse(
          'Validation error',
          'Invalid scope or missing parameters',
          400,
          `Scope: ${scope}, userId: ${cleanUserId || 'missing'}, role: ${cleanRole || 'missing'}, companyId: ${cleanCompanyId || 'missing'}`
        );
      } catch (error) {
        // Unexpected error - gracefully return error
        return errorResponse(
          'Internal error',
          'Failed to save layout config',
          500
        );
      }
    },
    { required: false, module: 'layout-config' } // Tenant optional - handler içinde kontrol ediliyor
  );
}

