/**
 * HR Module - Widget Types (FAZ 3)
 */

export interface EmployeeWidgetConfig {
  title?: string;
  limit: number;
  showOnlyActive?: boolean;
  department?: string;
}

export interface LeaveWidgetConfig {
  title?: string;
  limit: number;
  status?: 'all' | 'pending' | 'approved' | 'rejected';
}







