/**
 * Find User Script
 * 
 * Belirli bir email/username'i tüm tenant DB'lerinde arar
 * Usage: tsx scripts/find-user.ts --email=admin@test.com
 *        tsx scripts/find-user.ts --username=admin
 */

import { corePrisma } from '../src/lib/corePrisma';
import { getTenantPrisma } from '../src/lib/dbSwitcher';
import { getTenantDbUrl } from '../src/lib/services/tenantService';

const email = process.argv.find(arg => arg.startsWith('--email='))?.split('=')[1];
const username = process.argv.find(arg => arg.startsWith('--username='))?.split('=')[1];

if (!email && !username) {
  console.error('❌ Email veya username belirtmelisiniz!');
  console.log('Usage: tsx scripts/find-user.ts --email=admin@test.com');
  console.log('       tsx scripts/find-user.ts --username=admin');
  process.exit(1);
}

async function main() {
  console.log(`🔍 Searching for user: ${email || username}\n`);

  try {
    const tenants = await corePrisma.tenant.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`📊 Checking ${tenants.length} active tenant(s)...\n`);

    let found = false;

    for (const tenant of tenants) {
      try {
        const dbUrl = getTenantDbUrl(tenant);
        const tenantPrisma = getTenantPrisma(dbUrl);
        
        const where: any = {};
        if (email) {
          where.email = email;
        }
        if (username) {
          where.username = username;
        }
        if (email && username) {
          where.OR = [
            { email },
            { username },
          ];
        }

        const user = await tenantPrisma.user.findFirst({
          where,
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: true,
            status: true,
          },
        });

        if (user) {
          found = true;
          console.log(`✅ User found in tenant: ${tenant.name} (${tenant.slug})`);
          console.log(`   Database: ${tenant.currentDb}`);
          console.log(`   User ID: ${user.id}`);
          console.log(`   Name: ${user.name}`);
          console.log(`   Username: ${user.username}`);
          console.log(`   Email: ${user.email}`);
          console.log(`   Role: ${user.role}`);
          console.log(`   Status: ${user.status}`);
          console.log('');
        }
      } catch (error) {
        console.error(`❌ Failed to access tenant DB for ${tenant.slug}:`, error);
      }
    }

    if (!found) {
      console.log(`❌ User not found in any tenant DB`);
      console.log(`\n📝 Available users:`);
      
      // List all users in all tenants
      for (const tenant of tenants) {
        try {
          const dbUrl = getTenantDbUrl(tenant);
          const tenantPrisma = getTenantPrisma(dbUrl);
          
          const users = await tenantPrisma.user.findMany({
            select: {
              username: true,
              email: true,
              role: true,
            },
            take: 5,
          });

          if (users.length > 0) {
            console.log(`\n   ${tenant.name} (${tenant.slug}):`);
            users.forEach(u => {
              console.log(`      - ${u.email} (${u.username}) - ${u.role}`);
            });
          }
        } catch (error) {
          // Skip if DB doesn't exist
        }
      }
    }
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

