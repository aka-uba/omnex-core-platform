// License Service API Route - Admin
// GET /api/admin/tenant-licenses - List tenant licenses
// POST /api/admin/tenant-licenses - Create tenant license

import { NextRequest } from 'next/server';
import { withoutTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { corePrisma } from '@/lib/corePrisma';
import { tenantLicenseCreateSchema } from '@/modules/license/schemas/license.schema';
import { Prisma } from '@prisma/core-client';

// GET /api/admin/tenant-licenses - List tenant licenses
export async function GET(request: NextRequest) {
  return withoutTenant<ApiResponse<{ licenses: unknown[]; total: number; page: number; pageSize: number }>>(
    async () => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
      const tenantId = searchParams.get('tenantId') || undefined;
      const packageId = searchParams.get('packageId') || undefined;
      const status = searchParams.get('status') || undefined;
      const paymentStatus = searchParams.get('paymentStatus') || undefined;

      // Build where clause
      const where: Prisma.TenantLicenseWhereInput = {
        ...(tenantId && { tenantId }),
        ...(packageId && { packageId }),
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
      };

      // Get licenses with pagination
      const [licenses, total] = await Promise.all([
        corePrisma.tenantLicense.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            package: true,
            tenant: {
              select: {
                id: true,
                slug: true,
                name: true,
              },
            },
          },
        }),
        corePrisma.tenantLicense.count({ where }),
      ]);

      return successResponse({
        licenses: licenses.map(license => ({
          ...license,
          startDate: license.startDate.toISOString(),
          endDate: license.endDate.toISOString(),
          renewalDate: license.renewalDate?.toISOString(),
          lastPaymentDate: license.lastPaymentDate?.toISOString(),
          nextPaymentDate: license.nextPaymentDate?.toISOString(),
          createdAt: license.createdAt.toISOString(),
          updatedAt: license.updatedAt.toISOString(),
          package: {
            ...license.package,
            basePrice: license.package.basePrice.toNumber(),
            createdAt: license.package.createdAt.toISOString(),
            updatedAt: license.package.updatedAt.toISOString(),
          },
        })),
        total,
        page,
        pageSize,
      });
    },
    'license'
  );
}

// POST /api/admin/tenant-licenses - Create tenant license
export async function POST(request: NextRequest) {
  return withoutTenant<ApiResponse<{ license: unknown }>>(
    async () => {
      const body = await request.json();
      
      // Validate input
      const validatedData = tenantLicenseCreateSchema.parse(body);

      // Check if tenant exists
      const tenant = await corePrisma.tenant.findUnique({
        where: { id: validatedData.tenantId },
      });

      if (!tenant) {
        return errorResponse('Not Found', 'Tenant not found', 404);
      }

      // Check if package exists
      const pkg = await corePrisma.licensePackage.findUnique({
        where: { id: validatedData.packageId },
      });

      if (!pkg) {
        return errorResponse('Not Found', 'License package not found', 404);
      }

      // Create license
      const license = await corePrisma.tenantLicense.create({
        data: {
          tenantId: validatedData.tenantId,
          packageId: validatedData.packageId,
          startDate: new Date(validatedData.startDate),
          endDate: new Date(validatedData.endDate),
          ...(validatedData.renewalDate ? { renewalDate: new Date(validatedData.renewalDate) } : {}),
          status: validatedData.status,
          paymentStatus: validatedData.paymentStatus,
          ...(validatedData.notes !== null && validatedData.notes !== undefined ? { notes: validatedData.notes } : {}),
        },
        include: {
          package: true,
          tenant: {
            select: {
              id: true,
              slug: true,
              name: true,
            },
          },
        },
      });

      return successResponse({
        license: {
          ...license,
          startDate: license.startDate.toISOString(),
          endDate: license.endDate.toISOString(),
          renewalDate: license.renewalDate?.toISOString(),
          lastPaymentDate: license.lastPaymentDate?.toISOString(),
          nextPaymentDate: license.nextPaymentDate?.toISOString(),
          createdAt: license.createdAt.toISOString(),
          updatedAt: license.updatedAt.toISOString(),
          package: {
            ...license.package,
            basePrice: license.package.basePrice.toNumber(),
            createdAt: license.package.createdAt.toISOString(),
            updatedAt: license.package.updatedAt.toISOString(),
          },
        },
      });
    },
    'license'
  );
}







