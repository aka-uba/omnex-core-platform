import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { verifyAuth } from '@/lib/auth/jwt';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import type { ApiResponse } from '@/lib/api/errorHandler';

/**
 * GET /api/notification-settings
 * Get notification settings for the current tenant/user
 */
export async function GET(request: NextRequest) {
    return withTenant<ApiResponse<any>>(
        request,
        async (tenantPrisma) => {
            try {
                const authResult = await verifyAuth(request);
                if (!authResult.valid || !authResult.payload) {
                    return NextResponse.json(
                        { success: false, error: 'Unauthorized', message: 'Authentication failed' },
                        { status: 401 }
                    );
                }

                const tenantContext = await getTenantFromRequest(request);
                if (!tenantContext) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: 'Tenant context not found',
                            message: 'Tenant context could not be determined',
                        },
                        { status: 400 }
                    );
                }

                const tenantId = tenantContext.id;
                const userId = authResult.payload.userId || null;

                // Get companyId from query params or use first company
                const searchParams = request.nextUrl.searchParams;
                let companyId = searchParams.get('companyId');

                if (!companyId) {
                    const firstCompany = await tenantPrisma.company.findFirst({
                        select: { id: true },
                        orderBy: { createdAt: 'asc' },
                    });
                    companyId = firstCompany?.id || null;
                }

                if (!companyId) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: 'Company ID is required',
                            message: 'No company found for tenant. Please create a company first.',
                        },
                        { status: 400 }
                    );
                }

                // Try to find user-specific settings first, then company-level, then tenant-level
                let settings = null;
                if (userId) {
                    settings = await tenantPrisma.notificationSettings.findUnique({
                        where: {
                            tenantId_companyId_userId: {
                                tenantId,
                                companyId,
                                userId,
                            }
                        },
                    });
                }

                if (!settings) {
                    // Try company-level (userId = null)
                    // Prisma'da nullable unique constraint'ler için findFirst kullanmalıyız
                    settings = await tenantPrisma.notificationSettings.findFirst({
                        where: {
                            tenantId,
                            companyId,
                            userId: null,
                        },
                    });
                }

                if (!settings) {
                    // Return default settings if not found
                    return NextResponse.json({
                        success: true,
                        data: {
                            emailEnabled: true,
                            emailSystemNotifications: true,
                            emailUserNotifications: true,
                            emailModuleNotifications: {},
                            pushEnabled: true,
                            pushBrowserEnabled: true,
                            pushMobileEnabled: false,
                            pushSystemNotifications: true,
                            pushUserNotifications: true,
                            pushModuleNotifications: {},
                            smsEnabled: false,
                            smsProvider: null,
                            smsSystemNotifications: false,
                            smsUserNotifications: false,
                            smsModuleNotifications: {},
                            reminderTime: 15,
                            quietHoursStart: null,
                            quietHoursEnd: null,
                            notificationSound: true,
                            notificationSoundFile: null,
                            moduleSettings: {},
                        },
                    });
                }

                return NextResponse.json({
                    success: true,
                    data: settings,
                });
            } catch (error) {
                console.error('Error fetching notification settings:', error);
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Internal server error',
                        message: error instanceof Error ? error.message : 'Failed to fetch notification settings',
                    },
                    { status: 500 }
                );
            }
        },
        { required: true }
    );
}

/**
 * PUT /api/notification-settings
 * Update notification settings
 */
