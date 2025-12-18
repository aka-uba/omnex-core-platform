/**
 * Send Overdue Payment Reminders Script
 * 
 * This script checks for overdue payments and sends notification reminders.
 * Should be run daily via cron job or scheduled task.
 * 
 * Usage:
 *   npm run payments:send-overdue-reminders
 * 
 * Or via cron:
 *   0 9 * * * cd /path/to/project && npm run payments:send-overdue-reminders
 */

import 'dotenv/config';
import { PrismaClient as CorePrismaClient } from '@prisma/core-client';
import { PrismaClient as TenantPrismaClient } from '@prisma/tenant-client';
import dayjs from 'dayjs';
import { getTenantConfig } from '../src/config/tenant.config';

// Initialize Prisma clients
const corePrisma = new CorePrismaClient({
  datasources: {
    db: {
      url: process.env.CORE_DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
});

// Cache for tenant Prisma clients
const tenantClientsCache = new Map<string, TenantPrismaClient>();

function getTenantPrisma(dbUrl: string): TenantPrismaClient {
  if (tenantClientsCache.has(dbUrl)) {
    return tenantClientsCache.get(dbUrl)!;
  }
  const client = new TenantPrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
  });
  tenantClientsCache.set(dbUrl, client);
  return client;
}

async function sendOverduePaymentReminders() {
  console.log('Starting overdue payment reminder process...');

  try {
    const config = getTenantConfig();
    // Get all active tenants
    const tenants = await corePrisma.tenant.findMany({
      where: { status: 'active' },
    });

    let totalNotificationsSent = 0;
    let totalFailed = 0;

    for (const tenant of tenants) {
      console.log(`Processing tenant: ${tenant.slug} (ID: ${tenant.id})`);
      try {
        const dbUrl = config.tenantDbTemplateUrl.replace('__DB_NAME__', tenant.currentDb) ||
          `postgresql://${process.env.PG_USER || 'postgres'}@${process.env.PG_HOST || 'localhost'}:${process.env.PG_PORT || '5432'}/${tenant.currentDb}?schema=public`;
        const tenantPrisma = getTenantPrisma(dbUrl);
        const today = dayjs().startOf('day');

        // Find overdue payments (status is pending/overdue and dueDate is before today)
        const overduePayments = await tenantPrisma.payment.findMany({
          where: {
            tenantId: tenant.id,
            status: { in: ['pending', 'overdue'] },
            dueDate: {
              lt: today.toDate(),
            },
            reminderSent: false, // Only send reminder once
          },
          include: {
            apartment: {
              select: {
                id: true,
                unitNumber: true,
                property: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            contract: {
              select: {
                id: true,
                contractNumber: true,
              },
            },
          },
        });

        // Update status to overdue for pending payments
        for (const payment of overduePayments) {
          if (payment.status === 'pending') {
            await tenantPrisma.payment.update({
              where: { id: payment.id },
              data: { status: 'overdue' },
            });
          }
        }

        for (const payment of overduePayments) {
          try {
            const daysOverdue = today.diff(dayjs(payment.dueDate), 'day');

            // Check if notification already sent today
            const existingNotification = await tenantPrisma.notification.findFirst({
              where: {
                module: 'real-estate',
                type: 'alert',
                createdAt: {
                  gte: today.toDate(),
                },
                data: {
                  path: ['paymentId'],
                  equals: payment.id,
                },
              },
            });

            if (!existingNotification) {
              // Create notification
              await tenantPrisma.notification.create({
                data: {
                  title: `Geciken Ödeme - ${payment.apartment?.unitNumber || 'N/A'}`,
                  message: `${payment.apartment?.unitNumber || 'N/A'} dairesi için ${daysOverdue} gün gecikmiş ödeme. Tutar: ${Number(payment.totalAmount).toLocaleString('tr-TR', { style: 'currency', currency: payment.currency || 'TRY' })}`,
                  type: 'alert',
                  priority: daysOverdue > 30 ? 'urgent' : daysOverdue > 7 ? 'high' : 'medium',
                  isGlobal: false,
                  module: 'real-estate',
                  data: {
                    paymentId: payment.id,
                    apartmentId: payment.apartmentId,
                    contractId: payment.contractId,
                    amount: Number(payment.totalAmount),
                    currency: payment.currency,
                    dueDate: payment.dueDate.toISOString(),
                    daysOverdue: daysOverdue,
                    type: 'overdue_payment_reminder',
                  },
                  actionUrl: `/modules/real-estate/payments/${payment.id}`,
                  actionText: 'Ödemeyi Görüntüle',
                },
              });

              // Mark reminder as sent
              await tenantPrisma.payment.update({
                where: { id: payment.id },
                data: { reminderSent: true },
              });

              totalNotificationsSent++;
              console.log(`  Sent reminder for payment: ${payment.id} (${daysOverdue} days overdue)`);
            }
          } catch (innerError: any) {
            totalFailed++;
            console.error(`  Error sending reminder for payment ${payment.id}:`, innerError);
          }
        }
      } catch (tenantError: any) {
        totalFailed++;
        console.error(`Error processing tenant ${tenant.slug}:`, tenantError);
      }
    }

    console.log(`Reminder process completed. Total sent: ${totalNotificationsSent}, Total failed: ${totalFailed}`);
  } catch (error: any) {
    console.error('Fatal error in reminder process:', error);
  } finally {
    await corePrisma.$disconnect();
    for (const client of tenantClientsCache.values()) {
      await client.$disconnect();
    }
  }
}

// Run if called directly
if (require.main === module) {
  sendOverduePaymentReminders();
}

export { sendOverduePaymentReminders };








