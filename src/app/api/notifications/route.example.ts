/**
 * Example API Route for Notifications
 * Place this in: src/app/api/notifications/route.ts
 * 
 * This example shows how to handle:
 * - Filtering by module, is_global, archived
 * - Creating notifications with attachments
 * - Handling presigned URLs for file uploads
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/notifications
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const moduleParam = searchParams.get('module');
    const is_global = searchParams.get('is_global');
    const archived = searchParams.get('archived');
    const is_read = searchParams.get('is_read');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');
    const page = pageParam ? parseInt(pageParam) : 1;
    const pageSize = pageSizeParam ? parseInt(pageSizeParam) : 10;

    const where: Record<string, unknown> = {};

    if (moduleParam) where.module = moduleParam;
    if (is_global !== null) where.isGlobal = is_global === 'true';
    if (archived === 'true') {
      where.archivedAt = { not: null };
    } else if (archived === 'false') {
      where.archivedAt = null;
    }
    if (is_read !== null) where.isRead = is_read === 'true';
    if (type) where.type = type;
    if (priority) where.priority = priority;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
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
      prisma.notification.count({ where }),
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
    const body = await request.json();
    const {
      title,
      message,
      type,
      priority,
      senderId,
      recipientId,
      locationId,
      isGlobal,
      expiresAt,
      data,
      actionUrl,
      actionText,
      module,
      attachments, // Array of attachment objects with presigned URLs
    } = body;

    // Validate required fields
    if (!title || !message || !type || !priority) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        priority,
        senderId: senderId || null,
        recipientId: recipientId || null,
        locationId: locationId || null,
        isGlobal: isGlobal || false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        data: data ? JSON.stringify(data) : null,
        actionUrl: actionUrl || null,
        actionText: actionText || null,
        module: module || null,
        // Compute status from isRead and archivedAt
        status: 'unread',
      },
    });

    // Create attachments if provided
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      await prisma.attachment.createMany({
        data: attachments.map((att: { url: string; filename: string; contentType?: string; size?: number; companyId?: string }) => ({
          notificationId: notification.id,
          url: att.url, // Presigned URL or storage path
          filename: att.filename,
          contentType: att.contentType || null,
          size: att.size || null,
          companyId: att.companyId || null,
        })),
      });
    }

    // Fetch created notification with relations
    const createdNotification = await prisma.notification.findUnique({
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

    return NextResponse.json({
      success: true,
      notification: createdNotification,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

