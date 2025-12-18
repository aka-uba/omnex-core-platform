/**
 * Real Estate Appointment Notification Service
 * Handles notifications for real estate appointments
 */

import { createNotification } from '@/lib/notifications/notificationService';
import type { AppointmentType, AppointmentStatus, Appointment } from '@/modules/real-estate/types/appointment';

interface AppointmentWithRelations {
  id: string;
  type: AppointmentType;
  status: AppointmentStatus;
  title: string;
  startDate: Date | string;
  endDate: Date | string;
  location?: string | null;
  staffIds?: string[];
  apartment?: { id: string; unitNumber: string; property?: { name: string } | null } | null;
  [key: string]: any;
}

/**
 * Send notification when an appointment is created
 */
export async function notifyAppointmentCreated(
  appointment: AppointmentWithRelations | Appointment,
  userId?: string
): Promise<void> {
  try {
    const apartmentInfo = appointment.apartment?.unitNumber
      ? `${appointment.apartment.unitNumber}${appointment.apartment.property?.name ? ` - ${appointment.apartment.property.name}` : ''}`
      : null;
    const locationInfo = appointment.location || apartmentInfo || 'Belirtilmemiş';
    const startDate = new Date(appointment.startDate);
    const formattedDate = startDate.toLocaleDateString('tr-TR');
    const formattedTime = startDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    // Notify all staff members
    const recipients = appointment.staffIds || [];

    for (const staffId of recipients) {
      await createNotification({
        title: 'Yeni Randevu Oluşturuldu',
        message: `"${appointment.title}" randevusu ${formattedDate} ${formattedTime} tarihinde ${locationInfo} konumunda planlandı.`,
        type: 'info',
        priority: 'medium',
        recipientId: staffId,
        ...(userId ? { senderId: userId } : {}),
        module: 'real-estate',
        data: {
          appointmentId: appointment.id,
          type: appointment.type,
          status: appointment.status,
          startDate: appointment.startDate,
        },
        actionUrl: `/modules/real-estate/appointments/${appointment.id}`,
        actionText: 'Randevuyu Görüntüle',
      });
    }

    // Also create a general notification
    await createNotification({
      title: 'Yeni Randevu Oluşturuldu',
      message: `"${appointment.title}" randevusu ${formattedDate} ${formattedTime} tarihinde ${locationInfo} konumunda planlandı.`,
      type: 'info',
      priority: 'medium',
      ...(userId ? { senderId: userId } : {}),
      module: 'real-estate',
      data: {
        appointmentId: appointment.id,
        type: appointment.type,
        status: appointment.status,
        startDate: appointment.startDate,
      },
      actionUrl: `/modules/real-estate/appointments/${appointment.id}`,
      actionText: 'Randevuyu Görüntüle',
    });
  } catch (error) {
    console.error('Error sending appointment created notification:', error);
  }
}

/**
 * Send notification when an appointment is updated
 */
export async function notifyAppointmentUpdated(
  appointment: AppointmentWithRelations | Appointment,
  userId?: string,
  changes?: Record<string, unknown>
): Promise<void> {
  try {
    const apartmentInfo = appointment.apartment?.unitNumber
      ? `${appointment.apartment.unitNumber}${appointment.apartment.property?.name ? ` - ${appointment.apartment.property.name}` : ''}`
      : null;
    const locationInfo = appointment.location || apartmentInfo || 'Belirtilmemiş';

    let notificationType = 'info';
    let notificationPriority = 'medium';
    let message = `"${appointment.title}" randevusu güncellendi. Konum: ${locationInfo}`;

    if (changes?.status) {
      const newStatus = changes.status as string;
      if (newStatus === 'completed') {
        notificationType = 'success';
        notificationPriority = 'medium';
        message = `"${appointment.title}" randevusu tamamlandı.`;
      } else if (newStatus === 'cancelled') {
        notificationType = 'error';
        notificationPriority = 'high';
        message = `"${appointment.title}" randevusu iptal edildi.`;
      } else if (newStatus === 'no_show') {
        notificationType = 'warning';
        notificationPriority = 'high';
        message = `"${appointment.title}" randevusuna katılım olmadı.`;
      }
    }

    await createNotification({
      title: 'Randevu Güncellendi',
      message,
      type: notificationType,
      priority: notificationPriority,
      ...(userId ? { senderId: userId } : {}),
      module: 'real-estate',
      data: {
        appointmentId: appointment.id,
        type: appointment.type,
        status: appointment.status,
        startDate: appointment.startDate,
        changes,
      },
      actionUrl: `/modules/real-estate/appointments/${appointment.id}`,
      actionText: 'Randevuyu Görüntüle',
    });
  } catch (error) {
    console.error('Error sending appointment updated notification:', error);
  }
}

