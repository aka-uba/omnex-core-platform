// License Types API Route - Admin
// GET /api/admin/license-types - List license types
// POST /api/admin/license-types - Create license type

import { NextRequest } from 'next/server';
import { withoutTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { corePrisma } from '@/lib/corePrisma';
import { Prisma } from '@prisma/core-client';

// GET /api/admin/license-types - List license types
export async function GET(request: NextRequest) {
  return withoutTenant<ApiResponse<unknown[]>>(
    async () => {
      const searchParams = request.nextUrl.searchParams;
      const includeInactive = searchParams.get('includeInactive') === 'true';

      const where: Prisma.LicenseTypeWhereInput = includeInactive ? {} : { isActive: true };

      const licenseTypes = await corePrisma.licenseType.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: {
            select: { packages: true },
          },
        },
      });

      return successResponse(
        licenseTypes.map((type) => ({
          ...type,
          createdAt: type.createdAt.toISOString(),
          updatedAt: type.updatedAt.toISOString(),
        }))
      );
    },
    'license'
  );
}

// POST /api/admin/license-types - Create license type
export async function POST(request: NextRequest) {
  return withoutTenant<ApiResponse<{ type: unknown }>>(
    async () => {
      const body = await request.json();

      const {
        name,
        displayName,
        description,
        color,
        icon,
        maxUsers,
        maxStorage,
        maxCompanies,
        features,
        defaultDurationDays,
        trialDays,
        sortOrder,
        isActive,
        isDefault,
      } = body;

      // Validate required fields
      if (!name || !displayName) {
        return errorResponse('Validation Error', 'Name and displayName are required', 400);
      }

      // If setting as default, unset other defaults
      if (isDefault) {
        await corePrisma.licenseType.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      const licenseType = await corePrisma.licenseType.create({
        data: {
          name,
          displayName,
          description,
          color,
          icon,
          maxUsers,
          maxStorage,
          maxCompanies,
          features: features || [],
          defaultDurationDays: defaultDurationDays || 365,
          trialDays: trialDays || 0,
          sortOrder: sortOrder || 0,
          isActive: isActive ?? true,
          isDefault: isDefault ?? false,
        },
        include: {
          _count: {
            select: { packages: true },
          },
        },
      });

      return successResponse({
        type: {
          ...licenseType,
          createdAt: licenseType.createdAt.toISOString(),
          updatedAt: licenseType.updatedAt.toISOString(),
        },
      });
    },
    'license'
  );
}
