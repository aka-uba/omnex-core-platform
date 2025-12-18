/**
 * Create Tenant Script
 * 
 * Command line tool for creating new tenants
 * Usage: tsx scripts/create-tenant.ts --name="ACME Corp" --slug="acme" --subdomain="acme"
 */

import { createTenant, CreateTenantInput } from '../src/lib/services/tenantService';

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const input: CreateTenantInput = {
    name: '',
    slug: '',
  };

  for (const arg of args) {
    if (arg.startsWith('--name=')) {
      input.name = arg.split('=')[1].replace(/^["']|["']$/g, '');
    } else if (arg.startsWith('--slug=')) {
      input.slug = arg.split('=')[1].replace(/^["']|["']$/g, '');
    } else if (arg.startsWith('--subdomain=')) {
      input.subdomain = arg.split('=')[1].replace(/^["']|["']$/g, '');
    } else if (arg.startsWith('--custom-domain=')) {
      input.customDomain = arg.split('=')[1].replace(/^["']|["']$/g, '');
    } else if (arg.startsWith('--agency-id=')) {
      input.agencyId = arg.split('=')[1].replace(/^["']|["']$/g, '');
    } else if (arg.startsWith('--year=')) {
      input.year = parseInt(arg.split('=')[1], 10);
    }
  }

  // Validate required fields
  if (!input.name || !input.slug) {
    console.error('❌ Error: --name and --slug are required');
    console.log('\nUsage:');
    console.log('  tsx scripts/create-tenant.ts --name="ACME Corp" --slug="acme" [options]');
    console.log('\nOptions:');
    console.log('  --name="Company Name"        Tenant company name (required)');
    console.log('  --slug="acme"                Tenant slug (required)');
    console.log('  --subdomain="acme"           Subdomain for routing (optional)');
    console.log('  --custom-domain="acme.com"   Custom domain (optional)');
    console.log('  --agency-id="agency-id"       Agency ID (optional)');
    console.log('  --year=2025                  Year for DB naming (optional, default: current year)');
    process.exit(1);
  }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(input.slug)) {
    console.error('❌ Error: Slug must contain only lowercase letters, numbers, and hyphens');
    process.exit(1);
  }

  try {
    console.log('🚀 Creating tenant...');
    console.log(`   Name: ${input.name}`);
    console.log(`   Slug: ${input.slug}`);
    if (input.subdomain) console.log(`   Subdomain: ${input.subdomain}`);
    if (input.customDomain) console.log(`   Custom Domain: ${input.customDomain}`);
    if (input.agencyId) console.log(`   Agency ID: ${input.agencyId}`);
    console.log('');

    const result = await createTenant(input);

    console.log('');
    console.log('✅ Tenant created successfully!');
    console.log(`   Tenant ID: ${result.tenant.id}`);
    console.log(`   Database: ${result.tenant.dbName}`);
    console.log(`   Database URL: ${result.dbUrl}`);
    console.log('');
    console.log('📝 Next steps:');
    console.log(`   1. Access tenant via: ${input.subdomain ? `${input.subdomain}.onwindos.com` : `/tenant/${input.slug}`}`);
    console.log(`   2. Default admin: admin@${input.slug}.com / Omnex123!`);
  } catch (error: any) {
    console.error('');
    console.error('❌ Tenant creation failed:');
    console.error(error.message || error);
    process.exit(1);
  }
}

main();


