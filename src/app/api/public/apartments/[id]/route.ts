import { NextRequest, NextResponse } from 'next/server';
import { corePrisma } from '@/lib/corePrisma';
import { getTenantPrisma } from '@/lib/dbSwitcher';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/public/apartments/[id]
 * Public endpoint to get apartment details (no authentication required)
 * Used for QR code scanning
 * Requires ?tenant=slug query parameter
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const tenantSlug = searchParams.get('tenant');

    if (!tenantSlug) {
      return NextResponse.json(
        { success: false, error: 'Tenant parameter required' },
        { status: 400 }
      );
    }

    // Find tenant by slug
    const tenant = await corePrisma.tenant.findFirst({
      where: {
        slug: tenantSlug,
        status: 'active',
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Construct tenant database URL using template or fallback
    const templateUrl = process.env.TENANT_DB_TEMPLATE_URL || 'postgresql://postgres:postgres@localhost:5432/__DB_NAME__?schema=public';
    const dbUrl = templateUrl.replace('__DB_NAME__', tenant.dbName);

    // Get tenant database connection
    const tenantPrisma = getTenantPrisma(dbUrl);

    // Get apartment with property (public-safe fields only)
    const apartment = await tenantPrisma.apartment.findUnique({
      where: { id },
      select: {
        id: true,
        unitNumber: true,
        apartmentType: true,
        floor: true,
        block: true,
        area: true,
        roomCount: true,
        bedroomCount: true,
        bathroomCount: true,
        balcony: true,
        livingRoom: true,
        basementSize: true,
        coldRent: true,
        additionalCosts: true,
        heatingCosts: true,
        deposit: true,
        heatingSystems: true,
        lastRenovationDate: true,
        internetSpeed: true,
        energyCertificateType: true,
        energyConsumption: true,
        energyCertificateYear: true,
        usageRights: true,
        coverImage: true,
        images: true,
        isActive: true,
        description: true,
        status: true,
        property: {
          select: {
            id: true,
            name: true,
            type: true,
            address: true,
            city: true,
            district: true,
            postalCode: true,
            constructionYear: true,
          },
        },
      },
    });

    if (!apartment) {
      return NextResponse.json(
        { success: false, error: 'Apartment not found' },
        { status: 404 }
      );
    }

    // Don't show inactive apartments publicly
    if (!apartment.isActive) {
      return NextResponse.json(
        { success: false, error: 'Apartment not available' },
        { status: 404 }
      );
    }

    // Get company info for branding
    const company = await tenantPrisma.company.findFirst({
      select: {
        name: true,
        logo: true,
        phone: true,
        email: true,
        website: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        apartment,
        company,
        tenant: {
          name: tenant.name,
          slug: tenant.slug,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching public apartment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
