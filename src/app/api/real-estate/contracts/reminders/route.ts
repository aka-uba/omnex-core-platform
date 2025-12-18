import { NextRequest, NextResponse } from 'next/server';
import { getTenantPrismaFromRequest } from '@/lib/api/tenantContext';
import dayjs from 'dayjs';

/**
 * GET /api/real-estate/contracts/reminders
 * Get contracts that need renewal reminders
 */
export async function GET(request: NextRequest) {
  try {
    const tenantPrisma = await getTenantPrismaFromRequest(request);
    if (!tenantPrisma) {
      return NextResponse.json(
        { success: false, error: 'Tenant context required' },
        { status: 400 }
      );
    }
    const { searchParams } = new URL(request.url);
    const daysAhead = parseInt(searchParams.get('daysAhead') || '30', 10) || 30;

    const today = dayjs().startOf('day');

    // Get all active contracts
    const activeContracts = await tenantPrisma.contract.findMany({
      where: {
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

    // Filter contracts that need reminders
    const contractsNeedingReminders = activeContracts
      .filter((contract) => {
        if (!contract.endDate) return false;
        const endDate = dayjs(contract.endDate);
        const renewalNoticeDays = contract.renewalNoticeDays || 30;
        const reminderDate = endDate.subtract(renewalNoticeDays, 'day');
        const daysUntilReminder = reminderDate.diff(today, 'day');
        
        // Contracts that need reminder (within daysAhead window)
        return daysUntilReminder >= 0 && daysUntilReminder <= daysAhead;
      })
      .map((contract) => {
        const endDate = dayjs(contract.endDate);
        const renewalNoticeDays = contract.renewalNoticeDays || 30;
        const reminderDate = endDate.subtract(renewalNoticeDays, 'day');
        const daysUntilReminder = reminderDate.diff(today, 'day');
        const daysUntilExpiry = endDate.diff(today, 'day');

        return {
          ...contract,
          daysUntilReminder,
          daysUntilExpiry,
          reminderDate: reminderDate.toISOString(),
        };
      })
      .sort((a, b) => a.daysUntilReminder - b.daysUntilReminder);

    return NextResponse.json({
      success: true,
      contracts: contractsNeedingReminders,
      count: contractsNeedingReminders.length,
    });
  } catch (error: any) {
    console.error('Error fetching contracts needing reminders:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/real-estate/contracts/reminders
 * Send renewal reminder notifications for contracts
 */
export async function POST(request: NextRequest) {
  try {
    const tenantPrisma = await getTenantPrismaFromRequest(request);
    if (!tenantPrisma) {
      return NextResponse.json(
        { success: false, error: 'Tenant context required' },
        { status: 400 }
      );
    }
    
    const { getTenantFromRequest } = await import('@/lib/api/tenantContext');
    const { requireCompanyId } = await import('@/lib/api/companyContext');
    const tenantContext = await getTenantFromRequest(request);
    
    if (!tenantContext) {
      return NextResponse.json(
        { success: false, error: 'Tenant context required' },
        { status: 400 }
      );
    }
    
    const companyId = await requireCompanyId(request, tenantPrisma);

    const body = await request.json();
    const { contractIds } = body; // Optional: specific contract IDs, or send for all eligible

    const today = dayjs().startOf('day');

    // Find contracts that need reminders
    // Build where clause with tenant and company isolation (defense-in-depth)
    const whereClause: any = {
        tenantId: tenantContext.id,
      status: 'active',
    };

    if (contractIds && Array.isArray(contractIds) && contractIds.length > 0) {
      whereClause.id = { in: contractIds };
    }

    const activeContracts = await tenantPrisma.contract.findMany({
      where: whereClause,
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

    let notificationsSent = 0;
    let notificationsFailed = 0;

    for (const contract of activeContracts) {
      if (!contract.endDate) continue;

      const endDate = dayjs(contract.endDate);
      const renewalNoticeDays = contract.renewalNoticeDays || 30;
      const reminderDate = endDate.subtract(renewalNoticeDays, 'day');
      const daysUntilReminder = reminderDate.diff(today, 'day');

      // Check if reminder should be sent (within 1 day window)
      if (daysUntilReminder >= 0 && daysUntilReminder <= 1) {
        // Check if notification already sent today
        // Note: Notification model doesn't have tenantId, we check by module and data
        const existingNotification = await tenantPrisma.notification.findFirst({
          where: {
            module: 'real-estate',
            type: 'alert',
            createdAt: {
              gte: today.toDate(),
            },
            data: {
              path: ['contractId'],
              equals: contract.id,
            },
          },
        });

        if (!existingNotification) {
          try {
            await tenantPrisma.notification.create({
              data: {
                tenantId: tenantContext.id,
                companyId: companyId,
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
            notificationsSent++;
          } catch (innerError: any) {
            notificationsFailed++;
            console.error(`Error creating notification for contract ${contract.id}:`, innerError);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      notificationsSent,
      notificationsFailed,
      total: notificationsSent + notificationsFailed,
    });
  } catch (error: any) {
    console.error('Error sending contract reminders:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

