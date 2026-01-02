import { NextRequest, NextResponse } from 'next/server';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';
import { getAuditContext, logUpdate, logDelete } from '@/lib/api/auditHelper';

// GET /api/notifications/[id]
export async function GET(
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

    const resolvedParams = await params;
    const notification = await tenantPrisma.notification.findUnique({
      where: { id: resolvedParams.id },
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

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const {
      title,
      message,
      type,
      priority,
      sender_id,
      senderId,
      recipient_id,
      recipientId,
      location_id,
      locationId,
      is_read,
      isRead,
      archived_at,
      archivedAt,
      is_global,
      isGlobal,
      expires_at,
      expiresAt,
      data,
      action_url,
      actionUrl,
      action_text,
      actionText,
      module,
      attachments,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (message !== undefined) updateData.message = message;
    if (type !== undefined) updateData.type = type;
    if (priority !== undefined) updateData.priority = priority;
    if (senderId !== undefined || sender_id !== undefined) {
      updateData.senderId = senderId || sender_id || null;
    }
    if (recipientId !== undefined || recipient_id !== undefined) {
      updateData.recipientId = recipientId || recipient_id || null;
    }
    if (locationId !== undefined || location_id !== undefined) {
      updateData.locationId = locationId || location_id || null;
    }
    if (isRead !== undefined || is_read !== undefined) {
      updateData.isRead = isRead !== undefined ? isRead : is_read;
      if (updateData.isRead) {
        updateData.readAt = new Date();
      }
    }
    if (archivedAt !== undefined || archived_at !== undefined) {
      updateData.archivedAt = archivedAt ? new Date(archivedAt) : (archived_at ? new Date(archived_at) : null);
    }
    if (isGlobal !== undefined || is_global !== undefined) {
      updateData.isGlobal = isGlobal !== undefined ? isGlobal : is_global;
    }
    if (expiresAt !== undefined || expires_at !== undefined) {
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : (expires_at ? new Date(expires_at) : null);
    }
    if (data !== undefined) updateData.data = data ? JSON.stringify(data) : null;
    if (actionUrl !== undefined || action_url !== undefined) {
      updateData.actionUrl = actionUrl || action_url || null;
    }
    if (actionText !== undefined || action_text !== undefined) {
      updateData.actionText = actionText || action_text || null;
    }
    if (module !== undefined) updateData.module = module || null;

    // Compute status
    if (updateData.isRead || updateData.archivedAt !== undefined) {
      if (updateData.archivedAt) {
        updateData.status = 'archived';
      } else if (updateData.isRead) {
        updateData.status = 'read';
      } else {
        updateData.status = 'unread';
      }
    }

    const tenantPrisma = await getTenantPrismaFromRequest(request);
    if (!tenantPrisma) {
      return NextResponse.json(
        { error: 'Tenant context is required' },
        { status: 400 }
      );
    }

    // Get existing notification for audit
    const existingNotification = await tenantPrisma.notification.findUnique({
      where: { id: resolvedParams.id },
    });

    const notification = await tenantPrisma.notification.update({
      where: { id: resolvedParams.id },
      data: updateData,
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

    // Handle attachments update if provided
    if (attachments && Array.isArray(attachments)) {
      // Delete existing attachments
      await tenantPrisma.attachment.deleteMany({
        where: { notificationId: resolvedParams.id },
      });

      // Create new attachments
      if (attachments.length > 0) {
        await tenantPrisma.attachment.createMany({
          data: attachments.map((att: { url: string; filename: string; contentType?: string; size?: number; companyId?: string }) => {
            const attachmentData: any = {
              notificationId: resolvedParams.id,
              url: att.url,
              filename: att.filename,
            };
            if (att.contentType !== undefined && att.contentType !== null) {
              attachmentData.contentType = att.contentType;
            }
            if (att.size !== undefined && att.size !== null) {
              attachmentData.size = att.size;
            }
            if (att.companyId !== undefined && att.companyId !== null) {
              attachmentData.companyId = att.companyId;
            }
            return attachmentData;
          }),
        });
      }
    }

    // Log audit event
    if (existingNotification) {
      const tenantContext = await getTenantFromRequest(request);
      if (tenantContext) {
        const companyId = await getCompanyIdFromRequest(request, tenantPrisma);
        const auditContext = await getAuditContext(request);
        logUpdate(tenantContext, auditContext, 'Notification', resolvedParams.id, existingNotification, notification, companyId || '');
      }
    }

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id]
export async function DELETE(
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

    const resolvedParams = await params;

    // Get existing notification for audit
    const existingNotification = await tenantPrisma.notification.findUnique({
      where: { id: resolvedParams.id },
    });

    await tenantPrisma.notification.delete({
      where: { id: resolvedParams.id },
    });

    // Log audit event
    if (existingNotification) {
      const tenantContext = await getTenantFromRequest(request);
      if (tenantContext) {
        const companyId = await getCompanyIdFromRequest(request, tenantPrisma);
        const auditContext = await getAuditContext(request);
        logDelete(tenantContext, auditContext, 'Notification', resolvedParams.id, companyId || '', {
          title: existingNotification.title,
          type: existingNotification.type,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}

