import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
import dayjs from 'dayjs';

export interface MonthPaymentInfo {
  status: 'paid' | 'pending' | 'overdue' | 'partial' | 'none';
  amount: number;
  paidAmount: number;
  dueDate: string | null;
  paidDate: string | null;
  paymentMethod: string | null;
  paymentId: string | null;
  contractId: string | null;
}

export interface MonthlyTrackerRow {
  id: string;
  propertyId: string;
  propertyName: string;
  apartmentId: string;
  unitNumber: string;
  floor: string;
  tenantId: string | null;
  tenantName: string;
  tenantType: 'individual' | 'company' | null;
  contractId: string | null;
  contractNumber: string | null;
  monthlyRent: number;
  months: Record<number, MonthPaymentInfo>;
}

export interface MonthlyTrackerSummary {
  totalPayments: number;
  paidPayments: number;
  pendingPayments: number;
  overduePayments: number;
  partialPayments: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  collectionRate: number;
}

export interface MonthlyTrackerResponse {
  rows: MonthlyTrackerRow[];
  summary: MonthlyTrackerSummary;
  year: number;
  properties: { id: string; name: string }[];
}

// GET /api/real-estate/payments/monthly-tracker
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<MonthlyTrackerResponse>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;

      const year = parseInt(searchParams.get('year') || String(dayjs().year()), 10);
      const propertyId = searchParams.get('propertyId') || undefined;
      const companyId = searchParams.get('companyId') || undefined;

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get companyId from query or use first company
      let finalCompanyId = companyId;
      if (!finalCompanyId) {
        const firstCompany = await tenantPrisma.company.findFirst({
          select: { id: true },
          orderBy: { createdAt: 'asc' },
        });
        finalCompanyId = firstCompany?.id;
      }

      // Build date range for the year
      const startDate = dayjs().year(year).startOf('year').toDate();
      const endDate = dayjs().year(year).endOf('year').toDate();
      const today = dayjs();

      // Get all apartments with active/recent contracts
      const apartmentWhere: Prisma.ApartmentWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(propertyId && { propertyId }),
        // Only apartments that have had contracts
        contracts: {
          some: {},
        },
      };

      const apartments = await tenantPrisma.apartment.findMany({
        where: apartmentWhere,
        select: {
          id: true,
          unitNumber: true,
          floor: true,
          property: {
            select: {
              id: true,
              name: true,
            },
          },
          contracts: {
            where: {
              OR: [
                { status: 'active' },
                {
                  AND: [
                    { startDate: { lte: endDate } },
                    { endDate: { gte: startDate } },
                  ],
                },
              ],
            },
            orderBy: { startDate: 'desc' },
            take: 1,
            select: {
              id: true,
              contractNumber: true,
              monthlyRent: true,
              status: true,
              tenantRecord: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  companyName: true,
                  tenantType: true,
                },
              },
            },
          },
        },
        orderBy: [
          { property: { name: 'asc' } },
          { unitNumber: 'asc' },
        ],
      });

      // Get all payments for the year
      const paymentWhere: Prisma.PaymentWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(propertyId && { apartment: { propertyId } }),
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
      };

      const payments = await tenantPrisma.payment.findMany({
        where: paymentWhere,
        select: {
          id: true,
          apartmentId: true,
          contractId: true,
          dueDate: true,
          paidDate: true,
          status: true,
          amount: true,
          totalAmount: true,
          paidAmount: true,
          paymentMethod: true,
        },
      });

      // Build payment lookup map by apartmentId and month
      const paymentMap = new Map<string, Map<number, typeof payments[0]>>();
      for (const payment of payments) {
        const apartmentId = payment.apartmentId;
        const month = dayjs(payment.dueDate).month();

        if (!paymentMap.has(apartmentId)) {
          paymentMap.set(apartmentId, new Map());
        }
        paymentMap.get(apartmentId)!.set(month, payment);
      }

      // Get unique properties for filter dropdown
      const propertySet = new Map<string, string>();
      apartments.forEach(apt => {
        if (apt.property?.id && apt.property?.name) {
          propertySet.set(apt.property.id, apt.property.name);
        }
      });
      const properties = Array.from(propertySet.entries()).map(([id, name]) => ({ id, name }));

      // Build rows
      const rows: MonthlyTrackerRow[] = [];
      let totalPayments = 0;
      let paidPayments = 0;
      let pendingPayments = 0;
      let overduePayments = 0;
      let partialPayments = 0;
      let totalAmount = 0;
      let paidAmount = 0;
      let pendingAmount = 0;
      let overdueAmount = 0;

      for (const apartment of apartments) {
        const contract = apartment.contracts[0];
        const tenant = contract?.tenantRecord;

        const tenantName = tenant
          ? tenant.tenantType === 'company'
            ? tenant.companyName || '-'
            : `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || '-'
          : '-';

        const months: Record<number, MonthPaymentInfo> = {};

        for (let i = 0; i < 12; i++) {
          const payment = paymentMap.get(apartment.id)?.get(i);

          if (payment) {
            const isPastDue = dayjs(payment.dueDate).isBefore(today) && payment.status !== 'paid';
            const isPartial = payment.status === 'partial' ||
              (payment.paidAmount && Number(payment.paidAmount) > 0 && Number(payment.paidAmount) < Number(payment.totalAmount || payment.amount));

            let status: MonthPaymentInfo['status'];
            if (payment.status === 'paid') {
              status = 'paid';
              paidPayments++;
            } else if (isPartial) {
              status = 'partial';
              partialPayments++;
            } else if (isPastDue) {
              status = 'overdue';
              overduePayments++;
            } else {
              status = 'pending';
              pendingPayments++;
            }

            const amount = Number(payment.totalAmount || payment.amount);
            const paid = Number(payment.paidAmount || 0);

            totalPayments++;
            totalAmount += amount;

            if (status === 'paid') {
              paidAmount += amount;
            } else if (status === 'overdue') {
              overdueAmount += amount - paid;
            } else {
              pendingAmount += amount - paid;
            }

            months[i] = {
              status,
              amount,
              paidAmount: paid,
              dueDate: payment.dueDate.toISOString(),
              paidDate: payment.paidDate?.toISOString() || null,
              paymentMethod: payment.paymentMethod,
              paymentId: payment.id,
              contractId: payment.contractId,
            };
          } else {
            months[i] = {
              status: 'none',
              amount: 0,
              paidAmount: 0,
              dueDate: null,
              paidDate: null,
              paymentMethod: null,
              paymentId: null,
              contractId: null,
            };
          }
        }

        rows.push({
          id: apartment.id,
          propertyId: apartment.property?.id || '',
          propertyName: apartment.property?.name || '-',
          apartmentId: apartment.id,
          unitNumber: apartment.unitNumber,
          floor: apartment.floor || '-',
          tenantId: tenant?.id || null,
          tenantName,
          tenantType: tenant?.tenantType as 'individual' | 'company' | null,
          contractId: contract?.id || null,
          contractNumber: contract?.contractNumber || null,
          monthlyRent: Number(contract?.monthlyRent || 0),
          months,
        });
      }

      const summary: MonthlyTrackerSummary = {
        totalPayments,
        paidPayments,
        pendingPayments,
        overduePayments,
        partialPayments,
        totalAmount,
        paidAmount,
        pendingAmount,
        overdueAmount,
        collectionRate: totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0,
      };

      return successResponse({
        rows,
        summary,
        year,
        properties,
      });
    }
  );
}
