'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAppointments } from '@/hooks/useAppointments';

// Track shown reminders to prevent duplicates
const shownReminders = new Set<string>();

/**
 * Hook to show browser notifications for upcoming appointments
 * Checks every minute for appointments within the next 15 minutes
 */
export function useAppointmentReminders() {
  const { data } = useAppointments({
    page: 1,
    pageSize: 100,
    status: 'scheduled',
  });

  const lastCheckRef = useRef<number>(0);

  const showBrowserNotification = useCallback((appointment: {
    id: string;
    title: string;
    startDate: string | Date;
    location?: string | null;
  }, minutesUntil: number) => {
    const reminderId = `${appointment.id}-${Math.floor(minutesUntil / 5) * 5}`; // Group by 5 min intervals

    // Check if we've already shown this reminder
    if (shownReminders.has(reminderId)) {
      return;
    }

    // Mark as shown immediately
    shownReminders.add(reminderId);

    if ('Notification' in window && Notification.permission === 'granted') {
      const startDate = new Date(appointment.startDate);
      const formattedTime = startDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      const locationInfo = appointment.location ? ` - ${appointment.location}` : '';

      let timeText: string;
      if (minutesUntil <= 1) {
        timeText = 'şimdi başlıyor';
      } else if (minutesUntil < 60) {
        timeText = `${Math.ceil(minutesUntil)} dakika kaldı`;
      } else {
        const hours = Math.floor(minutesUntil / 60);
        const mins = Math.round(minutesUntil % 60);
        timeText = mins > 0 ? `${hours} saat ${mins} dakika kaldı` : `${hours} saat kaldı`;
      }

      const browserNotif = new window.Notification(`🗓️ Randevu Hatırlatması`, {
        body: `"${appointment.title}" - ${timeText}\nSaat: ${formattedTime}${locationInfo}`,
        icon: '/favicon.ico',
        tag: reminderId,
        requireInteraction: true, // Keep notification visible until user interacts
      });

      // Handle click
      browserNotif.onclick = () => {
        window.focus();
        browserNotif.close();
        // Navigate to appointment detail
        const locale = window.location.pathname.split('/')[1] || 'tr';
        window.location.href = `/${locale}/modules/real-estate/appointments/${appointment.id}`;
      };
    }
  }, []);

  const checkUpcomingAppointments = useCallback(() => {
    if (!data?.appointments || data.appointments.length === 0) return;

    const now = new Date();
    const nowTime = now.getTime();

    // Don't check more than once per minute
    if (nowTime - lastCheckRef.current < 60000) return;
    lastCheckRef.current = nowTime;

    // Reminder intervals in minutes
    const reminderIntervals = [60, 30, 15, 5, 1]; // 1 hour, 30 min, 15 min, 5 min, 1 min before

    data.appointments.forEach((appointment: any) => {
      const startTime = new Date(appointment.startDate).getTime();
      const minutesUntil = (startTime - nowTime) / (1000 * 60);

      // Check each reminder interval
      for (const interval of reminderIntervals) {
        // Show notification if within 2 minutes of the interval
        if (minutesUntil > 0 && minutesUntil <= interval && minutesUntil >= interval - 2) {
          showBrowserNotification(appointment, minutesUntil);
          break; // Only show one notification per appointment per check
        }
      }
    });
  }, [data, showBrowserNotification]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Store interval ref to prevent recreation
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for upcoming appointments periodically - with visibility check
  useEffect(() => {
    const checkWithVisibility = () => {
      // Skip if page is not visible
      if (document.hidden) return;
      checkUpcomingAppointments();
    };

    // Initial check
    checkWithVisibility();

    // Clear existing interval before creating new one
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Check every 60 seconds (reduced from 30s)
    intervalRef.current = setInterval(checkWithVisibility, 60000);

    // Refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkWithVisibility();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkUpcomingAppointments]);

  // Clean up old reminders periodically (keep memory low) - reduced threshold
  useEffect(() => {
    const cleanup = setInterval(() => {
      // Clear reminders if the set gets too big - reduced from 1000 to 200
      if (shownReminders.size > 200) {
        shownReminders.clear();
      }
    }, 30 * 60 * 1000); // Clean up every 30 minutes (reduced from 1 hour)

    return () => clearInterval(cleanup);
  }, []);

  return null;
}
