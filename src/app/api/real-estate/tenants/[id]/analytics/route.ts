import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { requireTenant } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';
import { Decimal } from '@prisma/client/runtime/library';
import dayjs from 'dayjs';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Calculate payment score based on payment history
 * Score: 0-100
 * - On-time payments: +10 points per payment
 * - Late payments: -5 points per day late
 * - Overdue payments: -20 points per payment
 */
async function calculatePaymentScore(
  tenantPrisma: any,
  tenantId: string,
  tenantRecordId: string,
  companyId: string
): Promise<number> {
  // Get contracts for this tenant
  const contracts = await tenantPrisma.contract.findMany({
    where: {
      tenantId: tenantId,
      tenantRecordId: tenantRecordId,
      companyId: companyId,
    },
    select: { id: true },
  });
  const contractIds = contracts.map((c: any) => c.id);

  const payments = await tenantPrisma.payment.findMany({
    where: {
      tenantId: tenantId,
      contractId: { in: contractIds },
    },
    orderBy: { dueDate: 'desc' },
    take: 12, // Last 12 payments
  });

  if (payments.length === 0) {
    return 100; // Default score if no payments
  }

  let score = 100;
  const today = dayjs();

  for (const payment of payments) {
    if (payment.status === 'paid' && payment.paidDate) {
      const paidDate = dayjs(payment.paidDate);
      const dueDate = dayjs(payment.dueDate);
      const daysLate = paidDate.diff(dueDate, 'day');

      if (daysLate <= 0) {
        score += 10; // On-time payment
      } else if (daysLate <= 7) {
        score -= daysLate * 2; // 1-7 days late
      } else if (daysLate <= 30) {
        score -= 14 + (daysLate - 7) * 3; // 8-30 days late
      } else {
        score -= 100; // More than 30 days late
      }
    } else if (payment.status === 'overdue') {
      const daysOverdue = today.diff(dayjs(payment.dueDate), 'day');
      score -= 20 + daysOverdue * 2; // Overdue penalty
    } else if (payment.status === 'pending') {
      const daysUntilDue = dayjs(payment.dueDate).diff(today, 'day');
      if (daysUntilDue < 0) {
        score -= 10; // Pending but past due
      }
    }
  }

  // Normalize score to 0-100 range
  return Math.max(0, Math.min(100, score / payments.length));
}

/**
 * Calculate contact score based on appointment attendance and communication
 * Score: 0-100
 * - Attended appointments: +5 points
 * - No-show appointments: -10 points
 * - Cancelled appointments (with notice): -2 points
 */
async function calculateContactScore(
  tenantPrisma: any,
  tenantId: string,
  tenantRecordId: string,
  companyId: string
): Promise<number> {
  // Get contracts for this tenant to find apartments
  const contracts = await tenantPrisma.contract.findMany({
    where: {
      tenantId: tenantId,
      tenantRecordId: tenantRecordId,
      companyId: companyId,
    },
    select: { apartmentId: true },
  });
  const apartmentIds = contracts.map((c: any) => c.apartmentId).filter((id: string | null) => id !== null);

  // Appointments are linked via apartmentId, not contractId
  const appointments = await tenantPrisma.appointment.findMany({
    where: {
      tenantId: tenantId,
      companyId: companyId,
      ...(apartmentIds.length > 0 && { apartmentId: { in: apartmentIds } }),
    },
    orderBy: { startDate: 'desc' },
    take: 20, // Last 20 appointments
  });

  if (appointments.length === 0) {
    return 100; // Default score if no appointments
  }

  let score = 100;

  for (const appointment of appointments) {
    if (appointment.status === 'completed') {
      score += 5; // Attended appointment
    } else if (appointment.status === 'no_show') {
      score -= 10; // No-show penalty
    } else if (appointment.status === 'cancelled') {
      score -= 2; // Cancelled with notice
    }
  }

  // Normalize score to 0-100 range
  return Math.max(0, Math.min(100, score / appointments.length));
}

/**
 * Calculate maintenance score based on maintenance records
 * Score: 0-100
 * - No maintenance issues: +5 points per month
 * - Minor issues: -2 points per issue
 * - Major issues: -10 points per issue
 * - Damage reports: -20 points per report
 */
