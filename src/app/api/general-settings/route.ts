import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { verifyAuth } from '@/lib/auth/jwt';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { errorResponse, successResponse } from '@/lib/api/errorHandler';
/**
 * GET /api/general-settings
 * Get general settings for the current tenant
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
                    return errorResponse('Company ID required', 'Company ID is required. No company found for tenant.', 400);
                }

                // Fetch general settings
                const settings = await tenantPrisma.generalSettings.findUnique({
                    where: { 
                        tenantId_companyId: {
                            tenantId,
                            companyId,
                        }
                    },
                });

                if (!settings) {
                    // Return default settings if not found
                    return successResponse({
                        timezone: 'Europe/Istanbul',
                        dateFormat: 'DD/MM/YYYY',
                        timeFormat: '24',
                        weekStart: 'monday',
                        currency: 'TRY',
                        defaultLanguage: 'tr',
                        smtpEnabled: false,
                        smtpPort: 587,
                        smtpEncryption: 'TLS',
                        smtpTimeout: 30000,
                        smtpRetryAttempts: 3,
                        smtpConnectionPool: 5,
                        calendarIntegrations: {},
                        calendarDefaultView: 'month',
                        calendarShowWeekends: true,
                        calendarShowHolidays: true,
                        sessionTimeout: 30,
                        maxConcurrentSessions: 5,
                        rememberMeDuration: 30,
                        passwordMinLength: 8,
                        passwordRequireUppercase: true,
                        passwordRequireLowercase: true,
                        passwordRequireNumbers: true,
                        passwordRequireSpecial: false,
                        twoFactorEnabled: false,
                        twoFactorRequiredForAdmins: false,
                        maxLoginAttempts: 5,
                        lockoutDuration: 15,
                        apiRateLimit: 100,
                    });
                }

                return successResponse(settings);
            } catch (error) {
                console.error('Error fetching general settings:', error);
                return errorResponse(
                    'Failed to fetch general settings',
                    error instanceof Error ? error.message : 'Failed to fetch general settings',
                    500
                );
            }
        },
        { required: true }
    );
}

/**
 * PUT /api/general-settings
 * Update general settings
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
                    return errorResponse('Company ID required', 'Company ID is required. No company found for tenant.', 400);
                }

                // Extract settings from body
                const {
                    timezone,
                    dateFormat,
                    timeFormat,
                    weekStart,
                    currency,
                    defaultLanguage,
                    smtpHost,
                    smtpPort,
                    smtpEncryption,
                    smtpUsername,
                    smtpPassword,
                    smtpFromName,
                    smtpFromEmail,
                    smtpTimeout,
                    smtpRetryAttempts,
                    smtpConnectionPool,
                    smtpEnabled,
                    calendarIntegrations,
                    calendarDefaultView,
                    calendarShowWeekends,
                    calendarShowHolidays,
                    sessionTimeout,
                    maxConcurrentSessions,
                    rememberMeDuration,
                    passwordMinLength,
                    passwordRequireUppercase,
                    passwordRequireLowercase,
                    passwordRequireNumbers,
                    passwordRequireSpecial,
                    passwordExpirationDays,
                    twoFactorEnabled,
                    twoFactorRequiredForAdmins,
                    twoFactorBackupCodes,
                    maxLoginAttempts,
                    lockoutDuration,
                    ipWhitelist,
                    apiRateLimit,
                    apiKeyExpiration,
                } = body;

                // Check if settings exist
                if (!tenantId || !companyId) {
                    return errorResponse('Tenant ID and Company ID are required', 'Tenant ID and Company ID are required', 400);
                }
                
                const existing = await tenantPrisma.generalSettings.findUnique({
                    where: {
                        tenantId_companyId: {
                            tenantId,
                            companyId,
                        }
                    },
                });

                let settings;

                if (existing) {
                    // Update existing settings
                    settings = await tenantPrisma.generalSettings.update({
                        where: {
                            tenantId_companyId: {
                                tenantId,
                                companyId,
                            }
                        },
                        data: {
                            timezone: (timezone ?? existing.timezone) || 'Europe/Istanbul',
                            dateFormat: (dateFormat ?? existing.dateFormat) || 'DD/MM/YYYY',
                            timeFormat: timeFormat ?? existing.timeFormat,
                            weekStart: weekStart ?? existing.weekStart,
                            currency: currency ?? existing.currency,
                            defaultLanguage: defaultLanguage ?? existing.defaultLanguage,
                            smtpHost: smtpHost ?? existing.smtpHost,
                            smtpPort: smtpPort ?? existing.smtpPort,
                            smtpEncryption: smtpEncryption ?? existing.smtpEncryption,
                            smtpUsername: smtpUsername ?? existing.smtpUsername,
                            smtpPassword: smtpPassword || existing.smtpPassword, // Only update if provided
                            smtpFromName: smtpFromName ?? existing.smtpFromName,
                            smtpFromEmail,
                            smtpTimeout: smtpTimeout ?? existing.smtpTimeout,
                            smtpRetryAttempts: smtpRetryAttempts ?? existing.smtpRetryAttempts,
                            smtpConnectionPool: smtpConnectionPool ?? existing.smtpConnectionPool,
                            smtpEnabled: smtpEnabled !== undefined ? smtpEnabled : existing.smtpEnabled,
                            calendarIntegrations: calendarIntegrations ?? existing.calendarIntegrations,
                            calendarDefaultView: calendarDefaultView ?? existing.calendarDefaultView,
                            calendarShowWeekends: calendarShowWeekends ?? existing.calendarShowWeekends,
                            calendarShowHolidays: calendarShowHolidays ?? existing.calendarShowHolidays,
                            sessionTimeout: sessionTimeout ?? existing.sessionTimeout,
                            maxConcurrentSessions: maxConcurrentSessions ?? existing.maxConcurrentSessions,
                            rememberMeDuration: rememberMeDuration ?? existing.rememberMeDuration,
                            passwordMinLength: passwordMinLength ?? existing.passwordMinLength,
                            passwordRequireUppercase: passwordRequireUppercase ?? existing.passwordRequireUppercase,
                            passwordRequireLowercase: passwordRequireLowercase ?? existing.passwordRequireLowercase,
                            passwordRequireNumbers: passwordRequireNumbers ?? existing.passwordRequireNumbers,
                            passwordRequireSpecial: passwordRequireSpecial ?? existing.passwordRequireSpecial,
                            passwordExpirationDays: passwordExpirationDays ?? existing.passwordExpirationDays,
                            twoFactorEnabled: twoFactorEnabled ?? existing.twoFactorEnabled,
                            twoFactorRequiredForAdmins: twoFactorRequiredForAdmins ?? existing.twoFactorRequiredForAdmins,
                            twoFactorBackupCodes: twoFactorBackupCodes ?? existing.twoFactorBackupCodes,
                            maxLoginAttempts: maxLoginAttempts ?? existing.maxLoginAttempts,
                            lockoutDuration: lockoutDuration ?? existing.lockoutDuration,
                            ipWhitelist: ipWhitelist ?? existing.ipWhitelist,
                            apiRateLimit: apiRateLimit ?? existing.apiRateLimit,
                            apiKeyExpiration: apiKeyExpiration ?? existing.apiKeyExpiration,
                        },
                    });
                } else {
                    // Create new settings
                    if (!tenantId || !companyId) {
                        return errorResponse('Tenant ID and Company ID are required', 'Tenant ID and Company ID are required', 400);
                    }
                    
                    settings = await tenantPrisma.generalSettings.create({
                        data: {
                            tenantId,
                            companyId,
                            timezone: timezone ?? 'Europe/Istanbul',
                            dateFormat: dateFormat ?? 'DD/MM/YYYY',
                            timeFormat: timeFormat ?? '24',
                            weekStart: weekStart || 'monday',
                            currency: currency || 'TRY',
                            defaultLanguage: defaultLanguage || 'tr',
                            smtpHost: smtpHost || '',
                            smtpPort: smtpPort || 587,
                            smtpEncryption: smtpEncryption || 'TLS',
                            smtpUsername: smtpUsername || '',
                            smtpPassword: smtpPassword || '',
                            smtpFromName: smtpFromName || '',
                            smtpFromEmail: smtpFromEmail || '',
                            smtpTimeout: smtpTimeout || 30000,
                            smtpRetryAttempts: smtpRetryAttempts || 3,
                            smtpConnectionPool: smtpConnectionPool || 5,
                            smtpEnabled: smtpEnabled || false,
                            calendarIntegrations: calendarIntegrations || {},
                            calendarDefaultView: calendarDefaultView || 'month',
                            calendarShowWeekends: calendarShowWeekends ?? true,
                            calendarShowHolidays: calendarShowHolidays ?? true,
                            sessionTimeout: sessionTimeout || 30,
                            maxConcurrentSessions: maxConcurrentSessions || 5,
                            rememberMeDuration: rememberMeDuration || 30,
                            passwordMinLength: passwordMinLength || 8,
                            passwordRequireUppercase: passwordRequireUppercase ?? true,
                            passwordRequireLowercase: passwordRequireLowercase ?? true,
                            passwordRequireNumbers: passwordRequireNumbers ?? true,
                            passwordRequireSpecial: passwordRequireSpecial ?? false,
                            passwordExpirationDays,
                            twoFactorEnabled: twoFactorEnabled ?? false,
                            twoFactorRequiredForAdmins: twoFactorRequiredForAdmins ?? false,
                            twoFactorBackupCodes,
                            maxLoginAttempts: maxLoginAttempts || 5,
                            lockoutDuration: lockoutDuration || 15,
                            ipWhitelist: ipWhitelist || [],
                            apiRateLimit: apiRateLimit || 100,
                            apiKeyExpiration,
                        },
                    });
                }

                return successResponse(settings, 'General settings updated successfully');
            } catch (error) {
                console.error('Error updating general settings:', error);
                return errorResponse(
                    'Failed to update general settings',
                    error instanceof Error ? error.message : 'Failed to update general settings',
                    500
                );
            }
        },
        { required: true }
    );
}









