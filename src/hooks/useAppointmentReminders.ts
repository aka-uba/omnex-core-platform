'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Appointment {
  id: string;
  title: string;
  clientName?: string;
  date: string;
  time?: string;
  reminderMinutes?: number;
  status: string;
}

// Maximum number of reminders per appointment
const MAX_REMINDER_COUNT = 3;

// Check if browser notifications are supported
const isNotificationSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) return false;

  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// Show browser notification
const showBrowserNotification = (title: string, options?: NotificationOptions) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  const notification = new Notification(title, {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    ...options,
  });

  // Auto close after 10 seconds
  setTimeout(() => notification.close(), 10000);

  return notification;
};

export function useAppointmentReminders(appointments: Appointment[]) {
  const notificationCounts = useRef<Map<string, number>>(new Map()); // Track notification count per appointment
  const lastNotificationTime = useRef<Map<string, number>>(new Map()); // Track last notification time per appointment
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate reminder time from appointment date and time
  const getReminderTime = useCallback((appointment: Appointment): Date | null => {
    if (!appointment.reminderMinutes || appointment.reminderMinutes <= 0) return null;
    if (!appointment.date) return null;

    const appointmentDate = new Date(appointment.date);

    // If time is specified, parse it
    if (appointment.time) {
      const [hours, minutes] = appointment.time.split(':').map(Number);
      appointmentDate.setHours(hours ?? 0, minutes ?? 0, 0, 0);
    } else {
      // Default to start of day if no time specified
      appointmentDate.setHours(9, 0, 0, 0);
    }

    // Calculate reminder time (appointment time - reminder minutes)
    const reminderMinutes = appointment.reminderMinutes ?? 0;
    const reminderTime = new Date(appointmentDate.getTime() - reminderMinutes * 60 * 1000);

    return reminderTime;
  }, []);

  // Check if reminder should be shown
  const shouldShowReminder = useCallback((appointment: Appointment): boolean => {
    // Skip if max reminders reached
    const currentCount = notificationCounts.current.get(appointment.id) || 0;
    if (currentCount >= MAX_REMINDER_COUNT) return false;

    // Skip cancelled or completed appointments
    if (appointment.status === 'cancelled' || appointment.status === 'completed') return false;

    const reminderTime = getReminderTime(appointment);
    if (!reminderTime) return false;

    const now = new Date();

    // Check if we're within the reminder window (reminder time passed but appointment hasn't)
    const appointmentDate = new Date(appointment.date);
    if (appointment.time) {
      const [hours, minutes] = appointment.time.split(':').map(Number);
      appointmentDate.setHours(hours ?? 0, minutes ?? 0, 0, 0);
    }

    // Show reminder if: reminderTime <= now <= appointmentTime
    if (now < reminderTime || now > appointmentDate) return false;

    // Check if enough time has passed since last notification (at least 5 minutes)
    const lastTime = lastNotificationTime.current.get(appointment.id);
    if (lastTime && (now.getTime() - lastTime) < 5 * 60 * 1000) {
      return false;
    }

    return true;
  }, [getReminderTime]);

  // Format time remaining for notification
  const formatTimeRemaining = useCallback((appointment: Appointment): string => {
    const appointmentDate = new Date(appointment.date);
    if (appointment.time) {
      const [hours, minutes] = appointment.time.split(':').map(Number);
      appointmentDate.setHours(hours ?? 0, minutes ?? 0, 0, 0);
    }

    const now = new Date();
    const diffMs = appointmentDate.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} dakika sonra`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours} saat sonra`;
    } else {
      const days = Math.floor(diffMins / 1440);
      return `${days} gün sonra`;
    }
  }, []);

  // Check and show reminders
  const checkReminders = useCallback(async () => {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    for (const appointment of appointments) {
      if (shouldShowReminder(appointment)) {
        const timeRemaining = formatTimeRemaining(appointment);
        const currentCount = notificationCounts.current.get(appointment.id) || 0;
        const remainingReminders = MAX_REMINDER_COUNT - currentCount - 1;

        showBrowserNotification(`Randevu Hatırlatması: ${appointment.title}`, {
          body: `${appointment.clientName ? `Müşteri: ${appointment.clientName}\n` : ''}${timeRemaining}${remainingReminders > 0 ? `\n(${remainingReminders} hatırlatma kaldı)` : '\n(Son hatırlatma)'}`,
          tag: `appointment-${appointment.id}-${currentCount}`,
          requireInteraction: true,
        });

        // Update notification count
        notificationCounts.current.set(appointment.id, currentCount + 1);
        lastNotificationTime.current.set(appointment.id, Date.now());
      }
    }
  }, [appointments, shouldShowReminder, formatTimeRemaining]);

  // Set up interval to check reminders
  useEffect(() => {
    // Check immediately on mount
    checkReminders();

    // Check every minute
    intervalRef.current = setInterval(checkReminders, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkReminders]);

  // Clear notification counts when appointments change significantly
  useEffect(() => {
    // Remove counts for appointments that no longer exist
    const currentIds = new Set(appointments.map(a => a.id));
    for (const id of notificationCounts.current.keys()) {
      if (!currentIds.has(id)) {
        notificationCounts.current.delete(id);
        lastNotificationTime.current.delete(id);
      }
    }
  }, [appointments]);

  return {
    requestPermission: requestNotificationPermission,
    isSupported: isNotificationSupported(),
    hasPermission: isNotificationSupported() && Notification.permission === 'granted',
  };
}
