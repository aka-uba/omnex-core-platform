/**
 * LayoutResolver
 * Rol/kullanıcı/firma bazlı layout çözümleme
 * Öncelik sırası: user > role > company > default
 */

import { LayoutConfig, DEFAULT_LAYOUT_CONFIG, LayoutSource } from './LayoutConfig';
import { fetchWithAuth } from '@/lib/api/fetchWithAuth';

interface ResolveOptions {
  userId?: string;
  userRole?: string;
  companyId?: string;
  userConfig?: LayoutConfig | null;
  roleConfig?: LayoutConfig | null;
  companyConfig?: LayoutConfig | null;
}

export class LayoutResolver {
  /**
   * Layout yapılandırmasını çözümle
   * Öncelik: user > role > company > default
   */
  static resolve(options: ResolveOptions): {
    config: LayoutConfig;
    source: LayoutSource;
  } {
    const { userConfig, roleConfig, companyConfig } = options;

    // 1. Kullanıcı özel ayarı (en yüksek öncelik)
    if (userConfig) {
      return {
        config: { ...userConfig, layoutSource: 'user' },
        source: 'user',
      };
    }

    // 2. Rol ayarı
    if (roleConfig) {
      return {
        config: { ...roleConfig, layoutSource: 'role' },
        source: 'role',
      };
    }

    // 3. Firma ayarı
    if (companyConfig) {
      return {
        config: { ...companyConfig, layoutSource: 'company' },
        source: 'company',
      };
    }

    // 4. Varsayılan
    return {
      config: { ...DEFAULT_LAYOUT_CONFIG, layoutSource: 'default' },
      source: 'default',
    };
  }

  /**
   * Veritabanından tüm layout yapılandırmalarını yükle
   */
  static async loadAllConfigs(options: {
    userId?: string;
    userRole?: string;
    companyId?: string;
  }): Promise<{
    userConfig: LayoutConfig | null;
    roleConfig: LayoutConfig | null;
    companyConfig: LayoutConfig | null;
  }> {
    const { userId, userRole, companyId } = options;

    try {
      // Paralel olarak tüm config'leri yükle (fetchWithAuth ile JWT token eklenir)
      const [userResponse, roleResponse, companyResponse] = await Promise.allSettled([
        userId ? fetchWithAuth(`/api/layout/config?scope=user&userId=${userId}`) : Promise.resolve(null),
        userRole ? fetchWithAuth(`/api/layout/config?scope=role&role=${userRole}`) : Promise.resolve(null),
        companyId ? fetchWithAuth(`/api/layout/config?scope=company&companyId=${companyId}`) : Promise.resolve(null),
      ]);

      // API response format: { success: true, data: { config: {...} } }
      const userConfig = userResponse.status === 'fulfilled' && userResponse.value
        ? await userResponse.value.json().then((res: { success?: boolean; data?: { config?: LayoutConfig } }) => res.data?.config || null).catch(() => null)
        : null;

      const roleConfig = roleResponse.status === 'fulfilled' && roleResponse.value
        ? await roleResponse.value.json().then((res: { success?: boolean; data?: { config?: LayoutConfig } }) => res.data?.config || null).catch(() => null)
        : null;

      const companyConfig = companyResponse.status === 'fulfilled' && companyResponse.value
        ? await companyResponse.value.json().then((res: { success?: boolean; data?: { config?: LayoutConfig } }) => res.data?.config || null).catch(() => null)
        : null;

      return {
        userConfig,
        roleConfig,
        companyConfig,
      };
    } catch (error) {
      return {
        userConfig: null,
        roleConfig: null,
        companyConfig: null,
      };
    }
  }
}

