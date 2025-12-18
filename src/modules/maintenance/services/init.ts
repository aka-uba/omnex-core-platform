/**
 * Maintenance Module - Initialization (FAZ 3)
 * Registers maintenance widgets for Web Builder
 */

import { registerMaintenanceWidgets } from '../widgets/registerMaintenanceWidgets';

/**
 * Initialize Maintenance module
 */
export function initMaintenanceModule(): void {
  registerMaintenanceWidgets();
}



