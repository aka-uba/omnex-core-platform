import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { equipmentQuerySchema, equipmentCreateSchema } from '@/lib/schemas/equipment';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
// GET /api/equipment - List equipment
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ equipment: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse and validate query parameters
      const query = equipmentQuerySchema.parse({
        page: searchParams.get('page'),
        pageSize: searchParams.get('pageSize'),
        search: searchParams.get('search') || '',
        category: searchParams.get('category') || undefined,
        type: searchParams.get('type') || undefined,
        status: searchParams.get('status') || undefined,
        locationId: searchParams.get('locationId') || undefined,
        isActive: searchParams.get('isActive') || undefined,
        companyId: searchParams.get('companyId') || undefined,
      });

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get companyId from query or use first company
      let companyId = query.companyId;
      if (!companyId) {
        const firstCompany = await tenantPrisma.company.findFirst({
          select: { id: true },
          orderBy: { createdAt: 'asc' },
        });
        companyId = firstCompany?.id;
      }

      // Build where clause
      const where: {
        OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; code?: { contains: string; mode: 'insensitive' }; serialNumber?: { contains: string; mode: 'insensitive' } }>;
        category?: string;
        type?: string;
        status?: string;
        locationId?: string | null;
        isActive?: boolean;
        companyId?: string;
      } = {
        ...(companyId ? { companyId } : {}),
      };

      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { code: { contains: query.search, mode: 'insensitive' } },
          { serialNumber: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      if (query.category) {
        where.category = query.category;
      }

      if (query.type) {
        where.type = query.type;
      }

      if (query.status) {
        where.status = query.status;
      }

      if (query.locationId !== undefined) {
        where.locationId = query.locationId;
      }

      if (query.isActive !== undefined) {
        where.isActive = query.isActive;
      }

      // Get total count
      const total = await tenantPrisma.equipment.count({ where });

      // Get paginated equipment
      const equipment = await tenantPrisma.equipment.findMany({
        where,
        skip: (parseInt(query.page) - 1) * parseInt(query.pageSize),
        take: parseInt(query.pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          location: {
            select: {
              id: true,
              name: true,
              type: true,
              code: true,
            },
          },
        },
      });

      return successResponse({
        equipment: equipment.map(item => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
          purchaseDate: item.purchaseDate?.toISOString() || null,
          warrantyUntil: item.warrantyUntil?.toISOString() || null,
          attributes: item.attributes || {},
        })),
        total,
        page: parseInt(query.page),
        pageSize: parseInt(query.pageSize),
      });
    },
    { required: true, module: 'equipment' }
  );
}

// POST /api/equipment - Create equipment
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ equipment: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Validate request body
      const validatedData = equipmentCreateSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get companyId from first company
      const firstCompany = await tenantPrisma.company.findFirst({
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });

      if (!firstCompany) {
        return errorResponse('Validation error', 'No company found for tenant', 404);
      }

      const companyId = firstCompany.id;

      // Check if location exists (if provided)
      if (validatedData.locationId) {
        const location = await tenantPrisma.location.findUnique({
          where: { id: validatedData.locationId },
        });

        if (!location) {
          return errorResponse('Validation error', 'Location not found', 404);
        }

        // Ensure location belongs to same company
        if (location.companyId !== companyId) {
          return errorResponse('Validation error', 'Location belongs to different company', 403);
        }
      }

      // Create equipment
      const newEquipment = await tenantPrisma.equipment.create({
        data: {
          tenantId: tenantContext.id,
          companyId: companyId,
          name: validatedData.name,
          code: validatedData.code || null,
          category: validatedData.category,
          type: validatedData.type,
          brand: validatedData.brand || null,
          model: validatedData.model || null,
          serialNumber: validatedData.serialNumber || null,
          locationId: validatedData.locationId || null,
          attributes: validatedData.attributes ? (validatedData.attributes as Prisma.InputJsonValue) : {},
          status: validatedData.status || 'active',
          description: validatedData.description || null,
          purchaseDate: validatedData.purchaseDate ? new Date(validatedData.purchaseDate) : null,
          warrantyUntil: validatedData.warrantyUntil ? new Date(validatedData.warrantyUntil) : null,
          isActive: validatedData.isActive ?? true,
        },
        include: {
          location: {
            select: {
              id: true,
              name: true,
              type: true,
              code: true,
            },
          },
        },
      });

      return successResponse({
        equipment: {
          ...newEquipment,
          createdAt: newEquipment.createdAt.toISOString(),
          updatedAt: newEquipment.updatedAt.toISOString(),
          purchaseDate: newEquipment.purchaseDate?.toISOString() || null,
          warrantyUntil: newEquipment.warrantyUntil?.toISOString() || null,
          attributes: newEquipment.attributes || {},
        },
      });
    },
    { required: true, module: 'equipment' }
  );
}

