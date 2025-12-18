/**
 * Sync Super Admin Script
 * 
 * admin@omnexcore.com kullanıcısını tüm aktif tenant'lara ekler
 * Bu kullanıcı hem super admin hem de her tenant'ın admin'i olur
 */

import { corePrisma } from '../src/lib/corePrisma';
import { getTenantPrisma } from '../src/lib/dbSwitcher';
import { getTenantDbUrl } from '../src/lib/services/tenantService';
import bcrypt from 'bcryptjs';

const SUPER_ADMIN_EMAIL = 'superadmin@omnexcore.com';
const SUPER_ADMIN_USERNAME = 'superadmin';
const SUPER_ADMIN_PASSWORD = 'uba1453.2010*'; // v1.0.8 yeni şifre politikası

async function main() {
  console.log('🔄 Syncing super admin to all tenants...\n');

  try {
    // 1. Tüm aktif tenant'ları al
    const tenants = await corePrisma.tenant.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`📊 Found ${tenants.length} active tenant(s)\n`);

    if (tenants.length === 0) {
      console.log('⚠️  No active tenants found');
      return;
    }

    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
    let successCount = 0;
    let errorCount = 0;

    // 2. Her tenant'a super admin kullanıcısını ekle
    for (const tenant of tenants) {
      try {
        console.log(`🏢 Processing tenant: ${tenant.name} (${tenant.slug})`);
        
        const dbUrl = getTenantDbUrl(tenant);
        const tenantPrisma = getTenantPrisma(dbUrl);

        // Önce mevcut kullanıcıyı kontrol et
        const existingUser = await tenantPrisma.user.findFirst({
          where: {
            OR: [
              { email: SUPER_ADMIN_EMAIL },
              { username: SUPER_ADMIN_USERNAME },
            ],
          },
        });

        let adminUser;
        if (existingUser) {
          // Mevcut kullanıcıyı güncelle
          adminUser = await tenantPrisma.user.update({
            where: { id: existingUser.id },
            data: {
              email: SUPER_ADMIN_EMAIL,
              username: SUPER_ADMIN_USERNAME,
              password: hashedPassword,
              status: 'active',
              role: 'SuperAdmin',
              name: 'Super Admin',
            },
          });
        } else {
          // Yeni kullanıcı oluştur
          adminUser = await tenantPrisma.user.create({
            data: {
              id: `${tenant.slug}-super-admin-001`,
              name: 'Super Admin',
              username: SUPER_ADMIN_USERNAME,
              email: SUPER_ADMIN_EMAIL,
              password: hashedPassword,
              role: 'SuperAdmin',
              status: 'active',
            },
          });
        }

        console.log(`   ✅ Super admin added/updated: ${adminUser.email}`);
        successCount++;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Failed: ${errorMessage}`);
        errorCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`\n📝 Super admin credentials:`);
    console.log(`   Email: ${SUPER_ADMIN_EMAIL}`);
    console.log(`   Username: ${SUPER_ADMIN_USERNAME}`);
    console.log(`   Password: ${SUPER_ADMIN_PASSWORD}`);
    console.log(`\n✅ Sync completed!`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await corePrisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

