'use client';

import React from 'react';

/**
 * Client-side module loader utility
 * Handles dynamic imports of module components without using Node.js APIs (fs, path)
 * 
 * NOTE: Dynamic imports with template strings are not supported by Next.js/Turbopack.
 * This utility is kept for potential future use but currently returns null.
 * All module settings pages should use ModuleSettingsPage component directly.
 */
export class ClientModuleLoader {
    /**
     * Load a module's settings component
     * Tries to load from standard locations
     * 
     * @deprecated This method is not supported by Next.js/Turbopack dynamic imports.
     * Use ModuleSettingsPage component directly instead.
     */
    static async loadSettingsComponent(slug: string): Promise<React.ComponentType<any> | null> {
        // Dynamic imports with template strings are not supported by Next.js/Turbopack
        // All module settings should use ModuleSettingsPage component directly
        return null;
    }

    /**
     * Load a specific component from a module
     * 
     * @deprecated This method is not supported by Next.js/Turbopack dynamic imports.
     * Import components directly instead.
     */
    static async loadComponent(slug: string, componentName: string): Promise<React.ComponentType<any> | null> {
        // Dynamic imports with template strings are not supported by Next.js/Turbopack
        // Import components directly instead
        return null;
    }
}
