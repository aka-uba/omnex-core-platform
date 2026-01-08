import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import QRCode from 'qrcode';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/real-estate/apartments/[id]/qr-code
 * Generate QR code for an apartment
 * Returns QR code as SVG string or PNG data URL
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{ qrCode: string; qrCodeUrl: string }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const searchParams = request.nextUrl.searchParams;
      const format = searchParams.get('format'); // 'svg' or 'png'
      const size = parseInt(searchParams.get('size') || '100', 10) || 100;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get apartment with property
      const apartment = await tenantPrisma.apartment.findUnique({
        where: { id },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
            },
          },
        },
      });

      if (!apartment) {
        return errorResponse('Not found', 'Apartment not found', 404);
      }

      // Ensure apartment belongs to tenant
      if (apartment.tenantId !== tenantContext.id) {
        return errorResponse('Forbidden', 'Apartment belongs to different tenant', 403);
      }

      // Generate QR code data
      // QR code will contain a URL to the PUBLIC preview page (no auth required)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const locale = searchParams.get('locale') || 'tr';
      // Use public URL with tenant slug for public access
      const qrData = `${baseUrl}/public/apartments/${apartment.id}?tenant=${tenantContext.slug}&locale=${locale}`;

      try {
        let qrCode: string;
        let qrCodeUrl: string;

        if (format === 'png') {
          // Generate PNG as data URL
          qrCodeUrl = await QRCode.toDataURL(qrData, {
            width: size,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });
          qrCode = qrCodeUrl;
        } else {
          // Generate SVG
          qrCode = await QRCode.toString(qrData, {
            type: 'svg',
            width: size,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });
          qrCodeUrl = `data:image/svg+xml;base64,${Buffer.from(qrCode).toString('base64')}`;
        }

        // Update apartment with QR code string (if not already set)
        if (!apartment.qrCode) {
          await tenantPrisma.apartment.update({
            where: { id },
            data: {
              qrCode: qrData,
            },
          });
        }

        return successResponse({
          qrCode,
          qrCodeUrl,
        });
      } catch (error: any) {
        return errorResponse('QR Code generation failed', error.message || 'Failed to generate QR code', 500);
      }
    },
    { required: true, module: 'real-estate' }
  );
}








