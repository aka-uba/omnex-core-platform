/**
 * Web Builder Module - Initialization (FAZ 3)
 * Called when the module is loaded
 */

import { registerWebBuilderWidgets } from './registerWebBuilderWidgets';

/**
 * Initialize Web Builder module widgets
 */
export function initWebBuilderModule(): void {
  // Register default web-builder widgets
  registerWebBuilderWidgets();
}



