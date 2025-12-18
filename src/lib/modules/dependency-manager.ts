import { ModuleManifest } from './types';
import semver from 'semver';

export class DependencyManager {
    private modules: Map<string, ModuleManifest>;

    constructor(modules: Map<string, ModuleManifest>) {
        this.modules = modules;
    }

    resolveDependencies(module: ModuleManifest): { valid: boolean; missing: string[]; incompatible: string[] } {
        const missing: string[] = [];
        const incompatible: string[] = [];

        if (!module.dependencies) {
            return { valid: true, missing, incompatible };
        }

        for (const dep of module.dependencies) {
            const depModule = this.modules.get(dep.slug);

            if (!depModule) {
                missing.push(dep.slug);
                continue;
            }

            if (dep.version && !semver.satisfies(depModule.version, dep.version)) {
                incompatible.push(`${dep.slug} (required: ${dep.version}, found: ${depModule.version})`);
            }
        }

        return {
            valid: missing.length === 0 && incompatible.length === 0,
            missing,
            incompatible
        };
    }

    checkCircularDependencies(slug: string, visited: Set<string> = new Set(), path: string[] = []): string[] | null {
        if (visited.has(slug)) {
            if (path.includes(slug)) {
                return [...path, slug];
            }
            return null;
        }

        visited.add(slug);
        path.push(slug);

        const module = this.modules.get(slug);
        if (module && module.dependencies) {
            for (const dep of module.dependencies) {
                const cycle = this.checkCircularDependencies(dep.slug, visited, [...path]);
                if (cycle) return cycle;
            }
        }

        return null;
    }
}
