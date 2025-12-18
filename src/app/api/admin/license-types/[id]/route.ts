// License Types API Route - Admin (Single)
// GET /api/admin/license-types/[id] - Get license type
// PATCH /api/admin/license-types/[id] - Update license type
// DELETE /api/admin/license-types/[id] - Delete license type

import { NextRequest } from 'next/server';
import { withoutTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { corePrisma } from '@/lib/corePrisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/license-types/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withoutTenant<ApiResponse<unknown>>(
    async () => {
      const { id } = await params;

      const licenseType = await corePrisma.licenseType.findUnique({
        where: { id },
        include: {
          _count: {
            select: { packages: true },
          },
        },
      });

      if (!licenseType) {
        return errorResponse('Not Found', 'License type not found', 404);
      }

      return successResponse({
        ...licenseType,
        createdAt: licenseType.createdAt.toISOString(),
        updatedAt: licenseType.updatedAt.toISOString(),
      });
    },
    'license'
  );
}

// PATCH /api/admin/license-types/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withoutTenant<ApiResponse<{ type: unknown }>>(
    async () => {
      const { id } = await params;
      const body = await request.json();

      // Check if type exists
      const existingType = await corePrisma.licenseType.findUnique({
        where: { id },
      });

      if (!existingType) {
        return errorResponse('Not Found', 'License type not found', 404);
      }

      // If setting as default, unset other defaults
      if (body.isDefault === true) {
        await corePrisma.licenseType.updateMany({
          where: { isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      const licenseType = await corePrisma.licenseType.update({
        where: { id },
        data: {
          ...(body.name !== undefined && { name: body.name }),
          ...(body.displayName !== undefined && { displayName: body.displayName }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.color !== undefined && { color: body.color }),
          ...(body.icon !== undefined && { icon: body.icon }),
          ...(body.maxUsers !== undefined && { maxUsers: body.maxUsers }),
          ...(body.maxStorage !== undefined && { maxStorage: body.maxStorage }),
          ...(body.maxCompanies !== undefined && { maxCompanies: body.maxCompanies }),
          ...(body.features !== undefined && { features: body.features }),
          ...(body.defaultDurationDays !== undefined && { defaultDurationDays: body.defaultDurationDays }),
          ...(body.trialDays !== undefined && { trialDays: body.trialDays }),
          ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
          ...(body.isActive !== undefined && { isActive: body.isActive }),
          ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
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

// DELETE /api/admin/license-types/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withoutTenant<ApiResponse<{ deleted: boolean }>>(
    async () => {
      const { id } = await params;

      // Check if type exists
      const existingType = await corePrisma.licenseType.findUnique({
        where: { id },
        include: {
          _count: {
            select: { packages: true },
          },
        },
      });

      if (!existingType) {
        return errorResponse('Not Found', 'License type not found', 404);
      }

      // Don't allow deletion if there are packages using this type
      if (existingType._count.packages > 0) {
        return errorResponse(
          'Conflict',
          'Cannot delete license type with existing packages',
          409
        );
      }

      await corePrisma.licenseType.delete({
        where: { id },
      });

      return successResponse({ deleted: true });
    },
    'license'
  );
}
