
import fs from 'fs/promises';
import path from 'path';
import { createTenantDirectoryStructure } from '../src/lib/services/tenantService-helpers';

async function fixTenantDirectories() {
    const tenantsDir = path.join(process.cwd(), 'storage', 'tenants');

    try {
        const tenants = await fs.readdir(tenantsDir, { withFileTypes: true });

        for (const dirent of tenants) {
            if (dirent.isDirectory()) {
                const tenantSlug = dirent.name;
                console.log(`Fixing directories for tenant: ${tenantSlug}`);
                await createTenantDirectoryStructure(tenantSlug);
            }
        }

        console.log('All tenant directories fixed successfully.');
    } catch (error) {
        console.error('Error fixing tenant directories:', error);
    }
}

fixTenantDirectories();
