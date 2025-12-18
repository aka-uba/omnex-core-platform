'use client';

import type { ReportType } from '@/modules/raporlar/types/report';

class ReportTypeRegistry {
  private reportTypes: Map<string, ReportType> = new Map();

  /**
   * Register a new report type
   */
  register(type: ReportType): void {
    this.reportTypes.set(type.id, type);
  }

  /**
   * Unregister a report type
   */
  unregister(id: string): void {
    this.reportTypes.delete(id);
  }

  /**
   * Get a report type by ID
   */
  get(id: string): ReportType | undefined {
    return this.reportTypes.get(id);
  }

  /**
   * Get all registered report types
   */
  getAll(): ReportType[] {
    return Array.from(this.reportTypes.values());
  }

  /**
   * Get report types by category
   */
  getByCategory(category: 'core' | 'module'): ReportType[] {
    return this.getAll().filter(type => type.category === category);
  }

  /**
   * Get report types by module
   */
  getByModule(module: string): ReportType[] {
    return this.getAll().filter(type => type.module === module);
  }

  /**
   * Clear all registered types
   */
  clear(): void {
    this.reportTypes.clear();
  }
}

// Singleton instance
export const reportTypeRegistry = new ReportTypeRegistry();