/**
 * Send reminder notification for upcoming appointment
 */
export async function notifyAppointmentReminder(
  appointment: AppointmentWithRelations | Appointment,
  minutesUntil: number
): Promise<void> {
  try {
    const apartmentInfo = appointment.apartment?.unitNumber
      ? `${appointment.apartment.unitNumber}${appointment.apartment.property?.name ? ` - ${appointment.apartment.property.name}` : ''}`
      : null;
    const locationInfo = appointment.location || apartmentInfo || 'Belirtilmemiş';
    const startDate = new Date(appointment.startDate);
    const formattedTime = startDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    let priority: 'low' | 'medium' | 'high' = 'medium';
    let timeText: string;

    if (minutesUntil <= 15) {
      priority = 'high';
      timeText = `${minutesUntil} dakika`;
    } else if (minutesUntil <= 60) {
      priority = 'high';
      timeText = `${minutesUntil} dakika`;
    } else if (minutesUntil <= 1440) { // 24 hours
      priority = 'medium';
      const hours = Math.floor(minutesUntil / 60);
      timeText = `${hours} saat`;
    } else {
      priority = 'low';
      const days = Math.floor(minutesUntil / 1440);
      timeText = `${days} gün`;
    }

    // Notify all staff members
    const recipients = appointment.staffIds || [];

    for (const staffId of recipients) {
      await createNotification({
        title: `Randevu Hatırlatması: ${timeText} kaldı`,
        message: `"${appointment.title}" randevusuna ${timeText} kaldı. Saat: ${formattedTime}, Konum: ${locationInfo}`,
        type: 'warning',
        priority,
        recipientId: staffId,
        module: 'real-estate',
        data: {
          appointmentId: appointment.id,
          type: appointment.type,
          status: appointment.status,
          startDate: appointment.startDate,
          minutesUntil,
        },
        actionUrl: `/modules/real-estate/appointments/${appointment.id}`,
        actionText: 'Randevuyu Görüntüle',
      });
    }

    // Also create a general notification
    await createNotification({
      title: `Randevu Hatırlatması: ${timeText} kaldı`,
      message: `"${appointment.title}" randevusuna ${timeText} kaldı. Saat: ${formattedTime}, Konum: ${locationInfo}`,
      type: 'warning',
      priority,
      module: 'real-estate',
      data: {
        appointmentId: appointment.id,
        type: appointment.type,
        status: appointment.status,
        startDate: appointment.startDate,
        minutesUntil,
      },
      actionUrl: `/modules/real-estate/appointments/${appointment.id}`,
      actionText: 'Randevuyu Görüntüle',
    });
  } catch (error) {
    console.error('Error sending appointment reminder notification:', error);
  }
}

/**
 * Send notification for missed/overdue appointment
 */
export async function notifyAppointmentMissed(
  appointment: AppointmentWithRelations | Appointment,
  minutesOverdue: number
): Promise<void> {
  try {
    const apartmentInfo = appointment.apartment?.unitNumber
      ? `${appointment.apartment.unitNumber}${appointment.apartment.property?.name ? ` - ${appointment.apartment.property.name}` : ''}`
      : null;
    const locationInfo = appointment.location || apartmentInfo || 'Belirtilmemiş';
    const startDate = new Date(appointment.startDate);
    const formattedDate = startDate.toLocaleDateString('tr-TR');
    const formattedTime = startDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    await createNotification({
      title: 'Kaçırılan Randevu',
      message: `"${appointment.title}" randevusu ${formattedDate} ${formattedTime} tarihinde planlanmıştı ve kaçırılmış olabilir. Konum: ${locationInfo}`,
      type: 'error',
      priority: 'high',
      module: 'real-estate',
      data: {
        appointmentId: appointment.id,
        type: appointment.type,
        status: appointment.status,
        startDate: appointment.startDate,
        minutesOverdue,
      },
      actionUrl: `/modules/real-estate/appointments/${appointment.id}`,
      actionText: 'Randevuyu Görüntüle',
    });
  } catch (error) {
    console.error('Error sending appointment missed notification:', error);
  }
}
