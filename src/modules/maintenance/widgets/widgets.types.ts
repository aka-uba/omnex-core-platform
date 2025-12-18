/**
 * Maintenance Module - Widget Types (FAZ 3)
 */

export interface MaintenanceWidgetConfig {
  title?: string;
  limit: number;
  status?: 'all' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  type?: 'all' | 'preventive' | 'corrective' | 'emergency';
}







