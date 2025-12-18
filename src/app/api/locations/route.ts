import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { locationQuerySchema, locationCreateSchema } from '@/lib/schemas/location';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { requireCompanyId } from '@/lib/api/companyContext';
import { Prisma } from '@prisma/tenant-client';
import type { ZodIssue } from 'zod';
// GET /api/locations - List locations
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ locations: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse and validate query parameters
      const query = locationQuerySchema.safeParse({
        page: searchParams.get('page'),
        pageSize: searchParams.get('pageSize'),
        search: searchParams.get('search') || undefined,
        type: searchParams.get('type') || undefined,
        parentId: searchParams.get('parentId') || undefined,
        isActive: searchParams.get('isActive') || undefined,
        companyId: searchParams.get('companyId') || undefined,
      });

      if (!query.success) {
        return errorResponse(
          'Validation error',
          `Invalid query parameters: ${query.error.issues.map((e: ZodIssue) => `${e.path.map(String).join('.')}: ${e.message}`).join(', ')}`,
          400
        );
      }

      const validatedQuery = query.data;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get companyId from query or use first company
      let companyId = validatedQuery.companyId;
      if (!companyId) {
        try {
          companyId = await requireCompanyId(request, tenantPrisma);
        } catch (error: any) {
          // If requireCompanyId throws, it means no company found
          return error;
        }
      }

      // Build where clause
      const where: {
        OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; code?: { contains: string; mode: 'insensitive' } }>;
        type?: string;
        parentId?: string | null;
        isActive?: boolean;
        companyId?: string;
      } = {
        ...(companyId ? { companyId } : {}),
      };

      if (validatedQuery.search) {
        where.OR = [
          { name: { contains: validatedQuery.search, mode: 'insensitive' } },
          { code: { contains: validatedQuery.search, mode: 'insensitive' } },
        ];
      }

      if (validatedQuery.type) {
        where.type = validatedQuery.type;
      }

      if (validatedQuery.parentId !== undefined) {
        where.parentId = validatedQuery.parentId;
      }

      if (validatedQuery.isActive !== undefined) {
        where.isActive = validatedQuery.isActive;
      }

      // Get total count
      const total = await tenantPrisma.location.count({ where });

      // Get paginated locations
      const locations = await tenantPrisma.location.findMany({
        where,
        skip: (parseInt(validatedQuery.page) - 1) * parseInt(validatedQuery.pageSize),
        take: parseInt(validatedQuery.pageSize),
        orderBy: { createdAt: 'desc' },
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

      const mappedLocations = locations.map(location => {
        // Handle Prisma.Decimal and null values properly
        // Prisma.Decimal null is still an object in JavaScript (typeof null === 'object')
        let lat: number | null = null;
        let lon: number | null = null;
        
        // Check for null/undefined first (before typeof check)
        const hasLat = location.latitude !== null && location.latitude !== undefined;
        const hasLon = location.longitude !== null && location.longitude !== undefined;
        
        if (hasLat) {
          try {
            const latValue = Number(location.latitude);
            lat = !isNaN(latValue) ? latValue : null;
          } catch (e) {
            lat = null;
          }
        }
        
        if (hasLon) {
          try {
            const lonValue = Number(location.longitude);
            lon = !isNaN(lonValue) ? lonValue : null;
          } catch (e) {
            lon = null;
          }
        }
        
        return {
          ...location,
          latitude: lat,
          longitude: lon,
          createdAt: location.createdAt.toISOString(),
          updatedAt: location.updatedAt.toISOString(),
          metadata: location.metadata || {},
        };
      });
      
      return successResponse({
        locations: mappedLocations,
        total,
        page: parseInt(validatedQuery.page),
        pageSize: parseInt(validatedQuery.pageSize),
      });
    },
    { required: true, module: 'locations' }
  );
}

// POST /api/locations - Create location
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ location: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Validate request body
      const validationResult = locationCreateSchema.safeParse(body);
      if (!validationResult.success) {
        const errorDetails = validationResult.error.issues.map(issue => {
          const path = issue.path.join('.') || 'root';
          return `${path}: ${issue.message}`;
        }).join(', ');
        console.error('Location create validation error:', {
          body: JSON.stringify(body, null, 2),
          errors: validationResult.error.issues,
          errorDetails,
        });
        return errorResponse(
          'Validation error',
          `Invalid request data: ${errorDetails}`,
          400
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

      // Check if parent exists (if provided)
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
      }

      // Create location
      const newLocation = await tenantPrisma.location.create({
        data: {
          tenantId: tenantContext.id,
          companyId: companyId,
          name: validatedData.name,
          type: validatedData.type,
          code: validatedData.code || null,
          description: validatedData.description || null,
          parentId: validatedData.parentId || null,
          address: validatedData.address || null,
          city: validatedData.city || null,
          country: validatedData.country || null,
          postalCode: validatedData.postalCode || null,
          latitude: validatedData.latitude !== undefined && validatedData.latitude !== null 
            ? new Prisma.Decimal(validatedData.latitude.toString()) 
            : null,
          longitude: validatedData.longitude !== undefined && validatedData.longitude !== null 
            ? new Prisma.Decimal(validatedData.longitude.toString()) 
            : null,
          metadata: validatedData.metadata ? (validatedData.metadata as Prisma.InputJsonValue) : {},
          isActive: validatedData.isActive ?? true,
        },
        include: {
          parent: {
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

      return successResponse({
        location: {
          ...newLocation,
          latitude: newLocation.latitude ? Number(newLocation.latitude) : null,
          longitude: newLocation.longitude ? Number(newLocation.longitude) : null,
          createdAt: newLocation.createdAt.toISOString(),
          updatedAt: newLocation.updatedAt.toISOString(),
          metadata: newLocation.metadata || {},
        },
      });
    },
    { required: true, module: 'locations' }
  );
}

