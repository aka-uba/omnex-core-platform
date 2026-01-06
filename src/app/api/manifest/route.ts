import { NextRequest, NextResponse } from 'next/server';
import { corePrisma } from '@/lib/corePrisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get tenant from cookie, subdomain, or fallback to first active tenant
    const hostname = request.headers.get('host')?.split(':')[0] || '';
    const tenantSlug = request.cookies.get('tenant-slug')?.value;

    let companyName = 'Omnex Core Platform';
    let shortName = 'Omnex';
    let description = 'Enterprise Management Platform';
    let themeColor = '#228be6';

    let tenant = null;

    // Try to get tenant from cookie first
    if (tenantSlug) {
      tenant = await corePrisma.tenant.findFirst({
        where: {
          OR: [
            { slug: tenantSlug },
            { subdomain: tenantSlug },
          ],
          status: 'active'
        },
        select: {
          id: true,
          name: true,
          dbName: true,
        }
      });
    }

    // If no tenant from cookie, try subdomain
    if (!tenant && hostname && !hostname.includes('localhost')) {
      const subdomain = hostname.split('.')[0];
      if (subdomain && subdomain !== 'www') {
        tenant = await corePrisma.tenant.findFirst({
          where: {
            OR: [
              { subdomain },
              { customDomain: hostname },
            ],
            status: 'active'
          },
          select: {
            id: true,
            name: true,
            dbName: true,
          }
        });
      }
    }

    // Fallback: get first active tenant (for development)
    if (!tenant) {
      tenant = await corePrisma.tenant.findFirst({
        where: { status: 'active' },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          name: true,
          dbName: true,
        }
      });
    }

    // Fetch company name from tenant database
    if (tenant && tenant.dbName) {
      try {
        const { getTenantDbUrl } = await import('@/lib/services/tenantService');
        const { getTenantPrisma } = await import('@/lib/dbSwitcher');

        const dbUrl = getTenantDbUrl({ dbName: tenant.dbName });
        const tenantPrisma = getTenantPrisma(dbUrl);

        // Get the main company (first created)
        const company = await tenantPrisma.company.findFirst({
          orderBy: { createdAt: 'asc' },
          select: { name: true }
        });

        if (company?.name) {
          companyName = company.name;
          // short_name: Use first word if <= 12 chars, otherwise first 12 chars
          const words = company.name.split(' ');
          shortName = words[0].length <= 12 ? words[0] : company.name.substring(0, 12);
        } else if (tenant.name) {
          companyName = tenant.name;
          shortName = tenant.name.split(' ')[0] || tenant.name.substring(0, 12);
        }
      } catch {
        // If tenant DB fails, use tenant name
        if (tenant.name) {
          companyName = tenant.name;
          shortName = tenant.name.split(' ')[0] || tenant.name.substring(0, 12);
        }
      }
    }

    const manifest = {
      name: companyName,
      short_name: shortName,
      description: description,
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: themeColor,
      orientation: 'any',
      prefer_related_applications: false,
      categories: ['business', 'productivity'],
      icons: [
        {
          src: '/branding/pwa-icon.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/branding/pwa-icon.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        },
        {
          src: '/branding/pwa-icon.png',
          sizes: '384x384',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/branding/pwa-icon.png',
          sizes: '256x256',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/branding/pwa-icon.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/branding/pwa-icon.png',
          sizes: '144x144',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/branding/pwa-icon.png',
          sizes: '96x96',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/branding/pwa-icon.png',
          sizes: '72x72',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/branding/pwa-icon.png',
          sizes: '48x48',
          type: 'image/png',
          purpose: 'any'
        }
      ],
      screenshots: [],
      shortcuts: [
        {
          name: 'Dashboard',
          url: '/tr/dashboard',
          icons: [{ src: '/branding/pwa-icon.png', sizes: '96x96' }]
        }
      ]
    };

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    // Return default manifest on error
    return NextResponse.json({
      name: 'Omnex Core Platform',
      short_name: 'Omnex',
      description: 'Enterprise Management Platform',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#228be6',
      icons: [
        {
          src: '/branding/pwa-icon.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/manifest+json',
      },
    });
  }
}
