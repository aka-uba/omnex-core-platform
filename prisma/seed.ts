import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Default password for all seed users
const DEFAULT_PASSWORD = 'Omnex123!';

async function main() {
  console.log('🌱 Starting seed...');

  // ============================================
  // 1. Create Agency (Omnex Agency)
  // ============================================
  console.log('📦 Creating agency...');
  const agency = await prisma.agency.upsert({
    where: { id: 'omnex-agency-001' },
    update: {},
    create: {
      id: 'omnex-agency-001',
      name: 'Omnex Agency',
      email: 'info@omnex.com',
      phone: '+90 212 555 0000',
      address: 'İstanbul, Türkiye',
      website: 'https://omnex.com',
    },
  });
  console.log('✅ Agency created:', agency.name);

  // ============================================
  // 2. Create Company (Omnex Core)
  // ============================================
  console.log('🏢 Creating company...');
  const company = await prisma.company.upsert({
    where: { id: 'omnex-company-001' },
    update: {},
    create: {
      id: 'omnex-company-001',
      name: 'Omnex Core',
      industry: 'Software & Technology',
      website: 'https://omnexcore.com',
      status: 'Active',
      agencyId: agency.id,
    },
  });
  console.log('✅ Company created:', company.name);

  // ============================================
  // 3. Create BrandKit
  // ============================================
  console.log('🎨 Creating brand kit...');
  await prisma.brandKit.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      logoUrl: '/logo.png',
      colorPalette: JSON.stringify({
        primary: '#0066cc',
        secondary: '#6c757d',
        success: '#28a745',
        danger: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8',
      }),
      fontFamily: 'Inter, sans-serif',
      toneOfVoice: 'Professional, Friendly, Modern',
    },
  });
  console.log('✅ Brand kit created');

  // ============================================
  // 4. Create Roles
  // ============================================
  console.log('👥 Creating roles...');
  
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SuperAdmin' },
    update: {},
    create: {
      name: 'SuperAdmin',
      description: 'Has full access to all system features and settings.',
      permissions: JSON.stringify(['*']), // All permissions
    },
  });

  const agencyUserRole = await prisma.role.upsert({
    where: { name: 'AgencyUser' },
    update: {},
    create: {
      name: 'AgencyUser',
      description: 'Manages clients, content, and scheduling for the agency.',
      permissions: JSON.stringify([
        'client.view',
        'client.create',
        'client.edit',
        'content.view',
        'content.create',
        'content.edit',
        'schedule.view',
        'schedule.create',
        'ai.generate',
      ]),
    },
  });

  const clientUserRole = await prisma.role.upsert({
    where: { name: 'ClientUser' },
    update: {},
    create: {
      name: 'ClientUser',
      description: 'Can view and comment on assigned content and projects.',
      permissions: JSON.stringify([
        'content.view',
        'schedule.view',
      ]),
    },
  });

  console.log('✅ Roles created:', [superAdminRole.name, agencyUserRole.name, clientUserRole.name]);

  // ============================================
  // 5. Create Permission Definitions
  // ============================================
  console.log('🔐 Creating permissions...');

  const permissions = [
    // Client Management
    {
      permissionKey: 'client.view',
      permissionName: 'View Clients',
      description: 'Allows user to view client records.',
      category: 'Client Management',
      module: 'CRM',
    },
    {
      permissionKey: 'client.create',
      permissionName: 'Create Client',
      description: 'Allows user to create new client records.',
      category: 'Client Management',
      module: 'CRM',
    },
    {
      permissionKey: 'client.edit',
      permissionName: 'Edit Client',
      description: 'Allows user to edit existing client details.',
      category: 'Client Management',
      module: 'CRM',
    },
    {
      permissionKey: 'client.delete',
      permissionName: 'Delete Client',
      description: 'Allows user to delete client records.',
      category: 'Client Management',
      module: 'CRM',
    },
    // Content Management
    {
      permissionKey: 'content.view',
      permissionName: 'View Content',
      description: 'Allows user to view content items.',
      category: 'Content Management',
      module: 'Content',
    },
    {
      permissionKey: 'content.create',
      permissionName: 'Create Content',
      description: 'Allows user to create new content items.',
      category: 'Content Management',
      module: 'Content',
    },
    {
      permissionKey: 'content.edit',
      permissionName: 'Edit Content',
      description: 'Allows user to edit existing content.',
      category: 'Content Management',
      module: 'Content',
    },
    {
      permissionKey: 'content.delete',
      permissionName: 'Delete Content',
      description: 'Allows user to delete content items.',
      category: 'Content Management',
      module: 'Content',
    },
    // Scheduling
    {
      permissionKey: 'schedule.view',
      permissionName: 'View Schedule',
      description: 'Allows user to view the company-wide schedule.',
      category: 'Scheduling',
      module: 'Scheduler',
    },
    {
      permissionKey: 'schedule.create',
      permissionName: 'Create Schedule',
      description: 'Allows user to create schedule entries.',
      category: 'Scheduling',
      module: 'Scheduler',
    },
    {
      permissionKey: 'schedule.edit',
      permissionName: 'Edit Schedule',
      description: 'Allows user to edit schedule entries.',
      category: 'Scheduling',
      module: 'Scheduler',
    },
    // AI
    {
      permissionKey: 'ai.generate',
      permissionName: 'Generate AI Content',
      description: 'Enables access to the AI content generation feature.',
      category: 'Content AI',
      module: 'AI',
    },
    {
      permissionKey: 'ai.text.generate',
      permissionName: 'Generate AI Text',
      description: 'Allows user to generate text content using AI.',
      category: 'Content AI',
      module: 'AI',
    },
    {
      permissionKey: 'ai.image.generate',
      permissionName: 'Generate AI Image',
      description: 'Allows user to generate images using AI.',
      category: 'Content AI',
      module: 'AI',
    },
    // Finance
    {
      permissionKey: 'finance.view',
      permissionName: 'View Finance',
      description: 'Allows user to view financial records.',
      category: 'Finance',
      module: 'Finance',
    },
    {
      permissionKey: 'finance.view_all',
      permissionName: 'View All Financials',
      description: 'Grants full access to view all financial records.',
      category: 'Finance',
      module: 'Finance',
    },
    {
      permissionKey: 'finance.create',
      permissionName: 'Create Finance Entry',
      description: 'Allows user to create financial entries.',
      category: 'Finance',
      module: 'Finance',
    },
    // User Management
    {
      permissionKey: 'user.view',
      permissionName: 'View Users',
      description: 'Allows user to view user records.',
      category: 'User Management',
      module: 'Admin',
    },
    {
      permissionKey: 'user.create',
      permissionName: 'Create User',
      description: 'Allows user to create new user accounts.',
      category: 'User Management',
      module: 'Admin',
    },
    {
      permissionKey: 'user.edit',
      permissionName: 'Edit User',
      description: 'Allows user to edit user accounts.',
      category: 'User Management',
      module: 'Admin',
    },
    {
      permissionKey: 'user.delete',
      permissionName: 'Delete User',
      description: 'Allows user to delete user accounts.',
      category: 'User Management',
      module: 'Admin',
    },
    // Module Management
    {
      permissionKey: 'module.view',
      permissionName: 'View Modules',
      description: 'Allows user to view installed modules.',
      category: 'Module Management',
      module: 'Admin',
    },
    {
      permissionKey: 'module.install',
      permissionName: 'Install Module',
      description: 'Allows user to install new modules.',
      category: 'Module Management',
      module: 'Admin',
    },
    {
      permissionKey: 'module.activate',
      permissionName: 'Activate Module',
      description: 'Allows user to activate modules.',
      category: 'Module Management',
      module: 'Admin',
    },
    {
      permissionKey: 'module.deactivate',
      permissionName: 'Deactivate Module',
      description: 'Allows user to deactivate modules.',
      category: 'Module Management',
      module: 'Admin',
    },
  ];

  for (const permission of permissions) {
    await prisma.permissionDefinition.upsert({
      where: { permissionKey: permission.permissionKey },
      update: {},
      create: permission,
    });
  }

  console.log(`✅ ${permissions.length} permissions created`);

  // ============================================
  // 6. Create Users
  // ============================================
  console.log('👤 Creating users...');

  // Super Admin User
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@omnexcore.com' },
    update: {
      username: 'admin',
      password: await bcrypt.hash(DEFAULT_PASSWORD, 10),
      status: 'active',
    },
    create: {
      name: 'Super Admin',
      username: 'admin',
      email: 'admin@omnexcore.com',
      password: await bcrypt.hash(DEFAULT_PASSWORD, 10),
      role: 'SuperAdmin',
      status: 'active',
      agencyId: agency.id,
      phone: '+90 555 000 0001',
      department: 'Administration',
      position: 'System Administrator',
      employeeId: 'EMP-001',
      defaultLanguage: 'tr',
      defaultTheme: 'auto',
      defaultLayout: 'sidebar',
    },
  });

  // Agency User
  const agencyUser = await prisma.user.upsert({
    where: { email: 'agency@omnexcore.com' },
    update: {
      username: 'agency',
      password: await bcrypt.hash(DEFAULT_PASSWORD, 10),
      status: 'active',
    },
    create: {
      name: 'Agency Manager',
      username: 'agency',
      email: 'agency@omnexcore.com',
      password: await bcrypt.hash(DEFAULT_PASSWORD, 10),
      role: 'AgencyUser',
      status: 'active',
      agencyId: agency.id,
      phone: '+90 555 000 0002',
      department: 'Agency Operations',
      position: 'Agency Manager',
      employeeId: 'EMP-002',
      defaultLanguage: 'tr',
      defaultTheme: 'auto',
      defaultLayout: 'sidebar',
    },
  });

  // Client User
  const clientUser = await prisma.user.upsert({
    where: { email: 'client@omnexcore.com' },
    update: {
      username: 'client',
      password: await bcrypt.hash(DEFAULT_PASSWORD, 10),
      status: 'active',
    },
    create: {
      name: 'Client User',
      username: 'client',
      email: 'client@omnexcore.com',
      password: await bcrypt.hash(DEFAULT_PASSWORD, 10),
      role: 'ClientUser',
      status: 'active',
      agencyId: agency.id,
      phone: '+90 555 000 0003',
      department: 'Client Services',
      position: 'Client Representative',
      employeeId: 'EMP-003',
      defaultLanguage: 'tr',
      defaultTheme: 'auto',
      defaultLayout: 'sidebar',
    },
  });

  // Link users to company (many-to-many relation)
  await prisma.company.update({
    where: { id: company.id },
    data: {
      users: {
        connect: [
          { id: superAdmin.id },
          { id: agencyUser.id },
          { id: clientUser.id },
        ],
      },
    },
  });

  console.log('✅ Users created:', [superAdmin.name, agencyUser.name, clientUser.name]);

  // ============================================
  // 7. Create User Preferences
  // ============================================
  console.log('⚙️ Creating user preferences...');

  await prisma.userPreferences.upsert({
    where: { userId: superAdmin.id },
    update: {},
    create: {
      userId: superAdmin.id,
      layoutType: 'SidebarLayout',
      themeMode: 'Auto',
      direction: 'LTR',
      locale: 'tr',
      sidebarBackground: 'light',
      sidebarCollapsed: false,
      sidebarWidth: 260,
      footerVisible: true,
      topBarScroll: 'fixed',
      menuColor: 'light',
    },
  });

  await prisma.userPreferences.upsert({
    where: { userId: agencyUser.id },
    update: {},
    create: {
      userId: agencyUser.id,
      layoutType: 'SidebarLayout',
      themeMode: 'Auto',
      direction: 'LTR',
      locale: 'tr',
      sidebarBackground: 'light',
      sidebarCollapsed: false,
      sidebarWidth: 260,
      footerVisible: true,
      topBarScroll: 'fixed',
      menuColor: 'light',
    },
  });

  await prisma.userPreferences.upsert({
    where: { userId: clientUser.id },
    update: {},
    create: {
      userId: clientUser.id,
      layoutType: 'SidebarLayout',
      themeMode: 'Auto',
      direction: 'LTR',
      locale: 'tr',
      sidebarBackground: 'light',
      sidebarCollapsed: false,
      sidebarWidth: 260,
      footerVisible: true,
      topBarScroll: 'fixed',
      menuColor: 'light',
    },
  });

  console.log('✅ User preferences created');

  // ============================================
  // Summary
  // ============================================
  console.log('\n✨ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Agency: ${agency.name}`);
  console.log(`   - Company: ${company.name}`);
  console.log(`   - Roles: ${[superAdminRole.name, agencyUserRole.name, clientUserRole.name].join(', ')}`);
  console.log(`   - Permissions: ${permissions.length}`);
  console.log(`   - Users: ${[superAdmin.name, agencyUser.name, clientUser.name].join(', ')}`);
  console.log('\n🔑 Default Login Credentials:');
  console.log('   Super Admin: admin@omnexcore.com');
  console.log('   Agency User: agency@omnexcore.com');
  console.log('   Client User: client@omnexcore.com');
  console.log('   ⚠️  Note: Passwords need to be hashed with bcrypt');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

