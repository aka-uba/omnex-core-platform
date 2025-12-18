import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { requireAuth } from '@/lib/middleware/authMiddleware';
import { Prisma } from '@prisma/tenant-client';
import type { EmailWizardData } from '@/modules/real-estate/components/email/EmailWizard';

// Email sending service (placeholder - will be implemented with nodemailer or similar)
async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  textContent?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // TODO: Implement actual email sending with nodemailer or SendGrid
  // For now, just return success
  return { success: true, messageId: `mock-${Date.now()}` };
}

// Replace template variables
function replaceVariables(content: string, variables: Record<string, any>): string {
  let result = content;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, String(value || `{{${key}}}`));
  });
  return result;
}

export async function POST(request: NextRequest) {
  // Check authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextRequest || !authResult) {
    return errorResponse('Unauthorized', 'Authentication required', 401);
  }

  return withTenant<ApiResponse<{ campaign: unknown; sent?: number; failed?: number; message?: string }>>(
    request,
    async (tenantPrisma) => {
      try {
        const body = (await request.json()) as EmailWizardData;
        const { recipients, templateId, apartmentId, customSubject, customContent, variables, sendNow, scheduledAt } = body;

        if (!recipients || recipients.length === 0) {
          return errorResponse('No recipients specified', 'At least one recipient is required', 400);
        }

        if (!templateId) {
          return errorResponse('No template specified', 'Template ID is required', 400);
        }

        // Get tenant context
        const tenantContext = await getTenantFromRequest(request);
        if (!tenantContext) {
          return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
        }

        // Note: companyId should be tenantContext.id (core tenant context ID)
        const companyId = tenantContext.id;

        // Get template
        const template = await tenantPrisma.emailTemplate.findUnique({
          where: { id: templateId },
        });

        if (!template) {
          return errorResponse('Template not found', 'Email template not found', 404);
        }

        // Prepare email content
        const subject = replaceVariables(customSubject || template.subject, variables || {});
        const htmlContent = replaceVariables(customContent || template.htmlContent, variables || {});
        const textContent = template.textContent
          ? replaceVariables(template.textContent, variables || {})
          : undefined;

        // Create email campaign
        const campaign = await tenantPrisma.emailCampaign.create({
          data: {
            tenantId: tenantContext.id,
            companyId,
            templateId,
            apartmentId: apartmentId || null,
            name: `Campaign - ${subject}`,
            recipients: recipients as any,
            recipientCount: recipients.length,
            customContent: customSubject || customContent || variables
              ? {
                  subject: customSubject,
                  htmlContent: customContent,
                  variables,
                }
              : Prisma.JsonNull,
            scheduledAt: sendNow ? null : (scheduledAt ? new Date(scheduledAt) : null),
            sentAt: sendNow ? new Date() : null,
            status: sendNow ? 'sending' : scheduledAt ? 'scheduled' : 'draft',
            sentCount: 0,
            openedCount: 0,
            clickedCount: 0,
            conversionCount: 0,
          },
        });

        // Send emails if sendNow is true
        if (sendNow) {
          const sendResults = await Promise.allSettled(
            recipients.map((recipient) =>
              sendEmail(recipient.email, subject, htmlContent, textContent)
            )
          );

          const successCount = sendResults.filter((r) => r.status === 'fulfilled' && r.value.success).length;
          const failedCount = recipients.length - successCount;

          // Update campaign
          await tenantPrisma.emailCampaign.update({
            where: { id: campaign.id },
            data: {
              status: failedCount === 0 ? 'sent' : failedCount === recipients.length ? 'failed' : 'sent',
              sentCount: successCount,
              sentAt: new Date(),
            },
          });

          return successResponse({
            campaign,
            sent: successCount,
            failed: failedCount,
          });
        }

        return successResponse({
          campaign,
          message: 'Email campaign scheduled',
        });
      } catch (error) {
        console.error('Error sending email:', error);
        return errorResponse(
          'Failed to send email',
          error instanceof Error ? error.message : 'Unknown error',
          500
        );
      }
    }
  );
}
