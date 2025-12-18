import { NextRequest, NextResponse } from 'next/server';
import { corePrisma } from '@/lib/corePrisma';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * GET /api/public/company-info
 * Get public company information for login/register pages
 * No authentication required
 */
export async function GET(request: NextRequest) {
  try {
    // Get tenant slug from cookie or subdomain
    const hostname = request.headers.get('host')?.split(':')[0] || '';
    const tenantSlug = request.cookies.get('tenant-slug')?.value;

    let tenant = null;

    // Try to get tenant from cookie first
    if (tenantSlug) {
      tenant = await corePrisma.tenant.findFirst({
        where: {
          OR: [
            { slug: tenantSlug },
            { subdomain: tenantSlug },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          subdomain: true,
          customDomain: true,
        },
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
          },
          select: {
            id: true,
            name: true,
            slug: true,
            subdomain: true,
            customDomain: true,
          },
        });
      }
    }

    // If still no tenant, get the first active tenant (for development)
    if (!tenant) {
      tenant = await corePrisma.tenant.findFirst({
        where: { status: 'active' },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          name: true,
          slug: true,
          subdomain: true,
          customDomain: true,
        },
      });
    }

    if (!tenant) {
      console.log('[company-info] No tenant found');
      return NextResponse.json({
        success: true,
        data: {
          name: 'Omnex Core',
          logo: null,
        },
      });
    }

    console.log('[company-info] Tenant found:', { id: tenant.id, name: tenant.name, slug: tenant.slug });

    // Try to get company logo from tenant database
    let logo = null;
    let companyName = tenant.name;

    try {
      // Get tenant DB URL from core database
      const fullTenant = await corePrisma.tenant.findUnique({
        where: { id: tenant.id },
        select: {
          dbName: true,
        },
      });

      if (!fullTenant || !fullTenant.dbName) {
        console.log('[company-info] Could not get tenant dbName');
        throw new Error('Tenant dbName not found');
      }

      // Build DB URL
      const { getTenantDbUrl } = await import('@/lib/services/tenantService');
      const dbUrl = getTenantDbUrl({ dbName: fullTenant.dbName });

      const { getTenantPrisma } = await import('@/lib/dbSwitcher');
      const tenantPrisma = getTenantPrisma(dbUrl);

      const company = await tenantPrisma.company.findFirst({
        select: {
          id: true,
          name: true,
          logo: true,
          logoFile: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      if (company) {
        companyName = company.name || tenant.name;
        // Check both logo and logoFile fields
        // logo contains full URL path like /uploads/companies/{id}/filename
        // logoFile contains relative path like uploads/companies/{id}/filename
        if (company.logo) {
          logo = company.logo;
        } else if (company.logoFile) {
          // If only logoFile exists, add leading slash to make it a valid URL
          logo = company.logoFile.startsWith('/') ? company.logoFile : `/${company.logoFile}`;
        }
        // Fallback: If no logo in database, check if file exists on disk
        if (!logo) {
          const companiesDir = join(process.cwd(), 'public', 'uploads', 'companies');

          // First try with exact company ID
          if (company.id) {
            const uploadDir = join(companiesDir, company.id);
            if (existsSync(uploadDir)) {
              try {
                const files = readdirSync(uploadDir);
                const logoFile = files.find(f => f.startsWith('logo-') && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f));
                if (logoFile) {
                  logo = `/uploads/companies/${company.id}/${logoFile}`;
                  console.log('[company-info] Logo found on disk (by company ID):', logo);
                }
              } catch (fsErr) {
                console.error('[company-info] Error reading upload dir:', fsErr);
              }
            }
          }

          // If still no logo, scan all company folders (fallback for ID mismatch)
          if (!logo && existsSync(companiesDir)) {
            try {
              const companyFolders = readdirSync(companiesDir);
              for (const folder of companyFolders) {
                const folderPath = join(companiesDir, folder);
                const files = readdirSync(folderPath);
                const logoFile = files.find(f => f.startsWith('logo-') && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f));
                if (logoFile) {
                  logo = `/uploads/companies/${folder}/${logoFile}`;
                  console.log('[company-info] Logo found on disk (scanned folders):', logo);
                  break;
                }
              }
            } catch (fsErr) {
              console.error('[company-info] Error scanning company folders:', fsErr);
            }
          }
        }
        console.log('[company-info] Company found:', { id: company.id, name: company.name, logo: company.logo, logoFile: company.logoFile, resolvedLogo: logo });
      }
    } catch (err) {
      // If tenant DB access fails, use tenant name
      console.error('Failed to fetch company from tenant DB:', err);
    }

    console.log('[company-info] Returning:', { name: companyName, logo: logo });
    return NextResponse.json({
      success: true,
      data: {
        name: companyName,
        logo: logo,
      },
    });
  } catch (error: any) {
    console.error('Error fetching public company info:', error);
    return NextResponse.json({
      success: true,
      data: {
        name: 'Omnex Core',
        logo: null,
      },
    });
  }
}
