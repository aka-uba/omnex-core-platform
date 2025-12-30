/**
 * Tenant Seed Script
 * 
 * Her tenant DB için varsayılan verileri oluşturur
 * Usage: TENANT_DATABASE_URL="..." tsx prisma/seed/tenant-seed.ts --tenant-slug=acme
 */

import { PrismaClient as TenantPrismaClient } from '@prisma/tenant-client';
import bcrypt from 'bcryptjs';

const tenantPrisma = new TenantPrismaClient();

// Password policies
const SUPER_ADMIN_PASSWORD = 'uba1453.2010*'; // Platform super admin (admin@omnexcore.com)
const TENANT_ADMIN_PASSWORD = 'omnex.fre.2520*'; // Tenant admin (admin@{tenant}.com)
const DEFAULT_USER_PASSWORD = 'user.2024*'; // Default users

// Get tenant slug from command line args
const tenantSlug = process.argv.find(arg => arg.startsWith('--tenant-slug='))?.split('=')[1] || 'default';

async function main() {
  console.log(`🌱 Starting tenant seed for: ${tenantSlug}`);

  try {
    // ============================================
    // 1. Create Default Company
    // ============================================
    console.log('🏢 Creating default company...');
    const company = await tenantPrisma.company.upsert({
      where: { id: `${tenantSlug}-company-001` },
      update: {},
      create: {
        id: `${tenantSlug}-company-001`,
        name: `${tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1)} Company`,
        industry: 'General',
        status: 'Active',
      },
    });
    console.log('✅ Company created:', company.name);

    // ============================================
    // 2a. Create Super Admin User (Platform Super Admin) - ÖNCE SUPER ADMIN
    // ============================================
    console.log('👤 Creating super admin user (superadmin@omnexcore.com)...');
    const superAdminHashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

    // Super admin'i kontrol et ve oluştur/güncelle
    const existingSuperAdmin = await tenantPrisma.user.findFirst({
      where: {
        OR: [
          { email: 'superadmin@omnexcore.com' },
          { username: 'superadmin' },
        ],
      },
    });

    let superAdminUser;
    if (existingSuperAdmin) {
      // Mevcut kullanıcıyı güncelle
      superAdminUser = await tenantPrisma.user.update({
        where: { id: existingSuperAdmin.id },
        data: {
          email: 'superadmin@omnexcore.com',
          username: 'superadmin',
          password: superAdminHashedPassword,
          status: 'active',
          role: 'SuperAdmin',
          name: 'Super Admin',
        },
      });
      console.log('✅ Super admin updated:', superAdminUser.email);
    } else {
      // Yeni kullanıcı oluştur
      superAdminUser = await tenantPrisma.user.create({
        data: {
          id: `${tenantSlug}-super-admin-001`,
          name: 'Super Admin',
          username: 'superadmin',
          email: 'superadmin@omnexcore.com',
          password: superAdminHashedPassword,
          role: 'SuperAdmin',
          status: 'active',
        },
      });
      console.log('✅ Super admin created:', superAdminUser.email);
    }
    console.log(`   Username: superadmin`);
    console.log(`   Password: ${SUPER_ADMIN_PASSWORD}`);

    // ============================================
    // 2b. Create Default Admin User (Tenant Admin) - SONRA TENANT ADMIN
    // ============================================
    console.log('👤 Creating default admin user (tenant admin)...');
    const tenantAdminHashedPassword = await bcrypt.hash(TENANT_ADMIN_PASSWORD, 10);

    // Tenant admin'i kontrol et ve oluştur/güncelle
    // Önce email ile kontrol et
    let existingTenantAdmin = await tenantPrisma.user.findUnique({
      where: { email: `admin@${tenantSlug}.com` },
    });

    // Email yoksa username ile kontrol et
    if (!existingTenantAdmin) {
      existingTenantAdmin = await tenantPrisma.user.findUnique({
        where: { username: 'admin' },
      });
    }

    let adminUser;
    if (existingTenantAdmin) {
      // Mevcut kullanıcıyı güncelle
      const updateData: any = {
        password: tenantAdminHashedPassword,
        role: 'AgencyUser', // Tenant admin - sadece kendi tenant'ına erişebilir
        status: 'active',
        name: 'Admin User',
      };
      
      // Email'i güncelle - çakışma kontrolü yap
      if (existingTenantAdmin.email !== `admin@${tenantSlug}.com`) {
        const emailExists = await tenantPrisma.user.findUnique({
          where: { email: `admin@${tenantSlug}.com` },
        });
        if (!emailExists) {
          updateData.email = `admin@${tenantSlug}.com`;
        }
      }
      
      // Username'i güncelle - çakışma kontrolü yap
      if (existingTenantAdmin.username !== 'admin') {
        const usernameExists = await tenantPrisma.user.findUnique({
          where: { username: 'admin' },
        });
        if (!usernameExists) {
          updateData.username = 'admin';
        }
      }
      
      adminUser = await tenantPrisma.user.update({
        where: { id: existingTenantAdmin.id },
        data: updateData,
      });
      console.log('✅ Admin user updated:', adminUser.email, `(username: ${adminUser.username})`);
    } else {
      // Yeni kullanıcı oluştur
      adminUser = await tenantPrisma.user.create({
        data: {
          id: `${tenantSlug}-admin-001`,
          name: 'Admin User',
          username: 'admin',
          email: `admin@${tenantSlug}.com`,
          password: tenantAdminHashedPassword,
          role: 'AgencyUser', // Tenant admin - sadece kendi tenant'ına erişebilir
          status: 'active',
        },
      });
      console.log('✅ Admin user created:', adminUser.email);
    }
    
    console.log(`   Username: admin`);
    console.log(`   Password: ${TENANT_ADMIN_PASSWORD}`);

    // ============================================
    // 2c. Create Default User (Lowest Role, Inactive)
    // ============================================
    console.log('👤 Creating default user with lowest role...');
    const defaultUserHashedPassword = await bcrypt.hash(DEFAULT_USER_PASSWORD, 10);

    const defaultUser = await tenantPrisma.user.upsert({
      where: { email: `user@${tenantSlug}.com` },
      update: {
        password: defaultUserHashedPassword,
        username: 'user',
        role: 'ClientUser',
        status: 'inactive',
        name: 'Default User',
      },
      create: {
        id: `${tenantSlug}-user-001`,
        name: 'Default User',
        username: 'user',
        email: `user@${tenantSlug}.com`,
        password: defaultUserHashedPassword,
        role: 'ClientUser', // Lowest role
        status: 'inactive', // Inactive by default
      },
    });
    console.log('✅ Default user created/updated:', defaultUser.email);
    console.log(`   Username: user`);
    console.log(`   Role: ${defaultUser.role} (lowest role)`);
    console.log(`   Status: ${defaultUser.status} (inactive)`);
    console.log(`   Password: ${DEFAULT_USER_PASSWORD}`);

    // ============================================
    // 3. Get tenant ID from core database
    // ============================================
    const { PrismaClient: CorePrismaClient } = require('@prisma/core-client');
    const corePrisma = new CorePrismaClient();
    
    let realTenantId: string;
    try {
      const coreTenant = await corePrisma.tenant.findUnique({
        where: { slug: tenantSlug },
        select: { id: true }
      });
      realTenantId = coreTenant?.id || tenantSlug;
    } catch {
      realTenantId = tenantSlug;
    } finally {
      await corePrisma.$disconnect();
    }

    // ============================================
    // 4. Create Default Roles
    // ============================================
    console.log('🔐 Creating default roles...');

    // Roles with i18n keys - translated on frontend
    const roles = [
      {
        id: `${tenantSlug}-role-superadmin`,
        tenantId: realTenantId,
        companyId: company.id,
        name: 'roles.items.superAdmin.name',
        description: 'roles.items.superAdmin.description',
        permissions: ['*'], // All permissions
      },
      {
        id: `${tenantSlug}-role-agency`,
        tenantId: realTenantId,
        companyId: company.id,
        name: 'roles.items.agencyUser.name',
        description: 'roles.items.agencyUser.description',
        permissions: ['user.read', 'user.create', 'notification.read'],
      },
      {
        id: `${tenantSlug}-role-client`,
        tenantId: realTenantId,
        companyId: company.id,
        name: 'roles.items.clientUser.name',
        description: 'roles.items.clientUser.description',
        permissions: ['notification.read', 'report.read'],
      },
    ];

    for (const roleData of roles) {
      // Use upsert to update existing roles with new i18n keys
      await tenantPrisma.role.upsert({
        where: { id: roleData.id },
        update: {
          name: roleData.name,
          description: roleData.description,
          permissions: roleData.permissions,
        },
        create: roleData,
      });
      console.log(`✅ Role upserted: ${roleData.name}`);
    }

    // ============================================
    // 5. Create Default Permission Definitions
    // ============================================
    console.log('🔑 Creating default permission definitions...');

    // Permissions with i18n keys - translated on frontend
    const permissions = [
      {
        permissionKey: 'user.create',
        permissionName: 'permissions.items.user.create.name',
        description: 'permissions.items.user.create.description',
        category: 'permissions.categories.userManagement',
        module: 'permissions.modules.users',
      },
      {
        permissionKey: 'user.read',
        permissionName: 'permissions.items.user.read.name',
        description: 'permissions.items.user.read.description',
        category: 'permissions.categories.userManagement',
        module: 'permissions.modules.users',
      },
      {
        permissionKey: 'user.update',
        permissionName: 'permissions.items.user.update.name',
        description: 'permissions.items.user.update.description',
        category: 'permissions.categories.userManagement',
        module: 'permissions.modules.users',
      },
      {
        permissionKey: 'user.delete',
        permissionName: 'permissions.items.user.delete.name',
        description: 'permissions.items.user.delete.description',
        category: 'permissions.categories.userManagement',
        module: 'permissions.modules.users',
      },
      {
        permissionKey: 'notification.read',
        permissionName: 'permissions.items.notification.read.name',
        description: 'permissions.items.notification.read.description',
        category: 'permissions.categories.notifications',
        module: 'permissions.modules.notifications',
      },
      {
        permissionKey: 'notification.create',
        permissionName: 'permissions.items.notification.create.name',
        description: 'permissions.items.notification.create.description',
        category: 'permissions.categories.notifications',
        module: 'permissions.modules.notifications',
      },
      {
        permissionKey: 'report.read',
        permissionName: 'permissions.items.report.read.name',
        description: 'permissions.items.report.read.description',
        category: 'permissions.categories.reports',
        module: 'permissions.modules.reports',
      },
      {
        permissionKey: 'report.create',
        permissionName: 'permissions.items.report.create.name',
        description: 'permissions.items.report.create.description',
        category: 'permissions.categories.reports',
        module: 'permissions.modules.reports',
      },
    ];

    for (const permData of permissions) {
      await tenantPrisma.permissionDefinition.upsert({
        where: { permissionKey: permData.permissionKey },
        update: {
          permissionName: permData.permissionName,
          description: permData.description,
          category: permData.category,
          module: permData.module,
        },
        create: {
          ...permData,
          tenantId: realTenantId,
          companyId: company.id,
        },
      });
    }
    console.log(`✅ ${permissions.length} permission definitions created`);

    // ============================================
    // 6. Create User Preferences
    // ============================================
    // User preferences sadece admin user varsa oluştur
    if (adminUser) {
      console.log('⚙️  Creating user preferences...');
      try {
        await tenantPrisma.userPreferences.upsert({
          where: { userId: adminUser.id },
          update: {},
          create: {
            userId: adminUser.id,
            tenantId: realTenantId,
            companyId: company.id,
            layoutType: 'SidebarLayout',
            themeMode: 'Auto',
            direction: 'LTR',
            locale: 'tr',
          },
        });
        console.log('✅ User preferences created');
      } catch (error: any) {
        // Migration eksikse devam et
        if (error.code === 'P2022' || error.message?.includes('does not exist')) {
          console.log('⚠️  User preferences table not ready (migration may be needed), skipping...');
        } else {
          throw error;
        }
      }
    }

    // ============================================
    // 7. Create BrandKit
    // ============================================
    console.log('🎨 Creating brand kit...');
    await tenantPrisma.brandKit.upsert({
      where: { companyId: company.id },
      update: {},
      create: {
        companyId: company.id,
        tenantId: realTenantId,
        colorPalette: {
          primary: '#3b82f6',
          secondary: '#8b5cf6',
          accent: '#10b981',
        },
        fontFamily: 'Inter, sans-serif',
      },
    });
    console.log('✅ Brand kit created');

    console.log('✅ Tenant seed completed successfully!');
  } catch (error) {
    console.error('❌ Tenant seed failed:', error);
    throw error;
  } finally {
    await tenantPrisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


