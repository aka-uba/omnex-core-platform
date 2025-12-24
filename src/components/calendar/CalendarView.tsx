'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Paper, Text, ActionIcon, Group, Stack, Button, SegmentedControl, useMantineColorScheme, Tooltip, Popover, Divider, Badge } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconPlus, IconEye, IconEdit, IconClock } from '@tabler/icons-react';
import { useTranslation } from '@/lib/i18n/client';
import classes from './CalendarView.module.css';

export type CalendarViewType = 'Month' | 'Week' | 'Day';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  client?: string;
  status?: 'draft' | 'scheduled' | 'published' | 'needs-revision';
  color?: 'yellow' | 'green' | 'red' | 'blue' | 'purple' | 'slate';
}

interface CalendarViewProps {
  events?: CalendarEvent[];
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEventEdit?: (event: CalendarEvent) => void;
  onEventCreate?: (date: Date) => void;
  selectedDate?: Date;
  view?: CalendarViewType;
  onViewChange?: (view: CalendarViewType) => void;
}

const getEventColorStyles = (color?: string, status?: string, isDark?: boolean) => {
  // Determine color based on explicit color or status
  const eventColor = color || (status === 'draft' ? 'slate' : status === 'needs-revision' ? 'red' : status === 'scheduled' ? 'yellow' : status === 'published' ? 'green' : 'blue');
  
  const colorMap: Record<string, { bg: string; border: string; text: string; textSecondary: string }> = {
    yellow: {
      bg: isDark ? 'rgba(250, 204, 21, 0.15)' : 'rgba(250, 204, 21, 0.1)',
      border: '#facc15',
      text: isDark ? '#fef08a' : '#854d0e',
      textSecondary: isDark ? '#fde047' : '#713f12',
    },
    green: {
      bg: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
      border: '#22c55e',
      text: isDark ? '#86efac' : '#166534',
      textSecondary: isDark ? '#4ade80' : '#14532d',
    },
    red: {
      bg: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
      border: '#ef4444',
      text: isDark ? '#fca5a5' : '#991b1b',
      textSecondary: isDark ? '#f87171' : '#7f1d1d',
    },
    blue: {
      bg: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
      border: '#3b82f6',
      text: isDark ? '#93c5fd' : '#1e40af',
      textSecondary: isDark ? '#60a5fa' : '#1e3a8a',
    },
    purple: {
      bg: isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.2)',
      border: '#a855f7',
      text: isDark ? '#c084fc' : '#6b21a8',
      textSecondary: isDark ? '#a855f7' : '#581c87',
    },
    slate: {
      bg: isDark ? 'rgba(148, 163, 184, 0.3)' : 'rgba(148, 163, 184, 0.2)',
      border: '#94a3b8',
      text: isDark ? '#cbd5e1' : '#1e293b',
      textSecondary: isDark ? '#94a3b8' : '#475569',
    },
  };

  return colorMap[eventColor] || colorMap.blue;
};

