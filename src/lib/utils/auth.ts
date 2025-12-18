/**
 * Auth Utilities
 * Modül bağımsızlığı için optional auth context
 * Modüller auth context olmadan da çalışabilmeli
 */

/**
 * Get current user ID from request or context
 * Returns null if auth is not available (modül bağımsızlığı için)
 */
export async function getCurrentUserId(request?: Request): Promise<string | null> {
  try {
    // Try to get from headers (if available)
    if (request) {
      const authHeader = request.headers.get('authorization');
      if (authHeader) {
        // Extract user ID from token if needed
        // This is a placeholder - implement based on your auth system
        return null;
      }
    }

    // Try to get from context (client-side)
    if (typeof window !== 'undefined') {
      // Check if auth context is available
      try {
        // Dynamic import to avoid circular dependencies
        // Note: This won't work in server components
        // For server-side, use request headers or session
        return null;
      } catch {
        // Auth hook not available - modül bağımsızlığı
        return null;
      }
    }

    return null;
  } catch {
    // Graceful degradation - modül bağımsızlığı
    return null;
  }
}

/**
 * Get current user name (optional)
 */
export async function getCurrentUserName(request?: Request): Promise<string | null> {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) return null;

    // Try to get user name from context or API
    // This is a placeholder - implement based on your auth system
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated (optional check)
 */
export async function isAuthenticated(request?: Request): Promise<boolean> {
  const userId = await getCurrentUserId(request);
  return userId !== null;
}