async function calculateMaintenanceScore(
  tenantPrisma: any,
  tenantId: string,
  tenantRecordId: string,
  companyId: string
): Promise<number> {
  // Get contracts for this tenant
  const contracts = await tenantPrisma.contract.findMany({
    where: {
      tenantId: tenantId,
      tenantRecordId: tenantRecordId,
      companyId: companyId,
    },
    select: {
      id: true,
      apartmentId: true,
      startDate: true,
      endDate: true,
    },
  });

  if (contracts.length === 0) {
    return 100; // Default score if no contracts
  }

  // Get maintenance records for apartments in contracts
  const apartmentIds = contracts.map((c: any) => c.apartmentId);
  const maintenanceRecords = await tenantPrisma.realEstateMaintenanceRecord.findMany({
    where: {
      tenantId: tenantId,
      apartmentId: { in: apartmentIds },
    },
    orderBy: { createdAt: 'desc' },
  });

  let score = 100;
  const today = dayjs();

  // Calculate months of tenancy
  let totalMonths = 0;
  for (const contract of contracts) {
    const startDate = dayjs(contract.startDate);
    const endDate = contract.endDate ? dayjs(contract.endDate) : today;
    totalMonths += endDate.diff(startDate, 'month', true);
  }

  if (totalMonths > 0) {
    // Base score: 5 points per month without issues
    score = Math.min(100, totalMonths * 5);

    // Deduct points for issues
    for (const record of maintenanceRecords) {
      const severity = (record as any).severity || 'minor';
      if (severity === 'minor') {
        score -= 2;
      } else if (severity === 'major') {
        score -= 10;
      } else if (severity === 'critical' || (record as any).type === 'damage') {
        score -= 20;
      }
    }
  }

  // Normalize score to 0-100 range
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate overall score (weighted average)
 * - Payment Score: 50%
 * - Contact Score: 30%
 * - Maintenance Score: 20%
 */
function calculateOverallScore(
  paymentScore: number,
  contactScore: number,
  maintenanceScore: number
): number {
  return Math.round(
    paymentScore * 0.5 + contactScore * 0.3 + maintenanceScore * 0.2
  );
}

// GET /api/real-estate/tenants/[id]/analytics - Get tenant analytics and calculate scores
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withTenant<ApiResponse<{
    analytics: {
      paymentScore: number;
      contactScore: number;
      maintenanceScore: number;
      overallScore: number;
      paymentHistory: {
        total: number;
        paid: number;
        pending: number;
        overdue: number;
        onTimeRate: number;
      };
      contractHistory: {
        total: number;
        active: number;
        expired: number;
        terminated: number;
      };
      appointmentHistory: {
        total: number;
        completed: number;
        noShow: number;
        cancelled: number;
      };
      maintenanceHistory: {
        total: number;
        minor: number;
        major: number;
        critical: number;
      };
    };
  }>>(
    request,
    async (tenantPrisma) => {
      const { id } = await params;

      // Get tenant context (withTenant already ensures tenant context exists)
      const tenantContext = await requireTenant(request);

      // Get companyId (required for contract queries)
      const companyId = await getCompanyIdFromRequest(request, tenantPrisma);
      if (!companyId) {
        return errorResponse('Company required', 'No company found for tenant', 400);
      }

      // Get tenant - support both UUID and tenantNumber
      // Try UUID first, then tenantNumber
      let tenant = await tenantPrisma.tenant.findFirst({
        where: {
          OR: [
            { id },
            { tenantNumber: id },
          ],
        },
        select: {
          id: true,
          tenantId: true,
          companyId: true,
        },
      });

      if (!tenant) {
        return errorResponse('Not found', 'Tenant not found', 404);
      }

      // Use tenant's companyId if available, otherwise use from request
      const finalCompanyId = tenant.companyId || companyId;

      // Note: tenantId validation removed - per-tenant database architecture already provides isolation
      // Use tenantContext.id for queries instead of tenant.tenantId

      // Calculate scores
      const paymentScore = await calculatePaymentScore(
        tenantPrisma,
        tenantContext.id,
        tenant.id,
        finalCompanyId
      );
      const contactScore = await calculateContactScore(
        tenantPrisma,
        tenantContext.id,
        tenant.id,
        finalCompanyId
      );
      const maintenanceScore = await calculateMaintenanceScore(
        tenantPrisma,
        tenantContext.id,
        tenant.id,
        finalCompanyId
      );
      const overallScore = calculateOverallScore(
        paymentScore,
        contactScore,
        maintenanceScore
      );

      // Get contracts for this tenant to find payments, appointments, and maintenance
      const contracts = await tenantPrisma.contract.findMany({
        where: {
          tenantId: tenantContext.id,
          tenantRecordId: tenant.id,
          companyId: finalCompanyId,
        },
        select: { id: true, apartmentId: true },
      });
      const contractIds = contracts.map((c: any) => c.id);
      const apartmentIds = contracts.map((c: any) => c.apartmentId);

      // Get payment history
      const payments = await tenantPrisma.payment.findMany({
        where: {
          tenantId: tenantContext.id,
          contractId: { in: contractIds },
        },
      });
      const paidPayments = payments.filter((p: any) => p.status === 'paid');
      const onTimePayments = paidPayments.filter((p: any) => {
        if (!p.paidDate || !p.dueDate) return false;
        const paid = dayjs(p.paidDate);
        const due = dayjs(p.dueDate);
        return paid.isBefore(due, 'day') || paid.isSame(due, 'day');
      });
      const onTimeRate = payments.length > 0 ? (onTimePayments.length / payments.length) * 100 : 100;

      // Get appointment history (appointments are linked via apartmentId)
      const appointments = await tenantPrisma.appointment.findMany({
        where: {
          tenantId: tenantContext.id,
          companyId: finalCompanyId,
          ...(apartmentIds.length > 0 && { apartmentId: { in: apartmentIds } }),
        },
      });

      // Get maintenance history (use apartmentIds from contracts)
      const maintenanceRecords = await tenantPrisma.realEstateMaintenanceRecord.findMany({
        where: {
          tenantId: tenantContext.id,
          apartmentId: { in: apartmentIds },
        },
      });

      // Update tenant scores in database
      await tenantPrisma.tenant.update({
        where: { id },
        data: {
          paymentScore: new Decimal(paymentScore),
          contactScore: new Decimal(contactScore),
          maintenanceScore: new Decimal(maintenanceScore),
          overallScore: new Decimal(overallScore),
        },
      });

      return successResponse({
        analytics: {
          paymentScore,
          contactScore,
          maintenanceScore,
          overallScore,
          paymentHistory: {
            total: payments.length,
            paid: paidPayments.length,
            pending: payments.filter((p: any) => p.status === 'pending').length,
            overdue: payments.filter((p: any) => p.status === 'overdue').length,
            onTimeRate: Math.round(onTimeRate * 100) / 100,
          },
          contractHistory: {
            total: contracts.length,
            active: contracts.filter((c: any) => c.status === 'active').length,
            expired: contracts.filter((c: any) => c.status === 'expired').length,
            terminated: contracts.filter((c: any) => c.status === 'terminated').length,
          },
          appointmentHistory: {
            total: appointments.length,
            completed: appointments.filter((a: any) => a.status === 'completed').length,
            noShow: appointments.filter((a: any) => a.status === 'no_show').length,
            cancelled: appointments.filter((a: any) => a.status === 'cancelled').length,
          },
          maintenanceHistory: {
            total: maintenanceRecords.length,
            minor: maintenanceRecords.filter((r: any) => (r as any).severity === 'minor').length,
            major: maintenanceRecords.filter((r: any) => (r as any).severity === 'major').length,
            critical: maintenanceRecords.filter((r: any) => (r as any).severity === 'critical').length,
          },
        },
      });
    },
    { required: true, module: 'real-estate' }
  );
}

// POST /api/real-estate/tenants/[id]/analytics - Recalculate and update scores
export async function POST(request: NextRequest, { params }: RouteParams) {
  // Same logic as GET, but explicitly recalculates
  return GET(request, { params });
}

