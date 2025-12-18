// License Service API Route - Admin
// GET /api/admin/licenses - List license packages
// POST /api/admin/licenses - Create license package

import { NextRequest } from 'next/server';
import { withoutTenant } from '@/lib/api/withTenant';
import { successResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { corePrisma } from '@/lib/corePrisma';
import { licensePackageCreateSchema } from '@/modules/license/schemas/license.schema';
import { Prisma } from '@prisma/core-client';

// GET /api/admin/licenses - List license packages
export async function GET(request: NextRequest) {
  return withoutTenant<ApiResponse<{ packages: unknown[]; total: number; page: number; pageSize: number }>>(
    async () => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = parseInt(searchParams.get('pageSize') || '10');
      const search = searchParams.get('search') || undefined;
      const isActive = searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined;
      const billingCycle = searchParams.get('billingCycle') || undefined;

      // Build where clause
      const where: Prisma.LicensePackageWhereInput = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(isActive !== undefined && { isActive }),
        ...(billingCycle && { billingCycle }),
      };

      // Get packages with pagination
      const [packages, total] = await Promise.all([
        corePrisma.licensePackage.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        corePrisma.licensePackage.count({ where }),
      ]);

      return successResponse({
        packages: packages.map(pkg => ({
          ...pkg,
          basePrice: pkg.basePrice.toNumber(),
          createdAt: pkg.createdAt.toISOString(),
          updatedAt: pkg.updatedAt.toISOString(),
        })),
        total,
        page,
        pageSize,
      });
    },
    'license'
  );
}

// POST /api/admin/licenses - Create license package
export async function POST(request: NextRequest) {
  return withoutTenant<ApiResponse<{ package: unknown }>>(
    async () => {
      const body = await request.json();
      
      // Validate input
      const validatedData = licensePackageCreateSchema.parse(body);

      // Create package
      const pkg = await corePrisma.licensePackage.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          modules: validatedData.modules,
          basePrice: validatedData.basePrice,
          currency: validatedData.currency,
          billingCycle: validatedData.billingCycle,
          maxUsers: validatedData.maxUsers,
          maxStorage: validatedData.maxStorage,
          features: validatedData.features ? (validatedData.features as any) : null,
          isActive: validatedData.isActive,
        },
      });

      return successResponse({
        package: {
          ...pkg,
          basePrice: pkg.basePrice.toNumber(),
          createdAt: pkg.createdAt.toISOString(),
          updatedAt: pkg.updatedAt.toISOString(),
        },
      });
    },
    'license'
  );
}

