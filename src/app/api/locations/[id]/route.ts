import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { locationUpdateSchema } from '@/lib/schemas/location';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { requireCompanyId } from '@/lib/api/companyContext';
import { getAuditContext, logUpdate, logDelete } from '@/lib/api/auditHelper';
import { Prisma } from '@prisma/tenant-client';
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/locations/[id] - Get location by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ location: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      const location = await tenantPrisma.location.findUnique({
        where: { id },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              type: true,
              code: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
              type: true,
              code: true,
            },
          },
          equipment: {
            select: {
              id: true,
              name: true,
              code: true,
              category: true,
              type: true,
              status: true,
            },
          },
          _count: {
            select: {
              equipment: true,
              children: true,
            },
          },
        },
      });

      if (!location) {
        return errorResponse('Not found', 'Location not found', 404);
      }

      // Handle Prisma.Decimal and null values properly
      let lat: number | null = null;
      let lon: number | null = null;
      
      if (location.latitude !== null && location.latitude !== undefined) {
        try {
          lat = Number(location.latitude);
          if (isNaN(lat)) lat = null;
        } catch (e) {
          lat = null;
        }
      }
      
      if (location.longitude !== null && location.longitude !== undefined) {
        try {
          lon = Number(location.longitude);
          if (isNaN(lon)) lon = null;
        } catch (e) {
          lon = null;
        }
      }
      
      return successResponse({
        location: {
          ...location,
          latitude: lat,
          longitude: lon,
          createdAt: location.createdAt.toISOString(),
          updatedAt: location.updatedAt.toISOString(),
          metadata: location.metadata || {},
        },
      });
    },
    { required: true, module: 'locations' }
  );
}

