import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';

// GET /api/real-estate/email/campaigns/[id] - Get single email campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ campaign: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get campaign
      const campaign = await tenantPrisma.emailCampaign.findUnique({
        where: { id },
        include: {
          template: {
            select: {
              id: true,
              name: true,
              category: true,
              subject: true,
            },
          },
        },
      });

      if (!campaign) {
        return errorResponse('Campaign not found', 'Email campaign not found', 404);
      }

      // Check tenant access
      if (campaign.tenantId !== tenantContext.id) {
        return errorResponse('Forbidden', 'Access denied', 403);
      }

      return successResponse({ campaign });
    }
  );
}

// PATCH /api/real-estate/email/campaigns/[id] - Update email campaign
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ campaign: unknown }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;
      const body = await request.json();

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get existing campaign
      const existing = await tenantPrisma.emailCampaign.findUnique({
        where: { id },
      });

      if (!existing) {
        return errorResponse('Campaign not found', 'Email campaign not found', 404);
      }

      // Check tenant access
      if (existing.tenantId !== tenantContext.id) {
        return errorResponse('Forbidden', 'Access denied', 403);
      }

      // Update campaign
      const campaign = await tenantPrisma.emailCampaign.update({
        where: { id },
        data: {
          ...(body.name && { name: body.name }),
          ...(body.recipients && { recipients: body.recipients, recipientCount: body.recipients.length }),
          ...(body.customContent && { customContent: body.customContent }),
          ...(body.scheduledAt !== undefined && { scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null }),
          ...(body.status && { status: body.status }),
          ...(body.notes !== undefined && { notes: body.notes }),
        },
        include: {
          template: {
            select: {
              id: true,
              name: true,
              category: true,
              subject: true,
            },
          },
        },
      });

      return successResponse({ campaign });
    }
  );
}

// DELETE /api/real-estate/email/campaigns/[id] - Delete email campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenant<ApiResponse<{ success: boolean }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get existing campaign
      const existing = await tenantPrisma.emailCampaign.findUnique({
        where: { id },
      });

      if (!existing) {
        return errorResponse('Campaign not found', 'Email campaign not found', 404);
      }

      // Check tenant access
      if (existing.tenantId !== tenantContext.id) {
        return errorResponse('Forbidden', 'Access denied', 403);
      }

      // Delete campaign
      await tenantPrisma.emailCampaign.delete({
        where: { id },
      });

      return successResponse({ success: true });
    }
  );
}