export async function PUT(request: NextRequest) {
    return withTenant<ApiResponse<any>>(
        request,
        async (tenantPrisma) => {
            try {
                const authResult = await verifyAuth(request);
                if (!authResult.valid || !authResult.payload) {
                    return NextResponse.json(
                        { success: false, error: 'Unauthorized', message: 'Authentication failed' },
                        { status: 401 }
                    );
                }

                const tenantContext = await getTenantFromRequest(request);
                if (!tenantContext) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: 'Tenant context not found',
                            message: 'Tenant context could not be determined',
                        },
                        { status: 400 }
                    );
                }

                const tenantId = tenantContext.id;
                const userId = authResult.payload.userId || null;
                
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
                    return NextResponse.json(
                        {
                            success: false,
                            error: 'Company ID is required',
                            message: 'No company found for tenant. Please create a company first.',
                        },
                        { status: 400 }
                    );
                }

                // Extract settings from body
                const {
                    emailEnabled,
                    emailSystemNotifications,
                    emailUserNotifications,
                    emailModuleNotifications,
                    pushEnabled,
                    pushBrowserEnabled,
                    pushMobileEnabled,
                    pushSystemNotifications,
                    pushUserNotifications,
                    pushModuleNotifications,
                    smsEnabled,
                    smsProvider,
                    smsApiKey,
                    smsApiSecret,
                    smsFromNumber,
                    smsSystemNotifications,
                    smsUserNotifications,
                    smsModuleNotifications,
                    reminderTime,
                    quietHoursStart,
                    quietHoursEnd,
                    notificationSound,
                    notificationSoundFile,
                    moduleSettings,
                } = body;

                // Check if settings exist
                // Prisma'da nullable unique constraint'ler için userId null ise findFirst kullanmalıyız
                let existing;
                if (userId) {
                    existing = await tenantPrisma.notificationSettings.findUnique({
                        where: {
                            tenantId_companyId_userId: {
                                tenantId,
                                companyId,
                                userId,
                            }
                        },
                    });
                } else {
                    existing = await tenantPrisma.notificationSettings.findFirst({
                        where: {
                            tenantId,
                            companyId,
                            userId: null,
                        },
                    });
                }

                let settings;

                if (existing) {
                    // Update existing settings
                    // Prisma'da nullable unique constraint'ler için userId null ise id ile update yapmalıyız
                    const updateData = {
                        emailEnabled: emailEnabled ?? existing.emailEnabled,
                        emailSystemNotifications: emailSystemNotifications ?? existing.emailSystemNotifications,
                        emailUserNotifications: emailUserNotifications ?? existing.emailUserNotifications,
                        emailModuleNotifications: emailModuleNotifications ?? existing.emailModuleNotifications,
                        pushEnabled: pushEnabled ?? existing.pushEnabled,
                        pushBrowserEnabled: pushBrowserEnabled ?? existing.pushBrowserEnabled,
                        pushMobileEnabled: pushMobileEnabled ?? existing.pushMobileEnabled,
                        pushSystemNotifications: pushSystemNotifications ?? existing.pushSystemNotifications,
                        pushUserNotifications: pushUserNotifications ?? existing.pushUserNotifications,
                        pushModuleNotifications: pushModuleNotifications ?? existing.pushModuleNotifications,
                        smsEnabled: smsEnabled ?? existing.smsEnabled,
                        smsProvider: smsProvider ?? existing.smsProvider,
                        smsApiKey: smsApiKey || existing.smsApiKey, // Only update if provided
                        smsApiSecret: smsApiSecret || existing.smsApiSecret, // Only update if provided
                        smsFromNumber: smsFromNumber ?? existing.smsFromNumber,
                        smsSystemNotifications: smsSystemNotifications ?? existing.smsSystemNotifications,
                        smsUserNotifications: smsUserNotifications ?? existing.smsUserNotifications,
                        smsModuleNotifications: smsModuleNotifications ?? existing.smsModuleNotifications,
                        reminderTime: reminderTime ?? existing.reminderTime,
                        quietHoursStart: quietHoursStart ?? existing.quietHoursStart,
                        quietHoursEnd: quietHoursEnd ?? existing.quietHoursEnd,
                        notificationSound: notificationSound ?? existing.notificationSound,
                        notificationSoundFile: notificationSoundFile ?? existing.notificationSoundFile,
                        moduleSettings: moduleSettings ?? existing.moduleSettings,
                    };

                    if (userId) {
                        settings = await tenantPrisma.notificationSettings.update({
                            where: {
                                tenantId_companyId_userId: {
                                    tenantId,
                                    companyId,
                                    userId,
                                }
                            },
                            data: updateData,
                        });
                    } else {
                        // userId null ise id ile update yapmalıyız
                        settings = await tenantPrisma.notificationSettings.update({
                            where: {
                                id: existing.id,
                            },
                            data: updateData,
                        });
                    }
                } else {
                    // Create new settings
                    settings = await tenantPrisma.notificationSettings.create({
                        data: {
                            tenantId,
                            companyId,
                            userId: userId || null,
                            emailEnabled: emailEnabled ?? true,
                            emailSystemNotifications: emailSystemNotifications ?? true,
                            emailUserNotifications: emailUserNotifications ?? true,
                            emailModuleNotifications: emailModuleNotifications || {},
                            pushEnabled: pushEnabled ?? true,
                            pushBrowserEnabled: pushBrowserEnabled ?? true,
                            pushMobileEnabled: pushMobileEnabled ?? false,
                            pushSystemNotifications: pushSystemNotifications ?? true,
                            pushUserNotifications: pushUserNotifications ?? true,
                            pushModuleNotifications: pushModuleNotifications || {},
                            smsEnabled: smsEnabled ?? false,
                            smsProvider: smsProvider || null,
                            smsApiKey: smsApiKey || null,
                            smsApiSecret: smsApiSecret || null,
                            smsFromNumber: smsFromNumber || null,
                            smsSystemNotifications: smsSystemNotifications ?? false,
                            smsUserNotifications: smsUserNotifications ?? false,
                            smsModuleNotifications: smsModuleNotifications || {},
                            reminderTime: reminderTime || 15,
                            quietHoursStart: quietHoursStart || null,
                            quietHoursEnd: quietHoursEnd || null,
                            notificationSound: notificationSound ?? true,
                            notificationSoundFile: notificationSoundFile || null,
                            moduleSettings: moduleSettings || {},
                        },
                    });
                }

                return NextResponse.json({
                    success: true,
                    message: 'Notification settings updated successfully',
                    data: settings,
                });
            } catch (error) {
                console.error('Error updating notification settings:', error);
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Internal server error',
                        message: error instanceof Error ? error.message : 'Failed to update notification settings',
                    },
                    { status: 500 }
                );
            }
        },
        { required: true }
    );
}





