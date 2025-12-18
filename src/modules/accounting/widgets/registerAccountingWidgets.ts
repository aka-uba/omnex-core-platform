/**
 * Accounting Module - Register Widgets for Web Builder (FAZ 3)
 */

import { z } from 'zod';
import { widgetRegistry } from '@/lib/web-builder/widgets/WidgetRegistry';
import { InvoiceWidget } from './InvoiceWidget';
import { IconReceipt } from '@tabler/icons-react';
import type { InvoiceWidgetConfig } from './widgets.types';

/**
 * Register accounting module widgets
 */
export function registerAccountingWidgets(): void {
  // Invoice Widget
  widgetRegistry.register({
    id: 'accounting.invoices',
    module: 'accounting',
    name: 'Fatura Listesi',
    description: 'Son faturaları gösterir',
    icon: IconReceipt,
    component: InvoiceWidget,
    configSchema: z.object({
      title: z.string().optional(),
      limit: z.number().int().positive().max(50).default(10),
      status: z.enum(['all', 'paid', 'pending', 'overdue']).default('all'),
    }),
    defaultConfig: {
      title: 'Son Faturalar',
      limit: 10,
      status: 'all',
    } as InvoiceWidgetConfig,
    category: 'business',
    tags: ['invoice', 'accounting', 'finance', 'fatura'],
  });

  // TODO: Add PaymentWidget and SubscriptionWidget in future
}







