import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { realEstateStaffSchema } from '@/modules/real-estate/schemas/staff.schema';
import { Prisma } from '@prisma/tenant-client';
import { z } from 'zod';

// GET /api/real-estate/staff - List staff
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ staff: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
      const search = searchParams.get('search') || undefined;
      const staffType = searchParams.get('staffType') || undefined;
      const role = searchParams.get('role') || undefined;
      const isActive = searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined;
      const companyId = searchParams.get('companyId') || undefined;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get companyId from query or use first company
      let finalCompanyId = companyId;
      if (!finalCompanyId) {
        const firstCompany = await tenantPrisma.company.findFirst({
          select: { id: true },
          orderBy: { createdAt: 'asc' },
        });
        finalCompanyId = firstCompany?.id;
      }

      // Build where clause
      // Build where clause with tenant and company isolation (defense-in-depth)
      const where: Prisma.RealEstateStaffWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(staffType && { staffType }),
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }),
      };

      // Get total count
      const total = await tenantPrisma.realEstateStaff.count({ where });

      // Get staff
      const staff = await tenantPrisma.realEstateStaff.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      return successResponse({
        staff,
        total,
        page,
        pageSize,
      });
    }
  );
}

// POST /api/real-estate/staff - Create staff
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ staff: unknown }>>(
    request,
    async (tenantPrisma) => {
      try {
        const body = await request.json();

        // Validate input
        const validatedData = realEstateStaffSchema.parse(body);

        // Get tenant context
        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
          return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
        }

        // Get companyId from query or use first company
        const searchParams = request.nextUrl.searchParams;
        let companyId = searchParams.get('companyId') || undefined;
        if (!companyId) {
          const firstCompany = await tenantPrisma.company.findFirst({
            select: { id: true },
            orderBy: { createdAt: 'asc' },
          });
          companyId = firstCompany?.id;
        }

        if (!companyId) {
          return errorResponse('Company required', 'No company found', 400);
        }

        // Check if internal staff with userId already exists
        if (validatedData.staffType === 'internal' && validatedData.userId) {
          const existing = await tenantPrisma.realEstateStaff.findFirst({
            where: {
              tenantId: tenantContext.id,
              userId: validatedData.userId,
            },
          });

          if (existing) {
            return errorResponse('Staff already exists', 'A staff record with this user ID already exists', 409);
          }
        }

        // Calculate assignedUnits
        const assignedUnits = validatedData.apartmentIds?.length || 0;

        // Create staff
        const staff = await tenantPrisma.realEstateStaff.create({
          data: {
            tenantId: tenantContext.id,
            companyId,
            userId: validatedData.userId || null,
            name: validatedData.name,
            email: validatedData.email || null,
            phone: validatedData.phone || null,
            staffType: validatedData.staffType,
            role: validatedData.role,
            permissions: validatedData.permissions ? (validatedData.permissions as any) : null,
            propertyIds: validatedData.propertyIds || [],
            apartmentIds: validatedData.apartmentIds || [],
            assignedUnits,
            notes: validatedData.notes || null,
            isActive: true,
          },
        });

        return successResponse({ staff });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const firstError = error.issues[0];
          return errorResponse('Validation error', firstError?.message || 'Invalid input', 400);
        }
        console.error('Error creating staff:', error);
        return errorResponse(
          'Failed to create staff',
          error instanceof Error ? error.message : 'Unknown error',
          500
        );
      }
    }
  );
}

