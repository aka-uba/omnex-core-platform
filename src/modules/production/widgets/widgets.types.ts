/**
 * Production Module - Widget Types (FAZ 3)
 */

export interface ProductWidgetConfig {
  title?: string;
  limit: number;
  showOnlyActive?: boolean;
}

export interface OrderWidgetConfig {
  title?: string;
  limit: number;
  status?: 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
}







