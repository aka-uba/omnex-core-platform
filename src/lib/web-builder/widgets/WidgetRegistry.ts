/**
 * Web Builder - Central Widget Registry (FAZ 3)
 * Class-based, module-aware widget registration system
 */

import { z } from 'zod';
import * as React from 'react';

export interface WidgetConfig {
  id: string; // Format: 'module.widgetName' (e.g., 'accounting.invoices', 'web-builder.heading')
  module: string; // Module slug
  name: string; // Display name
  description?: string;
  icon?: React.ComponentType<React.PropsWithChildren<any>>;
  component: React.ComponentType<React.PropsWithChildren<any>>;
  configSchema: z.ZodSchema;
  defaultConfig: Record<string, any>;
  category?: string; // 'content', 'business', 'media', 'data', etc.
  previewImage?: string;
  tags?: string[]; // For search and filtering
}

export class WidgetRegistry {
  private static instance: WidgetRegistry;
  private widgets: Map<string, WidgetConfig> = new Map();
  
  private constructor() {}
  
  static getInstance(): WidgetRegistry {
    if (!WidgetRegistry.instance) {
      WidgetRegistry.instance = new WidgetRegistry();
    }
    return WidgetRegistry.instance;
  }
  
  /**
   * Register a widget
   */
  register(widget: WidgetConfig): void {
    // Validate widget ID format
    // Widget ID should follow format "module.widgetName"
    
    // Overwrite if already registered
    this.widgets.set(widget.id, widget);
  }
  
  /**
   * Get a widget by ID
   */
  get(id: string): WidgetConfig | undefined {
    return this.widgets.get(id);
  }
  
  /**
   * Get all registered widgets
   */
  getAll(): WidgetConfig[] {
    return Array.from(this.widgets.values());
  }
  
  /**
   * Get widgets by module
   */
  getByModule(module: string): WidgetConfig[] {
    return Array.from(this.widgets.values())
      .filter(w => w.module === module);
  }
  
  /**
   * Get widgets by category
   */
  getByCategory(category: string): WidgetConfig[] {
    return Array.from(this.widgets.values())
      .filter(w => w.category === category);
  }
  
  /**
   * Search widgets by name or tags
   */
  search(query: string): WidgetConfig[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.widgets.values())
      .filter(w => 
        w.name.toLowerCase().includes(lowerQuery) ||
        w.description?.toLowerCase().includes(lowerQuery) ||
        w.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
  }
  
  /**
   * Unregister a widget
   */
  unregister(id: string): void {
    this.widgets.delete(id);
  }
  
  /**
   * Check if a widget is registered
   */
  has(id: string): boolean {
    return this.widgets.has(id);
  }
  
  /**
   * Get widget count
   */
  count(): number {
    return this.widgets.size;
  }
}

// Export singleton instance
export const widgetRegistry = WidgetRegistry.getInstance();

