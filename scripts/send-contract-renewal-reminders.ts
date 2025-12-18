/**
 * Send Contract Renewal Reminders Script
 * 
 * This script checks for contracts that are approaching their renewal date
 * and sends notification reminders based on renewalNoticeDays setting.
 * Should be run daily via cron job or scheduled task.
 * 
 * Usage:
 *   npm run contracts:send-reminders
 * 
 * Or via cron:
 *   0 9 * * * cd /path/to/project && npm run contracts:send-reminders
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

async function sendContractRenewalReminders() {
  console.log('Starting contract renewal reminder process...');

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

        // Find active contracts
        const activeContracts = await tenantPrisma.contract.findMany({
          where: {
            tenantId: tenant.id,
            status: 'active',
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
            tenantRecord: {
              select: {
                id: true,
                tenantNumber: true,
              },
            },
          },
        });

        for (const contract of activeContracts) {
          if (!contract.endDate) continue;

          const endDate = dayjs(contract.endDate);
          const renewalNoticeDays = contract.renewalNoticeDays || 30;
          const reminderDate = endDate.subtract(renewalNoticeDays, 'day');

          // Check if today is the reminder date (or within 1 day after)
          const daysUntilReminder = reminderDate.diff(today, 'day');
          
          if (daysUntilReminder >= 0 && daysUntilReminder <= 1) {
            // Check if notification already sent (by checking notification data)
            // Check if notification already sent (by checking notification data)
            // Note: Notification model doesn't have tenantId, we check by module and data
            const existingNotification = await tenantPrisma.notification.findFirst({
              where: {
                module: 'real-estate',
                type: 'alert',
                createdAt: {
                  gte: today.subtract(2, 'day').toDate(),
                },
                data: {
                  path: ['contractId'],
                  equals: contract.id,
                },
              },
            });

            if (!existingNotification) {
              try {
                // Create notification
                await tenantPrisma.notification.create({
                  data: {
                    title: `Sözleşme Yenileme Hatırlatması - ${contract.contractNumber}`,
                    message: `Sözleşme ${contract.contractNumber} ${endDate.format('DD.MM.YYYY')} tarihinde sona erecek. ${renewalNoticeDays} gün önceden hatırlatma.`,
                    type: 'alert',
                    priority: daysUntilReminder === 0 ? 'high' : 'medium',
                    isGlobal: false,
                    module: 'real-estate',
                    data: {
                      contractId: contract.id,
                      contractNumber: contract.contractNumber,
                      endDate: contract.endDate.toISOString(),
                      apartmentId: contract.apartmentId,
                      tenantRecordId: contract.tenantRecordId,
                      type: 'contract_renewal_reminder',
                    },
                    actionUrl: `/modules/real-estate/contracts/${contract.id}`,
                    actionText: 'Sözleşmeyi Görüntüle',
                  },
                });

                totalNotificationsSent++;
                console.log(`  Sent reminder for contract: ${contract.contractNumber}`);
              } catch (innerError: any) {
                totalFailed++;
                console.error(`  Error sending reminder for contract ${contract.id}:`, innerError);
              }
            }
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
  sendContractRenewalReminders();
}

export { sendContractRenewalReminders };

