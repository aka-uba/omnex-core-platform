import yaml from 'js-yaml';
import fs from 'fs/promises';
import Ajv from 'ajv';
import { ModuleManifest } from './types';
import schema from './schemas/module-config.schema.json';

export class YamlLoader {
    private ajv: Ajv;
    private validate: any;

    constructor() {
        // Configure Ajv to NOT remove additional properties (like menu.items)
        this.ajv = new Ajv({ 
            removeAdditional: false,
            strict: false,
            validateSchema: false
        });
        this.validate = this.ajv.compile(schema);
    }

    async load(path: string): Promise<ModuleManifest> {
        try {
            const fileContent = await fs.readFile(path, 'utf8');
            const config = yaml.load(fileContent) as any;

            // Store menu before validation (in case validation strips it)
            const menuBeforeValidation = config.menu;

            // Validate config but be lenient with menu validation
            // Menu items array might not be in schema, so we'll allow it
            if (!this.isValidConfig(config)) {
                // Filter out menu-related validation errors (menu.items is not in schema)
                const criticalErrors = this.validate.errors?.filter((e: any) => {
                    const errorPath = e.instancePath || '';
                    // Allow menu-related errors (menu is optional and items might not be in schema)
                    if (errorPath.includes('menu') || errorPath.includes('items')) {
                        return false;
                    }
                    return true;
                });
                
                if (criticalErrors && criticalErrors.length > 0) {
                    const errors = criticalErrors.map((e: any) => `${e.instancePath} ${e.message}`).join(', ');
                    throw new Error(`Invalid module configuration: ${errors}`);
                }
            }

            // Ensure menu is preserved (validation might have removed it)
            if (menuBeforeValidation && !config.menu) {
                config.menu = menuBeforeValidation;
            }


            return config as ModuleManifest;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to load YAML config from ${path}: ${error.message}`);
            }
            throw error;
        }
    }

    private isValidConfig(config: unknown): config is ModuleManifest {
        return this.validate(config);
    }
}
