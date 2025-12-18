/**
 * Accounting Module - Initialization (FAZ 3)
 * Registers accounting widgets for Web Builder
 */

import { registerAccountingWidgets } from '../widgets/registerAccountingWidgets';

/**
 * Initialize Accounting module
 * This should be called when the module is loaded
 */
export function initAccountingModule(): void {
  // Register accounting widgets for Web Builder
  registerAccountingWidgets();
}



