import { NextRequest, NextResponse } from 'next/server';
import { createTenant, listTenants } from '@/lib/services/tenantService';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/tenants
 * List all tenants (SuperAdmin only)
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check (SuperAdmin only)

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10) || 1;
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
    const status = searchParams.get('status') || undefined;
    const agencyId = searchParams.get('agencyId') || undefined;

    const result = await listTenants({
      page,
      pageSize,
      ...(status ? { status } : {}),
      ...(agencyId ? { agencyId } : {}),
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Failed to list tenants', error, 'api-tenants');
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to list tenants',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tenants
 * Create new tenant (SuperAdmin only)
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check (SuperAdmin only)

    const formData = await request.formData();

    // Extract basic info
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const subdomain = formData.get('subdomain') as string | null;
    const customDomain = formData.get('customDomain') as string | null;
    const agencyId = formData.get('agencyId') as string | null;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name and slug are required',
        },
        { status: 400 }
      );
    }

    // Extract company info
    const companyInfo: any = {};
    const companyName = formData.get('companyName') as string | null;
    if (companyName) companyInfo.name = companyName;

    const logo = formData.get('logo') as File | null;
    if (logo) companyInfo.logo = logo;

    const favicon = formData.get('favicon') as File | null;
    if (favicon) companyInfo.favicon = favicon;

    const pwaIcon = formData.get('pwaIcon') as File | null;
    if (pwaIcon) companyInfo.pwaIcon = pwaIcon;

    const address = formData.get('address') as string | null;
    if (address) companyInfo.address = address;

    const phone = formData.get('phone') as string | null;
    if (phone) companyInfo.phone = phone;

    const email = formData.get('email') as string | null;
    if (email) companyInfo.email = email;

    const website = formData.get('website') as string | null;
    if (website) companyInfo.website = website;

    const taxNumber = formData.get('taxNumber') as string | null;
    if (taxNumber) companyInfo.taxNumber = taxNumber;

    // Additional company fields from wizard
    const companyCity = formData.get('companyCity') as string | null;
    if (companyCity) companyInfo.city = companyCity;

    const companyState = formData.get('companyState') as string | null;
    if (companyState) companyInfo.state = companyState;

    const companyPostalCode = formData.get('companyPostalCode') as string | null;
    if (companyPostalCode) companyInfo.postalCode = companyPostalCode;

    const companyCountry = formData.get('companyCountry') as string | null;
    if (companyCountry) companyInfo.country = companyCountry;

    const companyIndustry = formData.get('companyIndustry') as string | null;
    if (companyIndustry) companyInfo.industry = companyIndustry;

    const companyDescription = formData.get('companyDescription') as string | null;
    if (companyDescription) companyInfo.description = companyDescription;

    const companyFoundedYear = formData.get('companyFoundedYear') as string | null;
    if (companyFoundedYear) companyInfo.foundedYear = parseInt(companyFoundedYear, 10);

    const companyEmployeeCount = formData.get('companyEmployeeCount') as string | null;
    if (companyEmployeeCount) companyInfo.employeeCount = parseInt(companyEmployeeCount, 10);

    const companyCapital = formData.get('companyCapital') as string | null;
    if (companyCapital) companyInfo.capital = companyCapital;

    const companyTaxOffice = formData.get('companyTaxOffice') as string | null;
    if (companyTaxOffice) companyInfo.taxOffice = companyTaxOffice;

    const companyRegistrationNumber = formData.get('companyRegistrationNumber') as string | null;
    if (companyRegistrationNumber) companyInfo.registrationNumber = companyRegistrationNumber;

    const companyMersisNumber = formData.get('companyMersisNumber') as string | null;
    if (companyMersisNumber) companyInfo.mersisNumber = companyMersisNumber;

    const companyIban = formData.get('companyIban') as string | null;
    if (companyIban) companyInfo.iban = companyIban;

    const companyBankName = formData.get('companyBankName') as string | null;
    if (companyBankName) companyInfo.bankName = companyBankName;

    const companyAccountHolder = formData.get('companyAccountHolder') as string | null;
    if (companyAccountHolder) companyInfo.accountHolder = companyAccountHolder;

    // Extract initial location (optional)
    let initialLocation: any = undefined;
    const locationName = formData.get('locationName') as string | null;
    if (locationName) {
      initialLocation = {
        name: locationName,
        code: formData.get('locationCode') as string | null,
        type: formData.get('locationType') as string,
        address: formData.get('locationAddress') as string | null,
        city: formData.get('locationCity') as string | null,
        country: formData.get('locationCountry') as string | null,
        postalCode: formData.get('locationPostalCode') as string | null,
        phone: formData.get('locationPhone') as string | null,
        email: formData.get('locationEmail') as string | null,
        latitude: formData.get('locationLatitude') ? parseFloat(formData.get('locationLatitude') as string) : null,
        longitude: formData.get('locationLongitude') ? parseFloat(formData.get('locationLongitude') as string) : null,
        description: formData.get('locationDescription') as string | null,
      };
    }

    // Create tenant
    const result = await createTenant({
      name,
      slug,
      ...(subdomain ? { subdomain } : {}),
      ...(customDomain ? { customDomain } : {}),
      ...(agencyId ? { agencyId } : {}),
      ...(Object.keys(companyInfo).length > 0 ? { companyInfo } : {}),
      ...(initialLocation ? { initialLocation } : {}),
    });

    logger.info('Tenant created successfully', { tenantId: result.tenant.id }, 'api-tenants');

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Failed to create tenant', error, 'api-tenants');
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create tenant',
      },
      { status: 500 }
    );
  }
}
