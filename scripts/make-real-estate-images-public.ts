/**
 * Make Real Estate Images Public Migration Script
 * 
 * Updates existing private real-estate images (apartment and property) to be public
 * so they can be viewed without authentication headers.
 */

import { corePrisma } from '../src/lib/corePrisma';
import { PrismaClient } from '@prisma/tenant-client';
import { getTenantDbUrl } from '../src/lib/services/tenantService';

async function updateRealEstateImagesForTenant(tenantDbUrl: string, tenantName: string) {
  console.log(`\n📦 Updating real-estate images for ${tenantName}...`);
  
  const tenantPrisma = new PrismaClient({
    datasources: {
      db: {
        url: tenantDbUrl,
      },
    },
  });

  try {
    // Find all real-estate images that are not public
    const privateImages = await tenantPrisma.coreFile.findMany({
      where: {
        module: 'real-estate',
        entityType: {
          in: ['apartment', 'property'],
        },
        mimeType: {
          startsWith: 'image/',
        },
      },
      select: {
        id: true,
        originalName: true,
        entityType: true,
        permissions: true,
      },
    });

    if (privateImages.length === 0) {
      console.log(`   ✅ No real-estate images found or all are already public`);
      await tenantPrisma.$disconnect();
      return;
    }

    console.log(`   📸 Found ${privateImages.length} real-estate image(s)`);

    let updatedCount = 0;
    for (const image of privateImages) {
      const permissions = image.permissions as unknown as { 
        isPublic?: boolean; 
        read?: string[]; 
        write?: string[]; 
        delete?: string[]; 
        share?: string[]; 
      };
      
      // Skip if already public
      if (permissions?.isPublic === true) {
        continue;
      }

      // Update permissions to make it public
      const updatedPermissions = {
        ...permissions,
        isPublic: true,
        read: permissions?.read || ['*'],
      };

      await tenantPrisma.coreFile.update({
        where: { id: image.id },
        data: {
          permissions: updatedPermissions as any,
        },
      });

      updatedCount++;
    }

    if (updatedCount > 0) {
      console.log(`   ✅ Updated ${updatedCount} image(s) to public`);
    } else {
      console.log(`   ✅ All images are already public`);
    }

    await tenantPrisma.$disconnect();
  } catch (error) {
    console.error(`   ❌ Error updating images for ${tenantName}:`, error);
    await tenantPrisma.$disconnect();
    throw error;
  }
}

async function main() {
  console.log('🖼️  Making real-estate images public...\n');

  try {
    // Core DB'den tüm active tenant'ları al
    const tenants = await corePrisma.tenant.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`📊 Found ${tenants.length} active tenant(s)\n`);

    if (tenants.length === 0) {
      console.log('❌ No active tenants found!');
      return;
    }

    // Her tenant için görselleri güncelle
    for (const tenant of tenants) {
      try {
        const dbUrl = getTenantDbUrl(tenant);
        await updateRealEstateImagesForTenant(dbUrl, tenant.name);
      } catch (error) {
        console.error(`❌ Failed to update images for tenant ${tenant.name}:`, error);
      }
    }

    console.log('\n✅ Migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await corePrisma.$disconnect();
  }
}

main();






