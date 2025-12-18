/**
 * Production Module - Initialization (FAZ 3)
 * Registers production widgets for Web Builder
 */

import { registerProductionWidgets } from '../widgets/registerProductionWidgets';

/**
 * Initialize Production module
 */
export function initProductionModule(): void {
  registerProductionWidgets();
}



