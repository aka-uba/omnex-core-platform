/**
 * Maintenance Module - Register Widgets for Web Builder (FAZ 3)
 */

import { z } from 'zod';
import { widgetRegistry } from '@/lib/web-builder/widgets/WidgetRegistry';
import { MaintenanceWidget } from './MaintenanceWidget';
import { IconTools } from '@tabler/icons-react';
import type { MaintenanceWidgetConfig } from './widgets.types';

/**
 * Register maintenance module widgets
 */
export function registerMaintenanceWidgets(): void {
  // Maintenance Widget
  widgetRegistry.register({
    id: 'maintenance.records',
    module: 'maintenance',
    name: 'Bakım Kayıtları',
    description: 'Bakım kayıtlarını gösterir',
    icon: IconTools,
    component: MaintenanceWidget,
    configSchema: z.object({
      title: z.string().optional(),
      limit: z.number().int().positive().max(50).default(10),
      status: z
        .enum(['all', 'scheduled', 'in_progress', 'completed', 'cancelled'])
        .default('all'),
      type: z.enum(['all', 'preventive', 'corrective', 'emergency']).default('all'),
    }),
    defaultConfig: {
      title: 'Bakım Kayıtları',
      limit: 10,
      status: 'all',
      type: 'all',
    } as MaintenanceWidgetConfig,
    category: 'business',
    tags: ['maintenance', 'bakım', 'equipment', 'ekipman'],
  });
}







