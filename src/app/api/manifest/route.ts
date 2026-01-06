import { NextRequest, NextResponse } from 'next/server';
import { corePrisma } from '@/lib/corePrisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Try to get company info from cookies or default
    const tenantSlug = request.cookies.get('tenant-slug')?.value;

    let companyName = 'Omnex Core Platform';
    let shortName = 'Omnex';
    let description = 'Enterprise Management Platform';
    let themeColor = '#228be6';

    if (tenantSlug) {
      try {
        // Get tenant with database info
        const tenant = await corePrisma.tenant.findFirst({
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

        if (tenant && tenant.dbName) {
          // Get actual company name from tenant database
          const { getTenantDbUrl } = await import('@/lib/services/tenantService');
          const { getTenantPrisma } = await import('@/lib/dbSwitcher');

          const dbUrl = getTenantDbUrl({ dbName: tenant.dbName });
          const tenantPrisma = getTenantPrisma(dbUrl);

          try {
            // Get the main company (first or default)
            const company = await tenantPrisma.company.findFirst({
              orderBy: { createdAt: 'asc' },
              select: { name: true }
            });

            if (company?.name) {
              companyName = company.name;
              // Create short name from company name (first word or first 12 chars)
              const words = company.name.split(' ');
              shortName = words[0].length <= 12 ? words[0] : company.name.substring(0, 12);
            } else {
              // Fallback to tenant name
              shortName = tenant.name || tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1);
              companyName = shortName;
            }
          } catch {
            // If tenant DB query fails, use tenant name
            shortName = tenant.name || tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1);
            companyName = shortName;
          }
        }
      } catch {
        // If tenant lookup fails, use defaults
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
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
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
