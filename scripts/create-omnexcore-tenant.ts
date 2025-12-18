/**
 * Create OmnexCore Tenant Script
 * 
 * Eski sistemden kalan admin@omnexcore.com kullanıcısı için
 * omnexcore tenant'ını oluşturur ve admin kullanıcısını ekler
 */

import { createTenant } from '../src/lib/services/tenantService';
import { corePrisma } from '../src/lib/corePrisma';
import { getTenantPrisma } from '../src/lib/dbSwitcher';
import { getTenantDbUrl } from '../src/lib/services/tenantService';
import bcrypt from 'bcryptjs';

const SUPER_ADMIN_PASSWORD = 'uba1453.2010*'; // v1.0.8 yeni şifre politikası

async function main() {
  console.log('🚀 Creating OmnexCore tenant for admin@omnexcore.com...\n');

  try {
    // 1. OmnexCore tenant'ını oluştur
    const tenantResult = await createTenant({
      name: 'Omnex Core',
      slug: 'omnexcore',
      subdomain: 'omnexcore',
      agencyId: 'omnex-agency-001', // Default agency
    });

    console.log('✅ Tenant created:', tenantResult.tenant.name);
    console.log(`   Database: ${tenantResult.tenant.dbName}\n`);

    // 2. admin@omnexcore.com kullanıcısını ekle
    const tenant = await corePrisma.tenant.findUnique({
      where: { slug: 'omnexcore' },
    });

    if (!tenant) {
      throw new Error('Tenant not found after creation');
    }

    const dbUrl = getTenantDbUrl(tenant);
    const tenantPrisma = getTenantPrisma(dbUrl);

    console.log('👤 Creating superadmin@omnexcore.com user...');
    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

    const adminUser = await tenantPrisma.user.upsert({
      where: { email: 'superadmin@omnexcore.com' },
      update: {
        password: hashedPassword,
        status: 'active',
        username: 'superadmin',
      },
      create: {
        id: 'omnexcore-super-admin-001',
        name: 'Super Admin',
        username: 'superadmin',
        email: 'superadmin@omnexcore.com',
        password: hashedPassword,
        role: 'SuperAdmin',
        status: 'active',
      },
    });

    console.log('✅ Super admin user created:', adminUser.email);
    console.log(`   Password: ${SUPER_ADMIN_PASSWORD}\n`);

    console.log('✅ OmnexCore tenant setup completed!');
    console.log('\n📝 Login credentials:');
    console.log(`   Email: superadmin@omnexcore.com`);
    console.log(`   Username: superadmin`);
    console.log(`   Password: ${SUPER_ADMIN_PASSWORD}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Check if tenant already exists
      if (error.message.includes('Unique constraint') || error.message.includes('already exists')) {
        console.log('⚠️  Tenant might already exist, checking...');
        
        const existingTenant = await corePrisma.tenant.findUnique({
          where: { slug: 'omnexcore' },
        });

        if (existingTenant) {
          console.log('✅ Tenant already exists:', existingTenant.name);
          
          // Check if user exists
          const dbUrl = getTenantDbUrl(existingTenant);
          const tenantPrisma = getTenantPrisma(dbUrl);
          
          const existingUser = await tenantPrisma.user.findUnique({
            where: { email: 'superadmin@omnexcore.com' },
          });

          if (existingUser) {
            console.log('✅ User already exists:', existingUser.email);
            // Update password if needed
            const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
            await tenantPrisma.user.update({
              where: { id: existingUser.id },
              data: {
                password: hashedPassword,
                username: 'superadmin',
                email: 'superadmin@omnexcore.com',
                status: 'active',
                role: 'SuperAdmin',
              },
            });
            console.log('\n📝 Login credentials:');
            console.log(`   Email: superadmin@omnexcore.com`);
            console.log(`   Username: superadmin`);
            console.log(`   Password: ${SUPER_ADMIN_PASSWORD}`);
          } else {
            // Create user
            console.log('👤 Creating superadmin@omnexcore.com user...');
            const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
            
            const adminUser = await tenantPrisma.user.create({
              data: {
                id: 'omnexcore-super-admin-001',
                name: 'Super Admin',
                username: 'superadmin',
                email: 'superadmin@omnexcore.com',
                password: hashedPassword,
                role: 'SuperAdmin',
                status: 'active',
              },
            });

            console.log('✅ Super admin user created:', adminUser.email);
            console.log(`   Password: ${SUPER_ADMIN_PASSWORD}`);
          }
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  } finally {
    await corePrisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

