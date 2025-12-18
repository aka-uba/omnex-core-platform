// Prompt Template Registry
// FAZ 0.2: Merkezi AI Servisi

import { PromptTemplate } from '../types';

/**
 * Template Registry
 * Stores and manages prompt templates for all modules
 */
export class TemplateRegistry {
  private templates: Map<string, PromptTemplate> = new Map();

  /**
   * Register a template
   */
  register(template: PromptTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get a template by ID
   */
  get(templateId: string): PromptTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Get all templates for a module
   */
  getByModule(module: string): PromptTemplate[] {
    return Array.from(this.templates.values()).filter(
      t => t.module === module
    );
  }

  /**
   * Get all templates
   */
  getAll(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Remove a template
   */
  remove(templateId: string): boolean {
    return this.templates.delete(templateId);
  }

  /**
   * Check if template exists
   */
  has(templateId: string): boolean {
    return this.templates.has(templateId);
  }

  /**
   * Render template with variables
   */
  render(templateId: string, variables: Record<string, any>): string {
    const template = this.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Check required variables
    const missingVars = template.variables.filter(v => !(v in variables));
    if (missingVars.length > 0) {
      throw new Error(`Missing required variables: ${missingVars.join(', ')}`);
    }

    // Replace variables in template
    let rendered = template.template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }

    return rendered;
  }
}

// Global template registry instance
export const templateRegistry = new TemplateRegistry();









