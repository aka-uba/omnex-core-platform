/**
 * User Activity Timeline API
 * 
 * GET /api/audit-logs/user/[userId] - Get user activity timeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/api/tenantContext';
import { getUserActivityTimeline } from '@/lib/services/auditLogService';
/**
 * GET /api/audit-logs/user/[userId]
 * Get user activity timeline
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const tenant = await requireTenant(request);
    const searchParams = request.nextUrl.searchParams;
    // Limit'i 50'ye düşür (performans için)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10) || 10, 100);
    const resolvedParams = await params;

    const timeline = await getUserActivityTimeline(tenant, resolvedParams.userId, limit);

    return NextResponse.json({
      success: true,
      timeline,
    });
  } catch (error: any) {
    console.error('Error fetching user activity timeline:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch user activity timeline',
      },
      { status: 500 }
    );
  }
}


