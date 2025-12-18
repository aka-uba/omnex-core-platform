/**
 * Maintenance Notification Service
 * Handles notifications for maintenance records
 */

import { createNotification } from '@/lib/notifications/notificationService';
import type { MaintenanceType, MaintenanceStatus } from '@/modules/maintenance/types/maintenance';

interface MaintenanceRecordWithRelations {
  id: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  scheduledDate: Date | string;
  assignedTo?: string | null;
  location?: { id: string; name: string } | null;
  equipment?: { id: string; name: string; code?: string | null } | null;
  [key: string]: any; // Allow additional fields from Prisma
}

/**
 * Send notification when a maintenance record is created
 */
export async function notifyMaintenanceCreated(
  record: MaintenanceRecordWithRelations | any,
  userId?: string
): Promise<void> {
  try {
    const equipmentName = record.equipment?.name || 'Unknown Equipment';
    const locationName = record.location?.name || 'Unknown Location';
    const scheduledDate = new Date(record.scheduledDate).toLocaleDateString();

    await createNotification({
      title: 'New Maintenance Record Created',
      message: `A new ${record.type} maintenance record has been created for ${equipmentName} at ${locationName}. Scheduled date: ${scheduledDate}`,
      type: 'info',
      priority: 'medium',
      ...(record.assignedTo ? { recipientId: record.assignedTo } : {}),
      ...(userId ? { senderId: userId } : {}),
      module: 'maintenance',
      data: {
        maintenanceRecordId: record.id,
        type: record.type,
        status: record.status,
        scheduledDate: record.scheduledDate,
      },
      actionUrl: `/modules/maintenance/records/${record.id}`,
      actionText: 'View Maintenance Record',
    });
  } catch (error) {
    console.error('Error sending maintenance created notification:', error);
    // Don't throw - notifications are non-critical
  }
}

/**
 * Send notification when a maintenance record is updated
 */
export async function notifyMaintenanceUpdated(
  record: MaintenanceRecordWithRelations | any,
  userId?: string,
  changes?: Record<string, unknown>
): Promise<void> {
  try {
    const equipmentName = record.equipment?.name || 'Unknown Equipment';
    const locationName = record.location?.name || 'Unknown Location';

    // Determine notification type based on status change
    let notificationType = 'info';
    let notificationPriority = 'medium';
    let message = `Maintenance record for ${equipmentName} at ${locationName} has been updated.`;

    if (changes?.status) {
      const newStatus = changes.status as string;
      if (newStatus === 'in_progress') {
        notificationType = 'warning';
        notificationPriority = 'high';
        message = `Maintenance for ${equipmentName} at ${locationName} has started.`;
      } else if (newStatus === 'completed') {
        notificationType = 'success';
        notificationPriority = 'medium';
        message = `Maintenance for ${equipmentName} at ${locationName} has been completed.`;
      } else if (newStatus === 'cancelled') {
        notificationType = 'error';
        notificationPriority = 'high';
        message = `Maintenance for ${equipmentName} at ${locationName} has been cancelled.`;
      }
    }

    await createNotification({
      title: 'Maintenance Record Updated',
      message,
      type: notificationType,
      priority: notificationPriority,
      ...(record.assignedTo ? { recipientId: record.assignedTo } : {}),
      ...(userId ? { senderId: userId } : {}),
      module: 'maintenance',
      data: {
        maintenanceRecordId: record.id,
        type: record.type,
        status: record.status,
        scheduledDate: record.scheduledDate,
        changes,
      },
      actionUrl: `/modules/maintenance/records/${record.id}`,
      actionText: 'View Maintenance Record',
    });
  } catch (error) {
    console.error('Error sending maintenance updated notification:', error);
    // Don't throw - notifications are non-critical
  }
}

/**
 * Send reminder notification for upcoming maintenance
 */
export async function notifyMaintenanceReminder(
  record: MaintenanceRecordWithRelations | any,
  daysUntil: number
): Promise<void> {
  try {
    const equipmentName = record.equipment?.name || 'Unknown Equipment';
    const locationName = record.location?.name || 'Unknown Location';
    const scheduledDate = new Date(record.scheduledDate).toLocaleDateString();

    let priority: 'low' | 'medium' | 'high' = 'medium';
    if (daysUntil <= 1) {
      priority = 'high';
    } else if (daysUntil <= 3) {
      priority = 'medium';
    } else {
      priority = 'low';
    }

    await createNotification({
      title: `Maintenance Reminder: ${daysUntil} day${daysUntil > 1 ? 's' : ''} remaining`,
      message: `Maintenance for ${equipmentName} at ${locationName} is scheduled for ${scheduledDate} (${daysUntil} day${daysUntil > 1 ? 's' : ''} remaining).`,
      type: 'warning',
      priority,
      recipientId: record.assignedTo || undefined,
      module: 'maintenance',
      data: {
        maintenanceRecordId: record.id,
        type: record.type,
        status: record.status,
        scheduledDate: record.scheduledDate,
        daysUntil,
      },
      actionUrl: `/modules/maintenance/records/${record.id}`,
      actionText: 'View Maintenance Record',
    });
  } catch (error) {
    console.error('Error sending maintenance reminder notification:', error);
    // Don't throw - notifications are non-critical
  }
}

/**
 * Send notification for overdue maintenance
 */
export async function notifyMaintenanceOverdue(
  record: MaintenanceRecordWithRelations | any,
  daysOverdue: number
): Promise<void> {
  try {
    const equipmentName = record.equipment?.name || 'Unknown Equipment';
    const locationName = record.location?.name || 'Unknown Location';
    const scheduledDate = new Date(record.scheduledDate).toLocaleDateString();

    await createNotification({
      title: `Overdue Maintenance: ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`,
      message: `Maintenance for ${equipmentName} at ${locationName} is overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}. Scheduled date was ${scheduledDate}.`,
      type: 'error',
      priority: 'high',
      recipientId: record.assignedTo || undefined,
      module: 'maintenance',
      data: {
        maintenanceRecordId: record.id,
        type: record.type,
        status: record.status,
        scheduledDate: record.scheduledDate,
        daysOverdue,
      },
      actionUrl: `/modules/maintenance/records/${record.id}`,
      actionText: 'View Maintenance Record',
    });
  } catch (error) {
    console.error('Error sending maintenance overdue notification:', error);
    // Don't throw - notifications are non-critical
  }
}

