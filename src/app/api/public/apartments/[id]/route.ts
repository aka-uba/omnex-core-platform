import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/public/apartments/[id]
 * Public endpoint to get apartment details (no authentication required)
 * Used for QR code scanning
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ apartment: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context (required for withTenant, but no auth check)
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      const apartment = await tenantPrisma.apartment.findUnique({
        where: { id },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              type: true,
              address: true,
              city: true,
              district: true,
            },
          },
        },
      });

      if (!apartment) {
        return errorResponse('Not found', 'Apartment not found', 404);
      }

      // Return limited public information (no sensitive data)
      return successResponse({
        apartment: {
          id: apartment.id,
          unitNumber: apartment.unitNumber,
          floor: apartment.floor,
          block: apartment.block,
          area: apartment.area,
          roomCount: apartment.roomCount,
          bathroomCount: apartment.bathroomCount,
          balcony: apartment.balcony,
          livingRoom: apartment.livingRoom,
          status: apartment.status,
          description: apartment.description,
          images: apartment.images || [],
          coverImage: apartment.coverImage,
          property: apartment.property,
          // Exclude sensitive fields like rentPrice, salePrice, contracts, payments, etc.
        },
      });
    },
    { required: false, module: 'real-estate' } // required: false means no authentication needed
  );
}

