/**
 * Create Tenant Admin Script
 * 
 * Omnexcore tenant'ı için tenant admin kullanıcısı oluşturur
 */

import { corePrisma } from '../src/lib/corePrisma';
import { getTenantPrisma } from '../src/lib/dbSwitcher';
import { getTenantDbUrl } from '../src/lib/services/tenantService';
import bcrypt from 'bcryptjs';

const TENANT_ADMIN_PASSWORD = 'omnex.fre.2520*';

async function main() {
  const tenantSlug = process.argv.find(arg => arg.startsWith('--slug='))?.split('=')[1] || 'omnexcore';
  
  console.log(`👤 Creating tenant admin for: ${tenantSlug}\n`);

  try {
    const tenant = await corePrisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      console.error(`❌ Tenant "${tenantSlug}" not found!`);
      process.exit(1);
    }

    const dbUrl = getTenantDbUrl(tenant);
    const tenantPrisma = getTenantPrisma(dbUrl);

    // Check if tenant admin already exists
    const existingAdmin = await tenantPrisma.user.findFirst({
      where: {
        AND: [
          { username: 'admin' },
          { role: 'AgencyUser' },
        ],
      },
    });

    if (existingAdmin) {
      console.log(`✅ Tenant admin already exists: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      return;
    }

    // Check if super admin exists with same email
    const superAdmin = await tenantPrisma.user.findFirst({
      where: {
        email: `admin@${tenantSlug}.com`,
        role: 'SuperAdmin',
      },
    });

    if (superAdmin) {
      console.log(`⚠️  Super admin exists with email admin@${tenantSlug}.com`);
      console.log(`   Creating tenant admin with different email...`);
      
      // Create tenant admin with different email
      const hashedPassword = await bcrypt.hash(TENANT_ADMIN_PASSWORD, 10);
      const tenantAdmin = await tenantPrisma.user.create({
        data: {
          id: `${tenantSlug}-tenant-admin-001`,
          name: 'Admin User',
          username: 'admin',
          email: `tenant-admin@${tenantSlug}.com`,
          password: hashedPassword,
          role: 'AgencyUser',
          status: 'active',
        },
      });
      
      console.log(`✅ Tenant admin created: ${tenantAdmin.email}`);
      console.log(`   Username: ${tenantAdmin.username}`);
      console.log(`   Password: ${TENANT_ADMIN_PASSWORD}`);
    } else {
      // Create tenant admin with normal email
      const hashedPassword = await bcrypt.hash(TENANT_ADMIN_PASSWORD, 10);
      const tenantAdmin = await tenantPrisma.user.create({
        data: {
          id: `${tenantSlug}-admin-001`,
          name: 'Admin User',
          username: 'admin',
          email: `admin@${tenantSlug}.com`,
          password: hashedPassword,
          role: 'AgencyUser',
          status: 'active',
        },
      });
      
      console.log(`✅ Tenant admin created: ${tenantAdmin.email}`);
      console.log(`   Username: ${tenantAdmin.username}`);
      console.log(`   Password: ${TENANT_ADMIN_PASSWORD}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error: ${errorMessage}`);
    process.exit(1);
  } finally {
    await corePrisma.$disconnect();
  }
}

main();

