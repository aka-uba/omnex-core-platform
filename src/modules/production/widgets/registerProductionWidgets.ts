/**
 * Production Module - Register Widgets for Web Builder (FAZ 3)
 */

import { z } from 'zod';
import { widgetRegistry } from '@/lib/web-builder/widgets/WidgetRegistry';
import { ProductWidget } from './ProductWidget';
import { OrderWidget } from './OrderWidget';
import { IconPackage, IconClipboardList } from '@tabler/icons-react';
import type { ProductWidgetConfig, OrderWidgetConfig } from './widgets.types';

/**
 * Register production module widgets
 */
export function registerProductionWidgets(): void {
  // Product Widget
  widgetRegistry.register({
    id: 'production.products',
    module: 'production',
    name: 'Ürün Listesi',
    description: 'Ürünleri gösterir',
    icon: IconPackage,
    component: ProductWidget,
    configSchema: z.object({
      title: z.string().optional(),
      limit: z.number().int().positive().max(50).default(10),
      showOnlyActive: z.boolean().default(true),
    }),
    defaultConfig: {
      title: 'Ürünler',
      limit: 10,
      showOnlyActive: true,
    } as ProductWidgetConfig,
    category: 'business',
    tags: ['product', 'production', 'stock', 'ürün'],
  });

  // Order Widget
  widgetRegistry.register({
    id: 'production.orders',
    module: 'production',
    name: 'Üretim Emirleri',
    description: 'Üretim emirlerini gösterir',
    icon: IconClipboardList,
    component: OrderWidget,
    configSchema: z.object({
      title: z.string().optional(),
      limit: z.number().int().positive().max(50).default(10),
      status: z.enum(['all', 'pending', 'in_progress', 'completed', 'cancelled']).default('all'),
    }),
    defaultConfig: {
      title: 'Üretim Emirleri',
      limit: 10,
      status: 'all',
    } as OrderWidgetConfig,
    category: 'business',
    tags: ['order', 'production', 'manufacturing', 'üretim'],
  });
}







