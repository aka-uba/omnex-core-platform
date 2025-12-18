/**
 * Tenant Service Helpers
 * Helper functions for tenant creation workflow
 */

import path from 'path';
import fs from 'fs/promises';
import { Prisma } from '@prisma/tenant-client';
import { logger } from '@/lib/utils/logger';

/**
 * Create tenant directory structure
 * Creates all necessary directories for modules and user uploads
 */
export async function createTenantDirectoryStructure(tenantSlug: string): Promise<void> {
    const basePath = path.join(process.cwd(), 'storage', 'tenants', tenantSlug);

    // Company assets
    await fs.mkdir(path.join(basePath, 'company-assets'), { recursive: true });

    // Module files
    const modules = [
        'accounting',
        'ai',
        'assets',
        'backups',
        'calendar',
        'documents',
        'education',
        'file-manager',
        'hr',
        'license',
        'locations',
        'maintenance',
        'notifications',
        'production',
        'raporlar',
        'real-estate',
        'sohbet',
        'temp',
        'web-builder',
    ];

    for (const module of modules) {
        await fs.mkdir(path.join(basePath, 'module-files', module), { recursive: true });
    }

    // User uploads
    await fs.mkdir(path.join(basePath, 'user-uploads'), { recursive: true });

    logger.info(`Created directory structure for tenant: ${tenantSlug}`, {}, 'tenant-service');
}

/**
 * Upload company asset (logo or favicon)
 * Returns the relative path to the uploaded file
 */
export async function uploadCompanyAsset(
    tenantSlug: string,
    file: File | string,
    type: 'logo' | 'favicon'
): Promise<string> {
    const basePath = path.join(process.cwd(), 'storage', 'tenants', tenantSlug, 'company-assets');

    // If file is already a string (path), return it
    if (typeof file === 'string') {
        return file;
    }

    // Generate filename
    const ext = file.name.split('.').pop();
    const filename = `${type}.${ext}`;
    const filePath = path.join(basePath, filename);

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    // Return relative path
    const relativePath = `/storage/tenants/${tenantSlug}/company-assets/${filename}`;

    logger.info(`Uploaded ${type} for tenant: ${tenantSlug}`, { path: relativePath }, 'tenant-service');

    return relativePath;
}

/**
 * Create default export template
 * Returns the template ID
 */
export async function createDefaultExportTemplate(
    tenantDbUrl: string,
    tenantSlug: string,
    companyInfo: {
        logoUrl?: string;
        faviconUrl?: string;
        name: string;
        address?: string;
        phone?: string;
        email?: string;
        website?: string;
        taxNumber?: string;
    }
): Promise<string> {
    // We need to use tenant-specific Prisma client
    const { PrismaClient: TenantPrismaClient } = await import('@prisma/tenant-client');
    const tenantPrisma = new TenantPrismaClient({
        datasources: {
            db: {
                url: tenantDbUrl,
            },
        },
    });

    try {
        const template = await tenantPrisma.exportTemplate.create({
            data: {
                tenantId: tenantSlug,
                companyId: null, // Global template
                locationId: null,
                name: 'Default Company Template',
                type: 'full',
                logoUrl: companyInfo.logoUrl || null,
                title: companyInfo.name,
                subtitle: null,
                address: companyInfo.address || null,
                phone: companyInfo.phone || null,
                email: companyInfo.email || null,
                website: companyInfo.website || null,
                taxNumber: companyInfo.taxNumber || null,
                customFields: Prisma.JsonNull,
                layout: Prisma.JsonNull,
                styles: Prisma.JsonNull,
                isDefault: true,
                isActive: true,
            },
        });

        logger.info(`Created default export template for tenant: ${tenantSlug}`, { templateId: template.id }, 'tenant-service');

        return template.id;
    } finally {
        await tenantPrisma.$disconnect();
    }
}

/**
 * Create initial location
 * Returns the location ID
 */
export async function createInitialLocation(
    tenantDbUrl: string,
    tenantSlug: string,
    locationData: {
        name: string;
        code?: string;
        type: string;
        address?: string;
        city?: string;
        country?: string;
        postalCode?: string;
        phone?: string;
        email?: string;
        latitude?: number;
        longitude?: number;
        description?: string;
    }
): Promise<string> {
    // We need to use tenant-specific Prisma client
    const { PrismaClient: TenantPrismaClient } = await import('@prisma/tenant-client');
    const tenantPrisma = new TenantPrismaClient({
        datasources: {
            db: {
                url: tenantDbUrl,
            },
        },
    });

    try {
        // Get the first company ID (created by seed)
        const company = await tenantPrisma.company.findFirst();

        if (!company) {
            throw new Error('No company found in tenant database');
        }

        const location = await tenantPrisma.location.create({
            data: {
                tenantId: tenantSlug,
                companyId: company.id,
                parentId: null, // Root location
                name: locationData.name,
                type: locationData.type,
                code: locationData.code || null,
                description: locationData.description || null,
                address: locationData.address || null,
                city: locationData.city || null,
                country: locationData.country || null,
                postalCode: locationData.postalCode || null,
                latitude: locationData.latitude !== undefined && locationData.latitude !== null 
                    ? new Prisma.Decimal(locationData.latitude.toString()) 
                    : null,
                longitude: locationData.longitude !== undefined && locationData.longitude !== null 
                    ? new Prisma.Decimal(locationData.longitude.toString()) 
                    : null,
                metadata: (locationData.phone || locationData.email) ? {
                    phone: locationData.phone || '',
                    email: locationData.email || '',
                } : Prisma.JsonNull,
                isActive: true,
            },
        });

        logger.info(`Created initial location for tenant: ${tenantSlug}`, { locationId: location.id }, 'tenant-service');

        return location.id;
    } finally {
        await tenantPrisma.$disconnect();
    }
}
