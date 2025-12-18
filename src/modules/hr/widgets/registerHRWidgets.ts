/**
 * HR Module - Register Widgets for Web Builder (FAZ 3)
 */

import { z } from 'zod';
import { widgetRegistry } from '@/lib/web-builder/widgets/WidgetRegistry';
import { EmployeeWidget } from './EmployeeWidget';
import { LeaveWidget } from './LeaveWidget';
import { IconUsers, IconCalendar } from '@tabler/icons-react';
import type { EmployeeWidgetConfig, LeaveWidgetConfig } from './widgets.types';

/**
 * Register HR module widgets
 */
export function registerHRWidgets(): void {
  // Employee Widget
  widgetRegistry.register({
    id: 'hr.employees',
    module: 'hr',
    name: 'Personel Listesi',
    description: 'Personelleri gösterir',
    icon: IconUsers,
    component: EmployeeWidget,
    configSchema: z.object({
      title: z.string().optional(),
      limit: z.number().int().positive().max(50).default(10),
      showOnlyActive: z.boolean().default(true),
      department: z.string().optional(),
    }),
    defaultConfig: {
      title: 'Personeller',
      limit: 10,
      showOnlyActive: true,
    } as EmployeeWidgetConfig,
    category: 'business',
    tags: ['employee', 'hr', 'personnel', 'personel'],
  });

  // Leave Widget
  widgetRegistry.register({
    id: 'hr.leaves',
    module: 'hr',
    name: 'İzin Listesi',
    description: 'İzin kayıtlarını gösterir',
    icon: IconCalendar,
    component: LeaveWidget,
    configSchema: z.object({
      title: z.string().optional(),
      limit: z.number().int().positive().max(50).default(10),
      status: z.enum(['all', 'pending', 'approved', 'rejected']).default('all'),
    }),
    defaultConfig: {
      title: 'İzinler',
      limit: 10,
      status: 'all',
    } as LeaveWidgetConfig,
    category: 'business',
    tags: ['leave', 'hr', 'vacation', 'izin'],
  });
}







