import { NextRequest, NextResponse } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { verifyAuth } from '@/lib/auth/jwt';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { errorResponse, successResponse } from '@/lib/api/errorHandler';
import type { EmailTemplateStyle, EmailTemplateType } from '@/lib/email/EmailService';
/**
 * POST /api/general-settings/test-email
 * Send a test email using SMTP settings
 */
export async function POST(request: NextRequest) {
    try {
        return await withTenant<ApiResponse<{ messageId?: string }>>(
            request,
            async (tenantPrisma): Promise<NextResponse<ApiResponse<{ messageId?: string }>>> => {
                try {
                const authResult = await verifyAuth(request);
                if (!authResult.valid || !authResult.payload) {
                    return errorResponse('UNAUTHORIZED', 'UNAUTHORIZED_MESSAGE', 401);
                }

                const tenantContext = await getTenantFromRequest(request);
                const tenantId = tenantContext?.id || authResult.payload?.tenantId;
                
                if (!tenantId) {
                    return errorResponse('TENANT_ID_REQUIRED', 'TENANT_ID_REQUIRED_MESSAGE', 400);
                }

                // Get companyId
                const searchParams = request.nextUrl.searchParams;
                let companyId = searchParams.get('companyId');

                // Parse request body
                let body: {
                    to?: string;
                    subject?: string;
                    message?: string;
                    companyId?: string;
                    useTemplate?: boolean;
                    templateStyle?: EmailTemplateStyle;
                    templateType?: EmailTemplateType;
                };
                try {
                    body = await request.json();
                } catch (error) {
                    return errorResponse(
                        'INVALID_REQUEST_BODY',
                        'INVALID_REQUEST_BODY_MESSAGE',
                        400
                    );
                }

                const { to, subject, message, useTemplate, templateStyle } = body;

                if (!to) {
                    return errorResponse('EMAIL_REQUIRED', 'EMAIL_REQUIRED_MESSAGE', 400);
                }

                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(to)) {
                    return errorResponse('INVALID_EMAIL', 'INVALID_EMAIL_MESSAGE', 400);
                }

                // If companyId not in query, try body, then first company
                if (!companyId) {
                    companyId = body.companyId || null;
                }

                if (!companyId) {
                    const firstCompany = await tenantPrisma.company.findFirst({
                        select: { id: true },
                        orderBy: { createdAt: 'asc' },
                    });
                    companyId = firstCompany?.id || null;
                }

                if (!companyId) {
                    return errorResponse('COMPANY_ID_REQUIRED', 'COMPANY_ID_REQUIRED_MESSAGE', 400);
                }

                // Get SMTP settings
                const settings = await tenantPrisma.generalSettings.findUnique({
                    where: {
                        tenantId_companyId: {
                            tenantId,
                            companyId,
                        }
                    },
                });

                if (!settings) {
                    return errorResponse('SETTINGS_NOT_FOUND', 'SETTINGS_NOT_FOUND_MESSAGE', 404);
                }

                if (!settings.smtpEnabled) {
                    return errorResponse('SMTP_NOT_ENABLED', 'SMTP_NOT_ENABLED_MESSAGE', 400);
                }

                if (!settings.smtpHost || !settings.smtpFromEmail) {
                    return errorResponse('SMTP_INCOMPLETE', 'SMTP_INCOMPLETE_MESSAGE', 400);
                }

                // Import nodemailer dynamically
                let nodemailerInstance: typeof import('nodemailer');
                try {
                    const nodemailerModule = await import('nodemailer');
                    // Handle both default and named exports
                    nodemailerInstance = nodemailerModule.default || nodemailerModule;
                    
                    if (!nodemailerInstance) {
                        return errorResponse(
                            'NODEMAILER_IMPORT_FAILED',
                            'NODEMAILER_IMPORT_FAILED_MESSAGE',
                            500
                        );
                    }
                } catch (error) {
                    return errorResponse(
                        'NODEMAILER_NOT_INSTALLED',
                        'NODEMAILER_NOT_INSTALLED_MESSAGE',
                        500
                    );
                }

                if (!nodemailerInstance.createTransport) {
                    return errorResponse(
                        'NODEMAILER_IMPORT_FAILED',
                        'NODEMAILER_IMPORT_FAILED_MESSAGE',
                        500
                    );
                }

                // Create transporter
                let transporter;
                try {
                    const isSSL = settings.smtpEncryption === 'SSL';
                    const isTLS = settings.smtpEncryption === 'TLS';
                    const port = settings.smtpPort || (isSSL ? 465 : 587);

                    const transportConfig: {
                        host: string;
                        port: number;
                        secure: boolean;
                        auth?: {
                            user: string;
                            pass: string;
                        };
                        tls?: {
                            rejectUnauthorized: boolean;
                            ciphers?: string;
                        };
                        requireTLS?: boolean;
                        connectionTimeout?: number;
                        greetingTimeout?: number;
                        socketTimeout?: number;
                    } = {
                        host: settings.smtpHost!,
                        port: port,
                        secure: isSSL,
                        connectionTimeout: settings.smtpTimeout || 30000,
                        greetingTimeout: settings.smtpTimeout || 30000,
                        socketTimeout: settings.smtpTimeout || 30000,
                    };

                    // Add authentication if provided
                    if (settings.smtpUsername && settings.smtpPassword) {
                        transportConfig.auth = {
                            user: settings.smtpUsername,
                            pass: settings.smtpPassword,
                        };
                    }

                    // Add TLS configuration
                    if (isTLS || isSSL) {
                        transportConfig.tls = {
                            rejectUnauthorized: false,
                        };
                        
                        // For TLS (STARTTLS), require TLS upgrade
                        if (isTLS) {
                            transportConfig.requireTLS = true;
                        }
                    }

                    transporter = nodemailerInstance.createTransport(transportConfig);
                } catch (error) {
                    return errorResponse(
                        'SMTP_TRANSPORTER_FAILED',
                        'SMTP_TRANSPORTER_FAILED_MESSAGE',
                        500,
                        error instanceof Error ? error.message : 'Invalid SMTP configuration'
                    );
                }

                // Get company info for template
                const company = await tenantPrisma.company.findUnique({
                    where: { id: companyId },
                    select: {
                        name: true,
                        address: true,
                        phone: true,
                        email: true,
                        website: true,
                        taxNumber: true,
                        logo: true,
                    }
                });

                // Prepare email content
                let emailSubject: string;
                let emailHtml: string;
                let emailText: string;

                if (useTemplate && templateStyle) {
                    // Use template style - create styled email
                    const styleColors: Record<string, { primary: string; accent: string }> = {
                        corporate: { primary: '#1a1a2e', accent: '#228be6' },
                        visionary: { primary: '#4c1d95', accent: '#8b5cf6' },
                        elegant: { primary: '#1f2937', accent: '#10b981' },
                        modern: { primary: '#0f172a', accent: '#f97316' },
                    };
                    const defaultColors = { primary: '#1a1a2e', accent: '#228be6' };
                    const colors = styleColors[templateStyle] || defaultColors;
                    const companyName = company?.name || settings.smtpFromName || 'Company';

                    emailSubject = subject || `${companyName} - Test Email`;
                    const emailMessage = message || 'This is a test email sent from your OMNEX platform.\n\nIf you received this email, your SMTP configuration is working correctly.';

                    emailHtml = `
                        <!DOCTYPE html>
                        <html>
                        <head><meta charset="utf-8"></head>
                        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                                <tr>
                                    <td align="center">
                                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                                            <tr>
                                                <td style="background-color: ${colors.primary}; padding: 30px; text-align: center;">
                                                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${companyName}</h1>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 40px;">
                                                    <h2 style="color: ${colors.accent}; margin-top: 0;">${emailSubject}</h2>
                                                    ${emailMessage.split('\n').map((line: string) => `<p style="margin: 0 0 10px 0;">${line || '&nbsp;'}</p>`).join('')}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #868e96;">
                                                    <p>Sent at: ${new Date().toLocaleString()}</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </body>
                        </html>
                    `;
                    emailText = `${emailSubject}\n\n${emailMessage}`;
                } else {
                    // Use simple email format
                    emailSubject = subject || 'OMNEX - Test Email';
                    const emailMessage = message || 'This is a test email sent from your OMNEX platform.\n\nIf you received this email, your SMTP configuration is working correctly.';

                    // Convert message to HTML (preserve line breaks)
                    const htmlMessage = emailMessage
                        .split('\n')
                        .map((line: string) => `<p>${line || '&nbsp;'}</p>`)
                        .join('');

                    emailHtml = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                                <h2 style="color: #228be6; margin-top: 0;">${emailSubject}</h2>
                                <div style="color: #212529; line-height: 1.6;">
                                    ${htmlMessage}
                                </div>
                            </div>
                            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;" />
                            <p style="color: #868e96; font-size: 12px; margin: 0;">
                                Sent at: ${new Date().toLocaleString()}<br/>
                                SMTP Host: ${settings.smtpHost}<br/>
                                SMTP Port: ${settings.smtpPort || 587}<br/>
                                Encryption: ${settings.smtpEncryption || 'TLS'}
                            </p>
                        </div>
                    `;
                    emailText = `${emailSubject}\n\n${emailMessage}\n\n---\nSent at: ${new Date().toLocaleString()}\nSMTP Host: ${settings.smtpHost}\nSMTP Port: ${settings.smtpPort || 587}\nEncryption: ${settings.smtpEncryption || 'TLS'}`;
                }

                // Send test email
                const mailOptions = {
                    from: settings.smtpFromName
                        ? `${settings.smtpFromName} <${settings.smtpFromEmail}>`
                        : settings.smtpFromEmail,
                    to: to,
                    subject: emailSubject,
                    html: emailHtml,
                    text: emailText,
                };

                // Verify connection before sending (with timeout)
                try {
                    const verifyPromise = transporter.verify();
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('SMTP connection timeout')), settings.smtpTimeout || 30000)
                    );
                    await Promise.race([verifyPromise, timeoutPromise]);
                } catch (error) {
                    const verifyErrorObj = error as any;
                    
                    // Check for authentication errors specifically
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    const errorCode = verifyErrorObj?.code || '';
                    const errorResponseCode = verifyErrorObj?.responseCode || '';
                    const errorResponseText = verifyErrorObj?.response || '';
                    
                    const isAuthError = errorCode === 'EAUTH' ||
                                       errorMessage.includes('EAUTH') || 
                                       errorMessage.includes('authentication') || 
                                       errorMessage.includes('535') ||
                                       errorMessage.includes('Incorrect authentication') ||
                                       errorResponseCode === 535 ||
                                       errorResponseText.includes('535') ||
                                       errorResponseText.includes('Incorrect authentication');
                    
                    // Build detailed error message
                    let detailedError = errorMessage;
                    if (errorResponseText) {
                        detailedError += `\nServer Response: ${errorResponseText}`;
                    }
                    if (errorCode) {
                        detailedError += `\nError Code: ${errorCode}`;
                    }
                    if (errorResponseCode) {
                        detailedError += `\nResponse Code: ${errorResponseCode}`;
                    }
                    
                    if (isAuthError) {
                        // Use 400 instead of 401 to avoid triggering logout
                        return errorResponse(
                            'SMTP_AUTH_FAILED',
                            'SMTP_AUTH_FAILED_MESSAGE',
                            400,
                            detailedError
                        );
                    }
                    
                    return errorResponse(
                        'SMTP_CONNECTION_FAILED',
                        'SMTP_CONNECTION_FAILED_MESSAGE',
                        500,
                        detailedError
                    );
                }

                // Send test email
                let info: { messageId?: string };
                try {
                    info = await transporter.sendMail(mailOptions);
                } catch (error) {
                    const sendErrorObj = error as any;
                    
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    const errorCode = sendErrorObj?.code || '';
                    const errorResponseCode = sendErrorObj?.responseCode || '';
                    const errorResponseText = sendErrorObj?.response || '';
                    
                    const isAuthError = errorCode === 'EAUTH' ||
                                       errorMessage.includes('EAUTH') || 
                                       errorMessage.includes('authentication') || 
                                       errorMessage.includes('535') ||
                                       errorMessage.includes('Incorrect authentication') ||
                                       errorResponseCode === 535 ||
                                       errorResponseText.includes('535') ||
                                       errorResponseText.includes('Incorrect authentication');
                    
                    // Build detailed error message
                    let detailedError = errorMessage;
                    if (errorResponseText) {
                        detailedError += `\nServer Response: ${errorResponseText}`;
                    }
                    if (errorCode) {
                        detailedError += `\nError Code: ${errorCode}`;
                    }
                    if (errorResponseCode) {
                        detailedError += `\nResponse Code: ${errorResponseCode}`;
                    }
                    
                    if (isAuthError) {
                        // Use 400 instead of 401 to avoid triggering logout
                        return errorResponse(
                            'SMTP_AUTH_FAILED',
                            'SMTP_AUTH_FAILED_MESSAGE',
                            400,
                            detailedError
                        );
                    }
                    
                    return errorResponse(
                        'SMTP_SEND_FAILED',
                        'SMTP_SEND_FAILED_MESSAGE',
                        500,
                        detailedError
                    );
                }

                const responseData: { messageId?: string } = {};
                if (info.messageId) {
                    responseData.messageId = info.messageId;
                }
                
                return successResponse(
                    responseData,
                    'Test email sent successfully'
                );
            } catch (error) {
                return errorResponse(
                    'TEST_EMAIL_ERROR',
                    'TEST_EMAIL_ERROR_MESSAGE',
                    500,
                    error instanceof Error ? error.message : 'Failed to send test email'
                );
                }
            },
            { required: true }
        );
    } catch (error) {
        // Catch errors from withTenant wrapper
        return errorResponse(
            'REQUEST_FAILED',
            'REQUEST_FAILED_MESSAGE',
            500,
            error instanceof Error ? error.message : 'An unexpected error occurred'
        );
    }
}

