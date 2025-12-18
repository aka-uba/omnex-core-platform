import { z } from 'zod';

// Tenant creation schema
export const tenantSchema = z.object({
    name: z.string().min(1, 'Tenant name is required'),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
    subdomain: z.string().optional(),
    customDomain: z.string().url().optional().or(z.literal('')),
    agencyId: z.string().optional(),
    year: z.number().optional(),
});

// Company info schema (Step 2)
export const companyInfoSchema = z.object({
    name: z.string().min(1, 'Company name is required'),
    logo: z.any().optional(), // File upload
    favicon: z.any().optional(), // File upload
    industry: z.string().optional(),
    description: z.string().optional(),
    foundedYear: z.number().int().min(1800).max(2100).optional().or(z.literal('')),
    employeeCount: z.number().int().min(0).optional().or(z.literal('')),
    capital: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    website: z.string().url().optional().or(z.literal('')),
    taxNumber: z.string().optional(),
    taxOffice: z.string().optional(),
    registrationNumber: z.string().optional(),
    mersisNumber: z.string().optional(),
    iban: z.string().optional(),
    bankName: z.string().optional(),
    accountHolder: z.string().optional(),
});

// Location schema (Step 3 - Optional)
export const initialLocationSchema = z.object({
    name: z.string().min(1, 'Location name is required'),
    code: z.string().optional(),
    type: z.enum(['headquarters', 'branch', 'warehouse', 'office', 'factory', 'store', 'other']),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    description: z.string().optional(),
});

// Combined wizard schema
export const tenantWizardSchema = z.object({
    // Step 1: Basic Info
    basicInfo: tenantSchema,

    // Step 2: Company Info
    companyInfo: companyInfoSchema,

    // Step 3: Initial Location (optional)
    initialLocation: initialLocationSchema.optional(),
});

export type TenantFormData = z.infer<typeof tenantSchema>;
export type CompanyInfoFormData = z.infer<typeof companyInfoSchema>;
export type InitialLocationFormData = z.infer<typeof initialLocationSchema>;
export type TenantWizardFormData = z.infer<typeof tenantWizardSchema>;
