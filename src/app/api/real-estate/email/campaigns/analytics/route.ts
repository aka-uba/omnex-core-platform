import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';
import { Prisma } from '@prisma/tenant-client';
import dayjs from 'dayjs';

interface EmailAnalytics {
  summary: {
    totalCampaigns: number;
    totalSent: number;
    totalRecipients: number;
    totalOpened: number;
    totalClicked: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
  statusBreakdown: Array<{
    status: string;
    count: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    sent: number;
    opened: number;
    clicked: number;
  }>;
  topTemplates: Array<{
    templateId: string;
    templateName: string;
    sent: number;
    openRate: number;
    clickRate: number;
  }>;
  recentCampaigns: Array<{
    id: string;
    name: string;
    sentAt: Date | null;
    sentCount: number;
    openedCount: number;
    clickedCount: number;
  }>;
}

// GET /api/real-estate/email/campaigns/analytics - Get email analytics
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ analytics: EmailAnalytics }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');
      const companyId = searchParams.get('companyId') || undefined;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get companyId using helper function (cached)
      const finalCompanyId: string | undefined = companyId || ((await getCompanyIdFromRequest(request, tenantPrisma)) || undefined);

      // Build date filter
      const dateFilter: Prisma.EmailCampaignWhereInput = {};
      if (dateFrom || dateTo) {
        dateFilter.createdAt = {};
        if (dateFrom) {
          dateFilter.createdAt.gte = new Date(dateFrom);
        }
        if (dateTo) {
          dateFilter.createdAt.lte = new Date(dateTo);
        }
      }

      // Base where clause
      // Build where clause with tenant and company isolation (defense-in-depth)
      const where: Prisma.EmailCampaignWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...dateFilter,
      };

      // Get all campaigns for analytics
      const campaigns = await tenantPrisma.emailCampaign.findMany({
        where,
        include: {
          template: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // If no campaigns found, return empty analytics structure
      if (campaigns.length === 0) {
        const emptyAnalytics: EmailAnalytics = {
          summary: {
            totalCampaigns: 0,
            totalSent: 0,
            totalRecipients: 0,
            totalOpened: 0,
            totalClicked: 0,
            openRate: 0,
            clickRate: 0,
            conversionRate: 0,
          },
          statusBreakdown: [
            { status: 'draft', count: 0 },
            { status: 'scheduled', count: 0 },
            { status: 'sending', count: 0 },
            { status: 'sent', count: 0 },
            { status: 'failed', count: 0 },
          ],
          monthlyTrend: [],
          topTemplates: [],
          recentCampaigns: [],
        };
        return successResponse({ analytics: emptyAnalytics });
      }

      // Calculate summary
      const totalCampaigns = campaigns.length;
      const totalSent = campaigns.filter((c) => c.status === 'sent').length;
      const totalRecipients = campaigns.reduce((sum, c) => sum + c.recipientCount, 0);
      const totalOpened = campaigns.reduce((sum, c) => sum + c.openedCount, 0);
      const totalClicked = campaigns.reduce((sum, c) => sum + c.clickedCount, 0);
      const totalSentCount = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
      
      const openRate = totalSentCount > 0 ? (totalOpened / totalSentCount) * 100 : 0;
      const clickRate = totalSentCount > 0 ? (totalClicked / totalSentCount) * 100 : 0;
      const conversionRate = totalSentCount > 0 ? (campaigns.reduce((sum, c) => sum + c.conversionCount, 0) / totalSentCount) * 100 : 0;

      // Status breakdown
      const statusBreakdown = [
        { status: 'draft', count: campaigns.filter((c) => c.status === 'draft').length },
        { status: 'scheduled', count: campaigns.filter((c) => c.status === 'scheduled').length },
        { status: 'sending', count: campaigns.filter((c) => c.status === 'sending').length },
        { status: 'sent', count: campaigns.filter((c) => c.status === 'sent').length },
        { status: 'failed', count: campaigns.filter((c) => c.status === 'failed').length },
      ];

      // Monthly trend (last 12 months)
      const monthlyTrend: Array<{ month: string; sent: number; opened: number; clicked: number }> = [];
      for (let i = 11; i >= 0; i--) {
        const month = dayjs().subtract(i, 'month');
        const monthStart = month.startOf('month').toDate();
        const monthEnd = month.endOf('month').toDate();
        
        const monthCampaigns = campaigns.filter(
          (c) => c.sentAt && c.sentAt >= monthStart && c.sentAt <= monthEnd
        );
        
        monthlyTrend.push({
          month: month.format('YYYY-MM'),
          sent: monthCampaigns.reduce((sum, c) => sum + c.sentCount, 0),
          opened: monthCampaigns.reduce((sum, c) => sum + c.openedCount, 0),
          clicked: monthCampaigns.reduce((sum, c) => sum + c.clickedCount, 0),
        });
      }

      // Top templates
      const templateStats = new Map<string, { templateName: string; sent: number; opened: number; clicked: number }>();
      campaigns.forEach((campaign) => {
        if (campaign.template) {
          const key = campaign.templateId;
          const existing = templateStats.get(key) || {
            templateName: campaign.template.name,
            sent: 0,
            opened: 0,
            clicked: 0,
          };
          existing.sent += campaign.sentCount;
          existing.opened += campaign.openedCount;
          existing.clicked += campaign.clickedCount;
          templateStats.set(key, existing);
        }
      });

      const topTemplates = Array.from(templateStats.entries())
        .map(([templateId, stats]) => ({
          templateId,
          templateName: stats.templateName,
          sent: stats.sent,
          openRate: stats.sent > 0 ? (stats.opened / stats.sent) * 100 : 0,
          clickRate: stats.sent > 0 ? (stats.clicked / stats.sent) * 100 : 0,
        }))
        .sort((a, b) => b.sent - a.sent)
        .slice(0, 10);

      // Recent campaigns (last 10)
      const recentCampaigns = campaigns
        .filter((c) => c.sentAt)
        .sort((a, b) => (b.sentAt?.getTime() || 0) - (a.sentAt?.getTime() || 0))
        .slice(0, 10)
        .map((c) => ({
          id: c.id,
          name: c.name,
          sentAt: c.sentAt,
          sentCount: c.sentCount,
          openedCount: c.openedCount,
          clickedCount: c.clickedCount,
        }));

      const analytics: EmailAnalytics = {
        summary: {
          totalCampaigns,
          totalSent,
          totalRecipients,
          totalOpened,
          totalClicked,
          openRate: Math.round(openRate * 100) / 100,
          clickRate: Math.round(clickRate * 100) / 100,
          conversionRate: Math.round(conversionRate * 100) / 100,
        },
        statusBreakdown,
        monthlyTrend,
        topTemplates,
        recentCampaigns,
      };

      return successResponse({ analytics });
    }
  );
}








