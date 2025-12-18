/**
 * Web Builder - Module Initialization (FAZ 3)
 * Registers all widgets when the module is loaded
 */

import { registerWebBuilderWidgets } from '@/modules/web-builder/services/registerWebBuilderWidgets';

/**
 * Initialize Web Builder module
 * This should be called when the application starts or when the module is loaded
 */
export function initWebBuilder(): void {
  // Register default web-builder widgets
  registerWebBuilderWidgets();
  
  // Note: Module-specific widgets (like accounting) should be registered
  // in their respective module initialization files
}







