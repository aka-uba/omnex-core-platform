/**
 * Entity Activity History API
 * 
 * GET /api/audit-logs/entity/[entity]/[entityId] - Get entity activity history
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/api/tenantContext';
import { getEntityActivityHistory } from '@/lib/services/auditLogService';
/**
 * GET /api/audit-logs/entity/[entity]/[entityId]
 * Get entity activity history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string; entityId: string }> }
) {
  try {
    const tenant = await requireTenant(request);
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10) || 10;
    const resolvedParams = await params;

    const history = await getEntityActivityHistory(
      tenant,
      resolvedParams.entity,
      resolvedParams.entityId,
      limit
    );

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error: any) {
    console.error('Error fetching entity activity history:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch entity activity history',
      },
      { status: 500 }
    );
  }
}