// PATCH /api/locations/[id] - Update location
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ location: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const body = await request.json();

      // Validate request body
      const validationResult = locationUpdateSchema.safeParse(body);
      if (!validationResult.success) {
        const errorDetails = validationResult.error.issues.map(issue => {
          const path = issue.path.join('.') || 'root';
          return `${path}: ${issue.message}`;
        }).join(', ');
        console.error('Location update validation error:', {
          body: JSON.stringify(body, null, 2),
          errors: validationResult.error.issues,
          errorDetails,
        });
        return errorResponse(
          'Validation error',
          `Invalid request data: ${errorDetails}`,
          400,
          JSON.stringify({ details: errorDetails, issues: validationResult.error.issues }, null, 2)
        );
      }
      const validatedData = validationResult.data;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get companyId using helper function
      let companyId: string;
      try {
        companyId = await requireCompanyId(request, tenantPrisma);
      } catch (error: any) {
        // If requireCompanyId throws, it means no company found
        return error;
      }

      // Check if location exists
      const existingLocation = await tenantPrisma.location.findUnique({
        where: { id },
      });

      if (!existingLocation) {
        return errorResponse('Not found', 'Location not found', 404);
      }

      // Ensure location belongs to same company
      if (existingLocation.companyId !== companyId) {
        return errorResponse('Forbidden', 'Location belongs to different company', 403);
      }

      // Check if parent exists (if provided and different)
      if (validatedData.parentId !== undefined && validatedData.parentId !== existingLocation.parentId) {
        if (validatedData.parentId) {
          const parent = await tenantPrisma.location.findUnique({
            where: { id: validatedData.parentId },
          });

          if (!parent) {
            return errorResponse('Validation error', 'Parent location not found', 404);
          }

          // Ensure parent belongs to same company
          if (parent.companyId !== companyId) {
            return errorResponse('Validation error', 'Parent location belongs to different company', 403);
          }

          // Prevent circular reference (location cannot be its own parent or ancestor)
          if (validatedData.parentId === id) {
            return errorResponse('Validation error', 'Location cannot be its own parent', 400);
          }

          // Check for circular reference in hierarchy
          let currentParent = await tenantPrisma.location.findUnique({
            where: { id: validatedData.parentId },
            select: { parentId: true },
          });

          while (currentParent?.parentId) {
            if (currentParent.parentId === id) {
              return errorResponse('Validation error', 'Circular reference detected in location hierarchy', 400);
            }
            currentParent = await tenantPrisma.location.findUnique({
              where: { id: currentParent.parentId },
              select: { parentId: true },
            });
          }
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (validatedData.name) updateData.name = validatedData.name;
      if (validatedData.type) updateData.type = validatedData.type;
      if (validatedData.code !== undefined) updateData.code = validatedData.code || null;
      if (validatedData.description !== undefined) updateData.description = validatedData.description || null;
      if (validatedData.parentId !== undefined) updateData.parentId = validatedData.parentId || null;
      if (validatedData.address !== undefined) updateData.address = validatedData.address || null;
      if (validatedData.city !== undefined) updateData.city = validatedData.city || null;
      if (validatedData.country !== undefined) updateData.country = validatedData.country || null;
      if (validatedData.postalCode !== undefined) updateData.postalCode = validatedData.postalCode || null;
      if (validatedData.latitude !== undefined) {
        updateData.latitude = validatedData.latitude !== null 
          ? new Prisma.Decimal(validatedData.latitude.toString()) 
          : null;
      }
      if (validatedData.longitude !== undefined) {
        updateData.longitude = validatedData.longitude !== null 
          ? new Prisma.Decimal(validatedData.longitude.toString()) 
          : null;
      }
      if (validatedData.metadata !== undefined) {
        updateData.metadata = validatedData.metadata ? (validatedData.metadata as Prisma.InputJsonValue) : {};
      }
      if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

      // Update location
      const updatedLocation = await tenantPrisma.location.update({
        where: { id },
        data: updateData as any,
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              type: true,
              code: true,
            },
          },
          children: {
            select: {
              id: true,
              name: true,
              type: true,
              code: true,
            },
          },
          _count: {
            select: {
              equipment: true,
              children: true,
            },
          },
        },
      });

      // Handle Prisma.Decimal and null values properly
      let lat: number | null = null;
      let lon: number | null = null;
      
      if (updatedLocation.latitude !== null && updatedLocation.latitude !== undefined) {
        try {
          lat = Number(updatedLocation.latitude);
          if (isNaN(lat)) lat = null;
        } catch (e) {
          lat = null;
        }
      }
      
      if (updatedLocation.longitude !== null && updatedLocation.longitude !== undefined) {
        try {
          lon = Number(updatedLocation.longitude);
          if (isNaN(lon)) lon = null;
        } catch (e) {
          lon = null;
        }
      }
      
      // Log audit event
      const auditContext = await getAuditContext(request);
      logUpdate(tenantContext, auditContext, 'Location', id, existingLocation, updatedLocation, companyId);

      return successResponse({
        location: {
          ...updatedLocation,
          latitude: lat,
          longitude: lon,
          createdAt: updatedLocation.createdAt.toISOString(),
          updatedAt: updatedLocation.updatedAt.toISOString(),
          metadata: updatedLocation.metadata || {},
        },
      });
    },
    { required: true, module: 'locations' }
  );
}

// DELETE /api/locations/[id] - Delete location
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ message: string }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get companyId using helper function
      let companyId: string;
      try {
        companyId = await requireCompanyId(request, tenantPrisma);
      } catch (error: any) {
        // If requireCompanyId throws, it means no company found
        return error;
      }

      // Check if location exists
      const existingLocation = await tenantPrisma.location.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              children: true,
              equipment: true,
            },
          },
        },
      });

      if (!existingLocation) {
        return errorResponse('Not found', 'Location not found', 404);
      }

      // Ensure location belongs to same company
      if (existingLocation.companyId !== companyId) {
        return errorResponse('Forbidden', 'Location belongs to different company', 403);
      }

      // Check if location has children
      if (existingLocation._count.children > 0) {
        return errorResponse('Validation error', 'Cannot delete location with child locations', 400);
      }

      // Check if location has equipment
      if (existingLocation._count.equipment > 0) {
        return errorResponse('Validation error', 'Cannot delete location with equipment', 400);
      }

      // Delete location
      await tenantPrisma.location.delete({
        where: { id },
      });

      // Log audit event
      const auditContext = await getAuditContext(request);
      logDelete(tenantContext, auditContext, 'Location', id, companyId, {
        name: existingLocation.name,
        type: existingLocation.type,
        code: existingLocation.code,
      });

      return successResponse({
        message: 'Location deleted successfully',
      });
    },
    { required: true, module: 'locations' }
  );
}

