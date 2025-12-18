/**
 * Audit Logs API
 * 
 * GET /api/audit-logs - List audit logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/api/tenantContext';
import { getAuditLogs } from '@/lib/services/auditLogService';
/**
 * GET /api/audit-logs
 * List audit logs with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const tenant = await requireTenant(request);
    const searchParams = request.nextUrl.searchParams;

    const filters: {
      userId?: string;
      action?: string;
      entity?: string;
      entityId?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      pageSize?: number;
    } = {
      page: parseInt(searchParams.get('page') || '1', 10) || 1,
      pageSize: parseInt(searchParams.get('pageSize') || '10', 10) || 10,
    };

    const userId = searchParams.get('userId');
    if (userId) filters.userId = userId;
    const action = searchParams.get('action');
    if (action) filters.action = action;
    const entity = searchParams.get('entity');
    if (entity) filters.entity = entity;
    const entityId = searchParams.get('entityId');
    if (entityId) filters.entityId = entityId;
    const startDate = searchParams.get('startDate');
    if (startDate) filters.startDate = new Date(startDate);
    const endDate = searchParams.get('endDate');
    if (endDate) filters.endDate = new Date(endDate);

    const result = await getAuditLogs(tenant, filters);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch audit logs',
      },
      { status: 500 }
    );
  }
}


