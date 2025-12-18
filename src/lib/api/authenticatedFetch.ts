/**
 * Authenticated Fetch Helper
 * API çağrılarında accessToken ve tenant bilgisini otomatik ekler
 */

export interface AuthenticatedFetchOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

/**
 * Get tenant slug from cookie
 */
export function getTenantSlug(): string | null {
  if (typeof document === 'undefined') return null;
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('tenant-slug='))
    ?.split('=')[1] || null;
}

/**
 * Authenticated fetch - automatically adds auth token and tenant headers
 */
export async function authenticatedFetch(
  url: string,
  options: AuthenticatedFetchOptions = {}
): Promise<Response> {
  const { skipAuth = false, headers: customHeaders, ...restOptions } = options;

  const headers = new Headers(customHeaders);

  // Add auth token if not skipping
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Add tenant header
  const tenantSlug = getTenantSlug();
  if (tenantSlug) {
    headers.set('x-tenant-slug', tenantSlug);
    headers.set('x-tenant-source', 'cookie');
  }

  return fetch(url, {
    ...restOptions,
    headers,
    credentials: 'include',
  });
}

/**
 * Helper for JSON API calls
 */
export async function authenticatedFetchJSON<T = any>(
  url: string,
  options: AuthenticatedFetchOptions = {}
): Promise<{ success: boolean; data?: T; error?: any }> {
  try {
    const response = await authenticatedFetch(url, options);
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Request failed',
    };
  }
}

/**
 * POST helper with JSON body
 */
export async function authenticatedPost<T = any>(
  url: string,
  body: any,
  options: AuthenticatedFetchOptions = {}
): Promise<{ success: boolean; data?: T; error?: any }> {
  return authenticatedFetchJSON<T>(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
    body: JSON.stringify(body),
  });
}

/**
 * DELETE helper
 */
export async function authenticatedDelete<T = any>(
  url: string,
  options: AuthenticatedFetchOptions = {}
): Promise<{ success: boolean; data?: T; error?: any }> {
  return authenticatedFetchJSON<T>(url, {
    ...options,
    method: 'DELETE',
  });
}




