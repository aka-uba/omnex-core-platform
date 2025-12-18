/**
 * Auto-renew contracts script
 * 
 * This script checks for contracts that need renewal and automatically renews them.
 * Should be run daily via cron job or scheduled task.
 * 
 * Usage:
 *   npm run contracts:auto-renew
 * 
 * Or via cron:
 *   0 0 * * * cd /path/to/project && npm run contracts:auto-renew
 */

import { corePrisma } from '../src/lib/corePrisma';
import { getTenantPrisma } from '../src/lib/dbSwitcher';
import { getTenantDatabaseUrl } from '../src/config/tenant.config';

async function autoRenewContracts() {
  console.log('Starting auto-renewal process...');
  
  try {
    // Get all active tenants
    const tenants = await corePrisma.tenant.findMany({
      where: { status: 'active' },
    });

    let totalRenewed = 0;
    let totalFailed = 0;

    for (const tenant of tenants) {
      try {
        const dbUrl = getTenantDatabaseUrl(tenant.currentDb);
        const tenantPrisma = getTenantPrisma(dbUrl);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find contracts that need auto-renewal
        const contractsToRenew = await tenantPrisma.contract.findMany({
          where: {
            tenantId: tenant.id,
            status: 'active',
            autoRenewal: true,
            endDate: {
              lte: today,
            },
          },
          include: {
            apartment: true,
            tenantRecord: true,
          },
        });

        console.log(`Tenant ${tenant.slug}: Found ${contractsToRenew.length} contracts to renew`);

        for (const contract of contractsToRenew) {
          try {
            if (!contract.endDate) {
              console.warn(`Contract ${contract.id} has no end date, skipping`);
              totalFailed++;
              continue;
            }

            // Calculate new dates
            const currentEndDate = new Date(contract.endDate);
            const contractDuration = currentEndDate.getTime() - new Date(contract.startDate).getTime();
            const newStartDate = new Date(currentEndDate);
            newStartDate.setDate(newStartDate.getDate() + 1);
            const newEndDate = new Date(newStartDate);
            newEndDate.setTime(newStartDate.getTime() + contractDuration);

            // Calculate new rent amount with increase rate
            let newRentAmount = Number(contract.rentAmount);
            if (contract.increaseRate && Number(contract.increaseRate) > 0) {
              const increase = Number(contract.increaseRate);
              newRentAmount = newRentAmount * (1 + increase);
            }

            // Create new contract
            const renewedContract = await tenantPrisma.contract.create({
              data: {
                tenantId: tenant.id,
                companyId: contract.companyId,
                apartmentId: contract.apartmentId,
                tenantRecordId: contract.tenantRecordId,
                templateId: contract.templateId || null,
                contractNumber: `${contract.contractNumber}-RENEWED-${new Date().getFullYear()}-${Date.now()}`,
                type: contract.type,
                startDate: newStartDate,
                endDate: newEndDate,
                renewalDate: null,
                rentAmount: newRentAmount,
                deposit: contract.deposit,
                currency: contract.currency,
                paymentType: contract.paymentType || null,
                paymentDay: contract.paymentDay || null,
                autoRenewal: contract.autoRenewal,
                renewalNoticeDays: contract.renewalNoticeDays || 30,
                increaseRate: contract.increaseRate || null,
                status: 'active',
                documents: contract.documents || [],
                terms: contract.terms || null,
                notes: contract.notes || null,
              },
            });

            // Update old contract status
            await tenantPrisma.contract.update({
              where: { id: contract.id },
              data: { status: 'expired' },
            });

            console.log(`Contract ${contract.id} renewed successfully. New contract: ${renewedContract.id}`);
            totalRenewed++;
          } catch (error) {
            console.error(`Failed to renew contract ${contract.id}:`, error);
            totalFailed++;
          }
        }
      } catch (error) {
        console.error(`Error processing tenant ${tenant.slug}:`, error);
      }
    }

    console.log(`Auto-renewal completed. Renewed: ${totalRenewed}, Failed: ${totalFailed}`);
    process.exit(0);
  } catch (error) {
    console.error('Fatal error in auto-renewal process:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  autoRenewContracts();
}

export { autoRenewContracts };

