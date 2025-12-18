/**
 * Fetch wrapper that automatically adds authentication token
 * Handles 401 errors by redirecting to login
 */

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    // If no token, redirect to login
    if (!token && typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const locale = currentPath.split('/')[1] || 'tr';
        window.location.href = `/${locale}/login`;
        throw new Error('No authentication token found');
    }

    // Merge headers
    const headers: HeadersInit = {
        ...options.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
    };

    // Add Content-Type only if body exists, not FormData, and not already set
    const headersObj = headers as Record<string, string>;
    if (options.body && !(options.body instanceof FormData) && !headersObj['Content-Type'] && !headersObj['content-type']) {
        headersObj['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401 && typeof window !== 'undefined') {
        // Clear invalid token
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        const currentPath = window.location.pathname;
        const locale = currentPath.split('/')[1] || 'tr';
        window.location.href = `/${locale}/login`;
        
        throw new Error('Authentication failed. Please login again.');
    }

    return response;
}
