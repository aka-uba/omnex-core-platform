import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale } from '@/lib/i18n/config';
import { extractTenantSlug, isSuperAdminRequest } from '@/lib/middleware/tenantResolver';
import createMiddleware from 'next-intl/middleware';
import { routing } from './lib/i18n/routing';

// Create next-intl middleware
const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Note: Public files (like share-files.html) are served directly by Next.js
    // and may not pass through middleware. The page itself will check server status.
    // We keep this check as a fallback, but the page handles the main check.
    if (pathname === '/share-files.html') {
        // Allow access - page will check server status and show appropriate message
        return NextResponse.next();
    }

    // Skip static files and other HTML files
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon.ico') ||
        pathname.endsWith('.html') ||
        pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf|eot)$/)
    ) {
        return NextResponse.next();
    }

    // Skip setup page (no locale/tenant required)
    // Handle both /setup and /{locale}/setup
    if (pathname === '/setup' || pathname.startsWith('/setup/')) {
        return NextResponse.next();
    }

    // Skip auth pages (locale-independent login/register)
    if (pathname.startsWith('/auth/')) {
        return NextResponse.next();
    }
    
    // Redirect /{locale}/setup to /setup (before locale processing)
    const setupRedirectMatch = pathname.match(/^\/([a-z]{2})\/setup(\/.*)?$/);
    if (setupRedirectMatch) {
        const [, , restPath] = setupRedirectMatch;
        // Redirect regardless of locale validity
        return NextResponse.redirect(
            new URL(`/setup${restPath || ''}`, request.url)
        );
    }

    // API routes: Resolve tenant and add header
    if (pathname.startsWith('/api')) {
        // Skip tenant creation endpoint (no tenant needed)
        if (pathname.startsWith('/api/tenants') && request.method === 'POST') {
            return NextResponse.next();
        }

        // Skip auth endpoints (login/register)
        if (pathname.startsWith('/api/auth')) {
            return NextResponse.next();
        }

        // Skip super admin endpoints
        if (isSuperAdminRequest(request)) {
            return NextResponse.next();
        }

        // Extract tenant slug (Edge-compatible, no Prisma)
        let tenantSlug = extractTenantSlug(request);

        // If not found from URL, try to get from cookie (for development/localhost)
        if (!tenantSlug) {
            let cookieTenantSlug = request.cookies.get('tenant-slug')?.value;

            // Also try parsing Cookie header manually (for testing with curl/Invoke-WebRequest)
            if (!cookieTenantSlug) {
                const cookieHeader = request.headers.get('cookie');
                if (cookieHeader) {
                    const cookies = cookieHeader.split(';').map(c => c.trim());
                    for (const cookie of cookies) {
                        const [name, value] = cookie.split('=');
                        if (name === 'tenant-slug' && value) {
                            cookieTenantSlug = value;
                            break;
                        }
                    }
                }
            }

            if (cookieTenantSlug) {
                tenantSlug = {
                    slug: cookieTenantSlug,
                    source: 'cookie',
                };
            }
        }

        if (tenantSlug) {
            const requestHeaders = new Headers(request.headers);
            requestHeaders.set('x-tenant-slug', tenantSlug.slug);
            requestHeaders.set('x-tenant-source', tenantSlug.source);
            // Also add hostname for custom domain resolution
            const hostname = request.headers.get('host')?.split(':')[0];
            if (hostname) {
                requestHeaders.set('x-hostname', hostname);
            }

            return NextResponse.next({
                request: {
                    headers: requestHeaders,
                },
            });
        }

        // If tenant is required but not found, continue
        // API routes will validate and return appropriate errors
        return NextResponse.next();
    }

    // Page routes: Extract tenant slug and handle locale
    const tenantSlug = extractTenantSlug(request);

    // Rewrite module routes: /{locale}/{module-slug}/... -> /{locale}/modules/{module-slug}/...
    // List of known module slugs
    const moduleSlugs = [
        'real-estate', 'accounting', 'hr', 'ai', 'production', 'maintenance',
        'file-manager', 'notifications', 'calendar', 'license',
        'web-builder', 'sohbet', 'raporlar', 'chat'
    ];

    // Check if path matches module route pattern (without /modules/)
    const localeMatch = pathname.match(/^\/([a-z]{2})\/([^\/]+)(\/.*)?$/);
    if (localeMatch) {
        const [, locale, firstSegment, restPath] = localeMatch;
        const localeStr = locale || '';
        const firstSegStr = firstSegment || '';
        if (locales.includes(localeStr) && moduleSlugs.includes(firstSegStr) && !pathname.includes('/modules/')) {
            // Rewrite to include /modules/
            const newPath = `/${localeStr}/modules/${firstSegStr}${restPath || ''}`;
            const url = request.nextUrl.clone();
            url.pathname = newPath;
            return NextResponse.rewrite(url);
        }
    }

    // Check if the pathname is missing a locale
    const pathnameIsMissingLocale = locales.every(
        (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
    );

    // If tenant slug found and path-based routing, ensure tenant slug is in path
    if (tenantSlug && tenantSlug.source === 'path' && !pathname.startsWith(`/tenant/${tenantSlug.slug}`) && !pathname.startsWith('/api')) {
        // If path doesn't have tenant prefix, add it
        if (pathnameIsMissingLocale) {
            const locale = defaultLocale;
            return NextResponse.redirect(
                new URL(`/${locale}/tenant/${tenantSlug.slug}${pathname.startsWith('/') ? '' : '/'}${pathname}`, request.url)
            );
        } else {
            // Locale exists, check if tenant slug is missing
            const localeMatch = pathname.match(/^\/([a-z]{2})\//);
            if (localeMatch) {
                const locale = localeMatch[1];
                const pathWithoutLocale = pathname.slice(`/${locale}`.length);
                if (!pathWithoutLocale.startsWith(`/tenant/${tenantSlug.slug}`)) {
                    return NextResponse.redirect(
                        new URL(`/${locale}/tenant/${tenantSlug.slug}${pathWithoutLocale}`, request.url)
                    );
                }
            }
        }
    }

    // Redirect /{locale}/login to /{locale}/auth/login
    const loginRedirectMatch = pathname.match(/^\/([a-z]{2})\/login(\/.*)?$/);
    if (loginRedirectMatch) {
        const [, locale, restPath] = loginRedirectMatch;
        const localeStr = locale || '';
        if (locales.includes(localeStr)) {
            return NextResponse.redirect(
                new URL(`/${locale}/auth/login${restPath || ''}`, request.url)
            );
        }
    }

    // Redirect if there is no locale (and no tenant in path)
    if (pathnameIsMissingLocale && !pathname.startsWith('/tenant/')) {
        const locale = defaultLocale;
        return NextResponse.redirect(
            new URL(`/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`, request.url)
        );
    }

    // Add tenant slug to headers for page routes (will be validated in server components)
    if (tenantSlug) {
        // Call next-intl middleware first, then add tenant headers
        const response = intlMiddleware(request);
        if (response) {
            response.headers.set('x-tenant-slug', tenantSlug.slug);
            response.headers.set('x-tenant-source', tenantSlug.source);
            // Also add hostname for custom domain resolution
            const hostname = request.headers.get('host')?.split(':')[0];
            if (hostname) {
                response.headers.set('x-hostname', hostname);
            }
            return response;
        }
    }

    // Protect /settings/access-control route
    if (pathname.includes('/settings/access-control')) {
        // Note: Full role check happens in the page component or layout
        // Here we can do a basic check if needed, but since we don't have easy access to user session
        // in middleware without database call (which is not recommended in Edge),
        // we'll rely on the page-level check and the menu visibility logic.
        // However, we can check for basic auth token presence if needed.
    }

    // Use next-intl middleware for locale handling
    const response = intlMiddleware(request);
    if (response) {
        return response;
    }

    const defaultResponse = NextResponse.next();
    // Don't interfere with Next.js route cache
    return defaultResponse;
}

export const config = {
    matcher: [
        // Match all paths except internal Next.js paths
        // API routes ARE included so we can add tenant headers
        // Static files and share-files.html are handled in the middleware function itself
        '/((?!_next/).*)',
    ],
};
