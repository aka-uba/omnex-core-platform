import { NextRequest, NextResponse } from 'next/server';
import { getTenantPrismaFromRequest } from '@/lib/api/tenantContext';

// PATCH /api/notifications/[id]/archive
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantPrisma = await getTenantPrismaFromRequest(request);
    if (!tenantPrisma) {
      return NextResponse.json(
        { error: 'Tenant context is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { archived } = body;
    const resolvedParams = await params;

    const notification = await tenantPrisma.notification.update({
      where: { id: resolvedParams.id },
      data: {
        archivedAt: archived ? new Date() : null,
        status: archived ? 'archived' : 'unread',
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
        recipient: {
          select: { id: true, name: true, email: true },
        },
        attachments: true,
      },
    });

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('Error archiving notification:', error);
    return NextResponse.json(
      { error: 'Failed to archive notification' },
      { status: 500 }
    );
  }
}


