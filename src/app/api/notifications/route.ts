import { NextRequest, NextResponse } from 'next/server';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest, getCompanyIdFromBody } from '@/lib/api/companyContext';
import { getAuditContext, logCreate } from '@/lib/api/auditHelper';

// GET /api/notifications
export async function GET(request: NextRequest) {
  try {
    // Get tenant Prisma client (optional - returns null if no tenant context)
    const tenantPrisma = await getTenantPrismaFromRequest(request);
    
    // If no tenant context, return empty result (e.g., on login page)
    if (!tenantPrisma) {
      return NextResponse.json({
        notifications: [],
        total: 0,
        page: 1,
        pageSize: 10,
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const module = searchParams.get('module');
    const is_global = searchParams.get('is_global');
    const archived = searchParams.get('archived');
    const is_read = searchParams.get('is_read');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    // Parse query parameters with defaults
    const page = parseInt(searchParams.get('page') || '1', 10) || 1;
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;

    // Get tenant and company context for filtering
    const tenantContext = await getTenantFromRequest(request);
    const companyId = await getCompanyIdFromRequest(request, tenantPrisma);

    const where: Record<string, unknown> = {};

    // Tenant and company filtering (required for multi-tenant isolation)
    if (tenantContext) {
      where.tenantId = tenantContext.id;
    }
    if (companyId) {
      where.companyId = companyId;
    }

    if (module) where.module = module;
    if (is_global !== null) where.isGlobal = is_global === 'true';
    if (archived === 'true') {
      where.archivedAt = { not: null };
    } else if (archived === 'false') {
      where.archivedAt = null;
    }
    if (is_read !== null) where.isRead = is_read === 'true';
    if (type) where.type = type;
    if (priority) where.priority = priority;
    
    // Search filter - search in title and message
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [notifications, total] = await Promise.all([
      tenantPrisma.notification.findMany({
        where,
        include: {
          sender: {
            select: { id: true, name: true, email: true },
          },
          recipient: {
            select: { id: true, name: true, email: true },
          },
          attachments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      tenantPrisma.notification.count({ where }),
    ]);

    return NextResponse.json({
      notifications,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications
export async function POST(request: NextRequest) {
  try {
    // Get tenant Prisma client (required for creating notifications)
    const tenantPrisma = await getTenantPrismaFromRequest(request);
    
    if (!tenantPrisma) {
      return NextResponse.json(
        { error: 'Tenant context is required' },
        { status: 400 }
      );
    }

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

    // Validate required fields
    if (!title || !message || !type || !priority) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get tenant and company context (required for multi-tenant isolation)
    const tenantContext = await getTenantFromRequest(request);
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant context is required' },
        { status: 400 }
      );
    }

    const companyId = await getCompanyIdFromBody(body, tenantPrisma);
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company context is required' },
        { status: 400 }
      );
    }

    // Support both snake_case and camelCase
    const finalSenderId = senderId || sender_id;
    const finalRecipientId = recipientId || recipient_id;
    const finalLocationId = locationId || location_id;
    const finalIsGlobal = isGlobal !== undefined ? isGlobal : (is_global !== undefined ? is_global : false);
    const finalExpiresAt = expiresAt || expires_at;
    const finalActionUrl = actionUrl || action_url;
    const finalActionText = actionText || action_text;

    // Create notification with tenant and company IDs
    const notification = await tenantPrisma.notification.create({
      data: {
        tenantId: tenantContext.id,
        companyId: companyId,
        title,
        message,
        type,
        priority,
        senderId: finalSenderId || null,
        recipientId: finalRecipientId || null,
        locationId: finalLocationId || null,
        isGlobal: finalIsGlobal,
        expiresAt: finalExpiresAt ? new Date(finalExpiresAt) : null,
        data: data ? (typeof data === 'string' ? JSON.parse(data) : data) : null, // Handle both string and object
        actionUrl: finalActionUrl || null,
        actionText: finalActionText || null,
        module: module || null,
        status: 'unread', // Set initial status
      },
    });

    // Create attachments if provided
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      await tenantPrisma.attachment.createMany({
          data: attachments.map((att: { url: string; filename: string; contentType?: string; size?: number; companyId?: string }) => ({
          tenantId: tenantContext.id,
          notificationId: notification.id,
          url: att.url,
          filename: att.filename,
          contentType: att.contentType || null,
          size: att.size || null,
          companyId: att.companyId || companyId, // Use provided companyId or fallback to notification's companyId
        })),
      });
    }

    // Fetch created notification with relations
    const createdNotification = await tenantPrisma.notification.findUnique({
      where: { id: notification.id },
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

    // Log audit event
    const auditContext = await getAuditContext(request);
    logCreate(tenantContext, auditContext, 'Notification', notification.id, companyId, {
      title: notification.title,
      type: notification.type,
      priority: notification.priority,
    });

    return NextResponse.json({
      success: true,
      notification: createdNotification,
    });
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to create notification',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}