export function CalendarView({
  events = [],
  onDateSelect,
  onEventClick,
  onEventEdit,
  onEventCreate,
  selectedDate,
  view: controlledView,
  onViewChange,
}: CalendarViewProps) {
  const { t } = useTranslation('modules/calendar');
  const { colorScheme } = useMantineColorScheme();
  const [mounted, setMounted] = useState(false);
  const [internalView, setInternalView] = useState<CalendarViewType>('Month');
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [hoveredDayEvents, setHoveredDayEvents] = useState<CalendarEvent[]>([]);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isCalendarHovered, setIsCalendarHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Ensure consistent isDark value between server and client
  // Also detect touch devices to disable hover popovers on mobile
  useEffect(() => {
    setMounted(true);
    // Check if device supports touch
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    setIsTouchDevice(hasTouch && hasCoarsePointer);
  }, []);

  // Use false on server, actual value on client to prevent hydration mismatch
  const isDark = mounted ? colorScheme === 'dark' : false;

  // Cleanup timeout on unmount - no dependency on hoverTimeout to avoid recreating cleanup
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const view = controlledView ?? internalView;
  const setView = onViewChange ?? setInternalView;

  const monthStart = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  }, [currentDate]);

  const monthEnd = useMemo(() => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  }, [currentDate]);

  const daysInMonth = monthEnd.getDate();
  const firstDayOfWeek = monthStart.getDay(); // 0 = Sunday

  // Get previous month's last days
  const prevMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
  const prevMonthDays = prevMonthEnd.getDate();
  const prevMonthStartDay = firstDayOfWeek;

  // Get next month's first days
  const totalCells = 42; // 6 weeks * 7 days
  const currentMonthCells = daysInMonth + firstDayOfWeek;
  const nextMonthDays = totalCells - currentMonthCells;

  const monthName = currentDate.toLocaleDateString('tr-TR', {
    month: 'long',
    year: 'numeric',
  });
  const weekDays = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (view === 'Week') {
        if (direction === 'prev') {
          newDate.setDate(prev.getDate() - 7);
        } else {
          newDate.setDate(prev.getDate() + 7);
        }
      } else if (view === 'Day') {
        if (direction === 'prev') {
          newDate.setDate(prev.getDate() - 1);
        } else {
          newDate.setDate(prev.getDate() + 1);
        }
      } else {
        if (direction === 'prev') {
          newDate.setMonth(prev.getMonth() - 1);
        } else {
          newDate.setMonth(prev.getMonth() + 1);
        }
      }
      return newDate;
    });
  }, [view]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const getEventsForDay = useCallback((day: number, monthOffset: number = 0): CalendarEvent[] => {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + monthOffset,
      day
    );
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  }, [currentDate, events]);

  const isToday = useCallback((day: number, monthOffset: number = 0): boolean => {
    const today = new Date();
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + monthOffset,
      day
    );
    return (
      day === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }, [currentDate]);


  const handleDayClick = useCallback((day: number, monthOffset: number = 0) => {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + monthOffset,
      day
    );
    onDateSelect?.(date);
    // Only create new event if no events exist on this day
    const dayEvents = getEventsForDay(day, monthOffset);
    if (dayEvents.length === 0) {
      onEventCreate?.(date);
    }
  }, [currentDate, getEventsForDay, onDateSelect, onEventCreate]);

  const handleAddEventClick = useCallback((e: React.MouseEvent, day: number, monthOffset: number = 0) => {
    e.stopPropagation();
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + monthOffset,
      day
    );
    onEventCreate?.(date);
  }, [currentDate, onEventCreate]);

  const handleCalendarMouseEnter = useCallback(() => {
    setIsCalendarHovered(true);
    // Clear any existing timeout when mouse enters calendar area
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  }, [hoverTimeout]);

  const handleCalendarMouseLeave = useCallback(() => {
    setIsCalendarHovered(false);
    // Start timeout only when mouse leaves calendar area completely
    if (hoveredDay !== null) {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
      const timeout = setTimeout(() => {
        setHoveredDay(null);
        setHoveredDayEvents([]);
        setHoverTimeout(null);
      }, 400);
      setHoverTimeout(timeout);
    }
  }, [hoveredDay, hoverTimeout]);

  return (
    <Paper 
      {...(classes.calendarContainer ? { className: classes.calendarContainer } : {})}
      radius="xl" 
      withBorder
      onMouseEnter={handleCalendarMouseEnter}
      onMouseLeave={handleCalendarMouseLeave}
    >
      {/* Toolbar */}
      <div className={classes.toolbar}>
        <Group gap="xs">
          <ActionIcon
            variant="subtle"
            onClick={() => navigateMonth('prev')}
            {...(classes.navButton ? { className: classes.navButton } : {})}
          >
            {mounted && <IconChevronLeft size={20} />}
          </ActionIcon>
          <Text fw={600} size="lg" {...(classes.monthTitle ? { className: classes.monthTitle } : {})}>
            {view === 'Week' 
              ? `${new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay()).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} - ${new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay() + 6).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}`
              : view === 'Day'
              ? currentDate.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
              : monthName}
          </Text>
          <ActionIcon
            variant="subtle"
            onClick={() => navigateMonth('next')}
            {...(classes.navButton ? { className: classes.navButton } : {})}
          >
            {mounted && <IconChevronRight size={20} />}
          </ActionIcon>
          <Button
            variant="default"
            size="sm"
            onClick={goToToday}
            {...(classes.todayButton ? { className: classes.todayButton } : {})}
          >
            {t('toolbar.today')}
          </Button>
        </Group>

        <SegmentedControl
          value={view}
          onChange={(value) => setView(value as CalendarViewType)}
          data={[
            { label: t('toolbar.month'), value: 'Month' },
            { label: t('toolbar.week'), value: 'Week' },
            { label: t('toolbar.day'), value: 'Day' },
          ]}
          {...(classes.viewSelector ? { className: classes.viewSelector } : {})}
        />
      </div>

      {/* Calendar Grid */}
      {view === 'Month' && (
        <div className={classes.calendarGrid}>
          {/* Day Headers */}
          {weekDays.map((day) => (
            <div key={day} className={classes.dayHeader}>
              <Text size="sm" fw={600} c="dimmed" tt="uppercase">
                {day}
              </Text>
            </div>
          ))}

        {/* Previous Month Days */}
        {Array.from({ length: prevMonthStartDay }).map((_, index) => {
          const day = prevMonthDays - prevMonthStartDay + index + 1;
          return (
            <div
              key={`prev-${day}`}
              className={[classes.calendarDay, classes.otherMonthDay].join(' ')}
            >
              <Text size="sm" c="dimmed">
                {day}
              </Text>
            </div>
          );
        })}

        {/* Current Month Days */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const dayEvents = getEventsForDay(day);
          const today = isToday(day);

          const dayEventsForHover = getEventsForDay(day);
          // Disable hover popover on touch devices
          const isDayHovered = !isTouchDevice && hoveredDay === day && dayEventsForHover.length > 0;
          const isDayHoveredForButton = !isTouchDevice && hoveredDay === day;

          const handleMouseEnter = () => {
            // Clear any existing timeout
            if (hoverTimeout) {
              clearTimeout(hoverTimeout);
              setHoverTimeout(null);
            }
            
            // Always set hover state for "+" button visibility
            setHoveredDay(day);
            
            // Set events for popover if there are events
            if (dayEventsForHover.length > 0) {
              setHoveredDayEvents(dayEventsForHover);
            } else {
              setHoveredDayEvents([]);
            }
          };

          const handleMouseLeave = () => {
            // Clear any existing timeout
            if (hoverTimeout) {
              clearTimeout(hoverTimeout);
            }
            
            // Only start timeout if mouse is leaving calendar area completely
            // If mouse is still in calendar, don't close popover
            if (!isCalendarHovered) {
              const timeout = setTimeout(() => {
                setHoveredDay(null);
                setHoveredDayEvents([]);
                setHoverTimeout(null);
              }, 400);
              setHoverTimeout(timeout);
            }
          };

          return (
            <Popover
              key={day}
              position="right"
              withArrow
              shadow="xl"
              withinPortal
              opened={isDayHovered}
              onChange={(opened) => {
                if (!opened) {
                  if (hoverTimeout) {
                    clearTimeout(hoverTimeout);
                    setHoverTimeout(null);
                  }
                  setHoveredDay(null);
                  setHoveredDayEvents([]);
                }
              }}
              middlewares={{ flip: true, shift: true }}
            >
              <Popover.Target>
                <div
                  className={[classes.calendarDay, today ? classes.today : ''].filter(Boolean).join(' ')}
                  onClick={(e) => {
                    // Only open create modal if clicking on empty day area, not on events
                    const target = e.target as HTMLElement | null;
                    const dayNumberClass = classes.dayNumber || '';
                    const todayBadgeClass = classes.todayBadge || '';
                    if (e.target === e.currentTarget || (target?.classList.contains(dayNumberClass)) || (target?.classList.contains(todayBadgeClass))) {
                      handleDayClick(day);
                    }
                  }}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
              <div className={classes.dayHeaderContent}>
                {today ? (
                  <div className={classes.todayBadge}>
                    <Text size="sm" fw={700} c="white">
                      {day}
                    </Text>
                  </div>
                ) : (
                  <Text size="sm" fw={600} {...(classes.dayNumber ? { className: classes.dayNumber } : {})}>
                    {day}
                  </Text>
                )}
                
                {/* Add Event Button on Hover */}
                {isDayHoveredForButton && (
                  <Tooltip 
                    label={t('toolbar.addEvent')}
                    position="top"
                    withinPortal
                    zIndex={1600}
                  >
                    <ActionIcon
                      size="sm"
                      variant="filled"
                      color="primary"
                      {...(classes.addEventButton ? { className: classes.addEventButton } : {})}
                      onClick={(e) => handleAddEventClick(e, day)}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        handleMouseEnter();
                      }}
                      onMouseLeave={handleMouseLeave}
                      style={{ 
                        backgroundColor: 'var(--color-primary-600)',
                        color: 'white',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                      }}
                    >
                      {mounted && <IconPlus size={16} stroke={2.5} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </div>

              {/* Events */}
              {dayEvents.length > 0 && (
                <div className={classes.eventsContainer}>
                  {dayEvents.slice(0, 3).map((event) => {
                    const colors = getEventColorStyles(event.color, event.status, isDark);
                    return (
                      <div
                        key={event.id}
                        className={classes.eventCard}
                        style={{
                          backgroundColor: colors?.bg,
                          borderLeftColor: colors?.border,
                        } as React.CSSProperties}
                        onMouseEnter={(e) => {
                          if (e) {
                            e.stopPropagation();
                          }
                          // Keep popover open when hovering over event card
                          if (hoverTimeout) {
                            clearTimeout(hoverTimeout);
                            setHoverTimeout(null);
                          }
                          setHoveredDay(day);
                          setHoveredDayEvents(dayEventsForHover);
                        }}
                        onMouseLeave={(e) => {
                          if (e) {
                            e.stopPropagation();
                          }
                          // Keep popover open when hovering over event card
                          if (hoverTimeout) {
                            clearTimeout(hoverTimeout);
                            setHoverTimeout(null);
                          }
                          setHoveredDay(day);
                          setHoveredDayEvents(dayEventsForHover);
                        }}
                        onClick={(e) => {
                          if (e) {
                            e.stopPropagation();
                            e.preventDefault();
                          }
                          onEventClick?.(event);
                        }}
                      >
                        {event.client && (
                          <Text size="xs" fw={700} style={{ color: colors?.text }}>
                            {event.client}
                          </Text>
                        )}
                        {(event.title || event.description) && (
                          <Text
                            size="xs"
                            {...(classes.eventDescription ? { className: classes.eventDescription } : {})}
                            lineClamp={1}
                            style={{ color: colors?.textSecondary }}
                          >
                            {event.title || event.description}
                          </Text>
                        )}
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <Text size="xs" c="dimmed" {...(classes.moreEvents ? { className: classes.moreEvents } : {})}>
                      +{dayEvents.length - 3} {t('calendar.more')}
                    </Text>
                  )}
                </div>
              )}
                </div>
              </Popover.Target>
              {isDayHovered && hoveredDayEvents.length > 0 && (
                <Popover.Dropdown 
                  onClick={(e) => {
                    if (e) {
                      e.stopPropagation();
                    }
                  }} 
                  onMouseEnter={(e) => {
                    if (e) {
                      e.stopPropagation();
                    }
                    // Clear any existing timeout
                    if (hoverTimeout) {
                      clearTimeout(hoverTimeout);
                      setHoverTimeout(null);
                    }
                    // Keep popover open
                    setHoveredDay(day);
                    setHoveredDayEvents(dayEventsForHover);
                  }}
                  onMouseLeave={(e) => {
                    if (e) {
                      e.stopPropagation();
                    }
                    // Only close if mouse is leaving calendar area completely
                    // If still in calendar, don't close
                    if (!isCalendarHovered) {
                      if (hoverTimeout) {
                        clearTimeout(hoverTimeout);
                      }
                      const timeout = setTimeout(() => {
                        setHoveredDay(null);
                        setHoveredDayEvents([]);
                        setHoverTimeout(null);
                      }, 400);
                      setHoverTimeout(timeout);
                    }
                  }}
                  style={{ zIndex: 1500, padding: 0, minWidth: 320 }}
                >
                  <Stack gap={0} p="md">
                    <Group justify="space-between" mb="xs">
                      <Text size="sm" fw={600} c="dimmed">
                        {new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth(),
                          day
                        ).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </Text>
                      <Badge size="sm" variant="light" color="blue">
                        {hoveredDayEvents.length} {hoveredDayEvents.length === 1 ? (t('toolbar.event')) : (t('toolbar.events'))}
                      </Badge>
                    </Group>
                    <Divider mb="md" />
                    <Stack gap="md">
                      {hoveredDayEvents.map((event, index) => {
                        const colors = getEventColorStyles(event.color, event.status, isDark);
                        return (
                          <div
                            key={event.id}
                            style={{
                              borderLeft: `3px solid ${colors?.border}`,
                              paddingLeft: '0.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              if (e) {
                                e.stopPropagation();
                              }
                              // Keep popover open when hovering over event
                              if (hoverTimeout) {
                                clearTimeout(hoverTimeout);
                                setHoverTimeout(null);
                              }
                              setHoveredDay(day);
                              setHoveredDayEvents(dayEventsForHover);
                            }}
                            onMouseLeave={(e) => {
                              if (e) {
                                e.stopPropagation();
                              }
                              // Only close if mouse is leaving calendar area completely
                              // If still in calendar, don't close
                              if (!isCalendarHovered) {
                                if (hoverTimeout) {
                                  clearTimeout(hoverTimeout);
                                }
                                const timeout = setTimeout(() => {
                                  setHoveredDay(null);
                                  setHoveredDayEvents([]);
                                  setHoverTimeout(null);
                                }, 400);
                                setHoverTimeout(timeout);
                              }
                            }}
                            onClick={(e) => {
                              if (e) {
                                e.stopPropagation();
                                e.preventDefault();
                                onEventClick?.(event);
                              }
                            }}
                          >
                            <Stack gap="xs">
                              <Group justify="space-between" align="flex-start" gap="xs">
                                <Stack gap={2} style={{ flex: 1 }}>
                                  {event.client && (
                                    <Text size="xs" fw={600} c="dimmed">
                                      {event.client}
                                    </Text>
                                  )}
                                  <Text size="sm" fw={600}>
                                    {event.title}
                                  </Text>
                                  {event.description && (
                                    <Text size="xs" c="dimmed" lineClamp={2}>
                                      {event.description}
                                    </Text>
                                  )}
                                </Stack>
                                <Group gap={4}>
                                  <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    color="blue"
                                    onClick={(e) => {
                                      if (e) {
                                        e.stopPropagation();
                                        e.preventDefault();
                                      }
                                      onEventClick?.(event);
                                    }}
                                  >
                                    {mounted && <IconEye size={16} />}
                                  </ActionIcon>
                                  <ActionIcon
                                    size="sm"
                                    variant="subtle"
                                    color="blue"
                                    onClick={(e) => {
                                      if (e) {
                                        e.stopPropagation();
                                        e.preventDefault();
                                      }
                                      onEventEdit?.(event);
                                    }}
                                  >
                                    {mounted && <IconEdit size={16} />}
                                  </ActionIcon>
                                </Group>
                              </Group>
                              <Group gap="xs" align="center">
                                {mounted && <IconClock size={12} style={{ color: 'var(--text-secondary)' }} />}
                                <Text size="xs" c="dimmed">
                                  {new Date(event.date).toLocaleTimeString('tr-TR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </Text>
                                <Badge
                                  size="xs"
                                  variant="dot"
                                  color={
                                    event.status === 'published'
                                      ? 'green'
                                      : event.status === 'scheduled'
                                      ? 'blue'
                                      : event.status === 'draft'
                                      ? 'gray'
                                      : 'red'
                                  }
                                  style={{ marginLeft: 'auto' }}
                                >
                                  {event.status === 'draft'
                                    ? (t('form.statusDraft'))
                                    : event.status === 'scheduled'
                                    ? (t('form.statusScheduled'))
                                    : event.status === 'published'
                                    ? (t('form.statusPublished'))
                                    : (t('form.statusNeedsRevision'))}
                                </Badge>
                              </Group>
                            </Stack>
                            {index < hoveredDayEvents.length - 1 && <Divider mt="md" />}
                          </div>
                        );
                      })}
                    </Stack>
                  </Stack>
                </Popover.Dropdown>
              )}
            </Popover>
          );
        })}

        {/* Next Month Days */}
        {Array.from({ length: nextMonthDays }).map((_, index) => {
          const day = index + 1;
          return (
            <div
              key={`next-${day}`}
              className={[classes.calendarDay, classes.otherMonthDay].join(' ')}
            >
              <Text size="sm" c="dimmed">
                {day}
              </Text>
            </div>
          );
        })}
      </div>
      )}

      {/* Week View */}
      {view === 'Week' && (
        <div style={{ padding: '1rem' }}>
          <Stack gap="md">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
              {weekDays.map((dayName, dayIndex) => {
                const weekStart = new Date(currentDate);
                weekStart.setDate(currentDate.getDate() - currentDate.getDay() + dayIndex);
                const dayEvents = events.filter((event) => {
                  const eventDate = new Date(event.date);
                  return (
                    eventDate.getDate() === weekStart.getDate() &&
                    eventDate.getMonth() === weekStart.getMonth() &&
                    eventDate.getFullYear() === weekStart.getFullYear()
                  );
                });
                const isToday = weekStart.toDateString() === new Date().toDateString();

                return (
                  <Paper
                    key={dayIndex}
                    p="sm"
                    withBorder
                    style={{
                      minHeight: '400px',
                      backgroundColor: isToday ? 'var(--mantine-color-blue-0)' : undefined,
                    }}
                  >
                    <Stack gap="xs">
                      <Text size="sm" fw={600} c={isToday ? 'blue' : 'dimmed'}>
                        {dayName}
                      </Text>
                      <Text size="lg" fw={700} {...(isToday ? { c: 'blue' } : {})}>
                        {weekStart.getDate()}
                      </Text>
                      <Stack gap={4} mt="xs">
                        {dayEvents.map((event) => {
                          const colors = getEventColorStyles(event.color, event.status, isDark);
                          return (
                            <Paper
                              key={event.id}
                              p="xs"
                              style={{
                                backgroundColor: colors?.bg,
                                borderLeft: `3px solid ${colors?.border}`,
                                cursor: 'pointer',
                              }}
                              onClick={() => onEventClick?.(event)}
                            >
                              <Text size="xs" fw={600} style={{ color: colors?.text }}>
                                {new Date(event.date).toLocaleTimeString('tr-TR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </Text>
                              <Text size="xs" style={{ color: colors?.textSecondary }} lineClamp={1}>
                                {event.title}
                              </Text>
                            </Paper>
                          );
                        })}
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
            </div>
          </Stack>
        </div>
      )}

      {/* Day View */}
      {view === 'Day' && (
        <div style={{ padding: '1rem' }}>
          <Stack gap="md">
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem' }}>
              {Array.from({ length: 24 }).map((_, hour) => {
                const hourDate = new Date(currentDate);
                hourDate.setHours(hour, 0, 0, 0);
                const hourEvents = events.filter((event) => {
                  const eventDate = new Date(event.date);
                  return (
                    eventDate.getDate() === hourDate.getDate() &&
                    eventDate.getMonth() === hourDate.getMonth() &&
                    eventDate.getFullYear() === hourDate.getFullYear() &&
                    eventDate.getHours() === hour
                  );
                });

                return (
                  <div key={hour} style={{ display: 'contents' }}>
                    <Text size="sm" c="dimmed" style={{ textAlign: 'right', paddingTop: '0.5rem' }}>
                      {hour.toString().padStart(2, '0')}:00
                    </Text>
                    <Paper
                      p="xs"
                      withBorder
                      style={{
                        minHeight: '60px',
                        position: 'relative',
                      }}
                    >
                      {hourEvents.map((event) => {
                        const colors = getEventColorStyles(event.color, event.status, isDark);
                        return (
                          <Paper
                            key={event.id}
                            p="xs"
                            mb="xs"
                            style={{
                              backgroundColor: colors?.bg,
                              borderLeft: `3px solid ${colors?.border}`,
                              cursor: 'pointer',
                            }}
                            onClick={() => onEventClick?.(event)}
                          >
                            <Text size="xs" fw={600} style={{ color: colors?.text }}>
                              {new Date(event.date).toLocaleTimeString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                            <Text size="sm" fw={500} style={{ color: colors?.textSecondary }}>
                              {event.title}
                            </Text>
                            {event.description && (
                              <Text size="xs" style={{ color: colors?.textSecondary }} lineClamp={1}>
                                {event.description}
                              </Text>
                            )}
                          </Paper>
                        );
                      })}
                    </Paper>
                  </div>
                );
              })}
            </div>
          </Stack>
        </div>
      )}
    </Paper>
  );
}
