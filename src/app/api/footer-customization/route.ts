import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { verifyAuth } from '@/lib/auth/jwt';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { errorResponse, successResponse } from '@/lib/api/errorHandler';
/**
 * GET /api/footer-customization
 * Get footer customization settings for the current tenant
 */
export async function GET(request: NextRequest) {
    return withTenant<ApiResponse<any>>(
        request,
        async (tenantPrisma): Promise<NextResponse<ApiResponse<any>>> => {
            try {
                const authResult = await verifyAuth(request);
                if (!authResult.valid || !authResult.payload) {
                    return errorResponse('Unauthorized', 'Unauthorized', 401);
                }

                const tenantContext = await getTenantFromRequest(request);
                if (!tenantContext) {
                    return errorResponse('Tenant context not found', 'Tenant context not found', 400);
                }

                const tenantId = tenantContext.id;

                // Fetch footer customization
                const footer = await tenantPrisma.footerCustomization.findUnique({
                    where: { tenantId },
                });

                if (!footer) {
                    // Get company name from company table for default settings
                    const company = await tenantPrisma.company.findFirst({
                        select: { name: true },
                        orderBy: { createdAt: 'asc' },
                    });
                    // Return default settings if not found
                    return successResponse({
                        companyName: company?.name || tenantContext.name || '',
                        companyNameMode: 'dynamic',
                        logo: '',
                        description: '',
                        address: '',
                        phone: '',
                        email: '',
                        socialLinks: { facebook: '', twitter: '', linkedin: '', instagram: '' },
                        showCopyright: true,
                        copyrightText: '',
                        primaryMenuId: '',
                        isActive: true,
                    });
                }

                // If companyNameMode is dynamic, get company name from company table
                const footerData = { ...footer };
                if (footerData.companyNameMode === 'dynamic') {
                    // Try to get company name from company table first
                    const company = await tenantPrisma.company.findFirst({
                        select: { name: true },
                        orderBy: { createdAt: 'asc' },
                    });
                    footerData.companyName = company?.name || tenantContext.name || '';
                }

                // Convert old format (object) to new format (string) if needed
                const convertToString = (value: any): string => {
                    if (typeof value === 'string') return value;
                    if (value && typeof value === 'object') {
                        // For backward compatibility, get current locale or fallback to tr
                        // Since we don't have locale in API, return empty string or first value
                        return Object.values(value)[0] as string || '';
                    }
                    return '';
                };

                // Ensure all required fields are present
                const responseData = {
                    companyName: footerData.companyName || tenantContext.name || '',
                    companyNameMode: footerData.companyNameMode || 'dynamic',
                    logo: footerData.logo || '',
                    description: convertToString(footerData.description),
                    address: convertToString(footerData.address),
                    phone: footerData.phone || '',
                    email: footerData.email || '',
                    socialLinks: footerData.socialLinks || { facebook: '', twitter: '', linkedin: '', instagram: '' },
                    showCopyright: footerData.showCopyright !== undefined ? footerData.showCopyright : true,
                    copyrightText: convertToString(footerData.copyrightText),
                    primaryMenuId: footerData.primaryMenuId || '',
                    isActive: footerData.isActive !== undefined ? footerData.isActive : true,
                };

                return successResponse(responseData);
            } catch (error) {
                console.error('Error fetching footer customization:', error);
                return errorResponse(
                    'Failed to fetch footer customization',
                    error instanceof Error ? error.message : 'Failed to fetch footer customization',
                    500
                );
            }
        },
        { required: true }
    );
}

/**
 * PUT /api/footer-customization
 * Update footer customization settings
 */
export async function PUT(request: NextRequest) {
    return withTenant<ApiResponse<any>>(
        request,
        async (tenantPrisma): Promise<NextResponse<ApiResponse<any>>> => {
            try {
                const authResult = await verifyAuth(request);
                if (!authResult.valid || !authResult.payload) {
                    return errorResponse('Unauthorized', 'Unauthorized', 401);
                }

                const tenantContext = await getTenantFromRequest(request);
                const tenantId = tenantContext?.id || authResult.payload.tenantId;
                
                // Get companyId - try from query params first, then from body, then first company
                const searchParams = request.nextUrl.searchParams;
                let companyId = searchParams.get('companyId');
                
                // Read body once
                const body = await request.json();
                
                // If companyId not in query, try body
                if (!companyId) {
                    companyId = body.companyId || null;
                }
                
                // If still no companyId, get first company
                if (!companyId) {
                    const firstCompany = await tenantPrisma.company.findFirst({
                        select: { id: true },
                        orderBy: { createdAt: 'asc' },
                    });
                    companyId = firstCompany?.id || null;
                }
                
                if (!companyId) {
                    return errorResponse('Company ID is required', 'Company ID is required. No company found for tenant.', 400);
                }
                
                const {
                    companyName,
                    companyNameMode,
                    logo,
                    description,
                    address,
                    phone,
                    email,
                    socialLinks,
                    showCopyright,
                    copyrightText,
                    primaryMenuId,
                    isActive,
                } = body;

                // Check if footer customization exists
                if (!tenantId) {
                    return errorResponse('Tenant ID is required', 'Tenant ID is required', 400);
                }
                const existing = await tenantPrisma.footerCustomization.findUnique({
                    where: { tenantId },
                });

                let footer;

                if (existing) {
                    // Update existing
                    footer = await tenantPrisma.footerCustomization.update({
                        where: { tenantId },
                        data: {
                            ...(companyName !== undefined && { companyName }),
                            ...(companyNameMode !== undefined && { companyNameMode }),
                            ...(logo !== undefined && { logo }),
                            ...(description !== undefined && { description }),
                            ...(address !== undefined && { address }),
                            ...(phone !== undefined && { phone }),
                            ...(email !== undefined && { email }),
                            ...(socialLinks !== undefined && { socialLinks }),
                            ...(showCopyright !== undefined && { showCopyright }),
                            ...(copyrightText !== undefined && { copyrightText }),
                            ...(primaryMenuId !== undefined && { primaryMenuId }),
                            ...(isActive !== undefined && { isActive }),
                        },
                    });
                } else {
                    // Create new - companyId is required
                    footer = await tenantPrisma.footerCustomization.create({
                        data: {
                            tenantId,
                            companyId,
                            companyName,
                            companyNameMode: companyNameMode || 'dynamic',
                            logo,
                            description,
                            address,
                            phone,
                            email,
                            socialLinks,
                            showCopyright: showCopyright !== undefined ? showCopyright : true,
                            copyrightText,
                            primaryMenuId,
                            isActive: isActive !== undefined ? isActive : true,
                        },
                    });
                }

                return successResponse(footer, 'Footer customization updated successfully');
            } catch (error) {
                console.error('Error updating footer customization:', error);
                return errorResponse(
                    'Failed to update footer customization',
                    error instanceof Error ? error.message : 'Failed to update footer customization',
                    500
                );
            }
        },
        { required: true }
    );
}
