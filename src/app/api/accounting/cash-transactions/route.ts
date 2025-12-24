import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';

// Unified transaction interface for all sources
interface UnifiedTransaction {
  id: string;
  source: 'payment' | 'expense' | 'invoice' | 'property_expense' | 'manual';
  type: 'income' | 'expense';
  category: string;
  amount: number;
  currency: string;
  transactionDate: string;
  paymentMethod: string | null;
  description: string | null;
  reference: string | null;
  status: string;
  // Related entity info
  relatedEntity?: {
    type: string;
    id: string;
    name?: string;
  };
}

interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: Record<string, { income: number; expense: number }>;
  bySource: Record<string, { income: number; expense: number; count: number }>;
}

// GET /api/accounting/cash-transactions - Aggregate all income/expenses from all modules
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ transactions: UnifiedTransaction[]; total: number; page: number; pageSize: number; summary: TransactionSummary }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;

      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '25', 10) || 25;
      const search = searchParams.get('search') || undefined;
      const type = searchParams.get('type') || undefined; // 'income' | 'expense'
      const category = searchParams.get('category') || undefined;
      const source = searchParams.get('source') || undefined; // 'payment' | 'expense' | 'invoice' | 'property_expense'
      const startDate = searchParams.get('startDate') || undefined;
      const endDate = searchParams.get('endDate') || undefined;
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

      const allTransactions: UnifiedTransaction[] = [];

      // Date filter helper
      const dateFilter = (dateField: Date) => {
        if (startDate && endDate) {
          return dateField >= new Date(startDate) && dateField <= new Date(endDate);
        }
        if (startDate) {
          return dateField >= new Date(startDate);
        }
        if (endDate) {
          return dateField <= new Date(endDate);
        }
        return true;
      };

      // 1. Fetch INCOME from Payments (Real Estate module - paid rents)
      if (!source || source === 'payment') {
        if (!type || type === 'income') {
          const payments = await tenantPrisma.payment.findMany({
            where: {
              tenantId: tenantContext.id,
              ...(finalCompanyId && { companyId: finalCompanyId }),
              status: 'paid', // Only paid payments are income
            },
            include: {
              apartment: {
                select: { unitNumber: true, property: { select: { name: true } } },
              },
              tenantRecord: {
                select: { firstName: true, lastName: true, companyName: true },
              },
            },
            orderBy: { paidDate: 'desc' },
          });

          for (const payment of payments) {
            if (!payment.paidDate) continue;
            if (!dateFilter(payment.paidDate)) continue;

            const tenantName = payment.tenantRecord
              ? payment.tenantRecord.companyName || `${payment.tenantRecord.firstName || ''} ${payment.tenantRecord.lastName || ''}`.trim()
              : 'Bilinmiyor';

            const propertyInfo = payment.apartment?.property?.name
              ? `${payment.apartment.property.name} - ${payment.apartment.unitNumber}`
              : payment.apartment?.unitNumber || '';

            allTransactions.push({
              id: `payment_${payment.id}`,
              source: 'payment',
              type: 'income',
              category: payment.type, // rent, deposit, fee, maintenance, utility
              amount: Number(payment.totalAmount || payment.amount),
              currency: payment.currency,
              transactionDate: payment.paidDate.toISOString(),
              paymentMethod: payment.paymentMethod,
              description: `${propertyInfo} - ${tenantName}`,
              reference: payment.receiptNumber,
              status: 'completed',
              relatedEntity: {
                type: 'payment',
                id: payment.id,
                name: propertyInfo,
              },
            });
          }
        }
      }

      // 2. Fetch EXPENSE from Expense table (Accounting module)
      if (!source || source === 'expense') {
        if (!type || type === 'expense') {
          const expenses = await tenantPrisma.expense.findMany({
            where: {
              tenantId: tenantContext.id,
              ...(finalCompanyId && { companyId: finalCompanyId }),
              status: 'approved', // Only approved expenses
              isActive: true,
            },
            orderBy: { expenseDate: 'desc' },
          });

          for (const expense of expenses) {
            if (!dateFilter(expense.expenseDate)) continue;

            allTransactions.push({
              id: `expense_${expense.id}`,
              source: 'expense',
              type: 'expense',
              category: expense.category,
              amount: Number(expense.amount),
              currency: expense.currency,
              transactionDate: expense.expenseDate.toISOString(),
              paymentMethod: null,
              description: expense.name,
              reference: expense.description,
              status: 'completed',
              relatedEntity: {
                type: 'expense',
                id: expense.id,
                name: expense.name,
              },
            });
          }
        }
      }

      // 3. Fetch INCOME from paid Invoices (Accounting module)
      if (!source || source === 'invoice') {
        if (!type || type === 'income') {
          const paidInvoices = await tenantPrisma.invoice.findMany({
            where: {
              tenantId: tenantContext.id,
              ...(finalCompanyId && { companyId: finalCompanyId }),
              status: 'paid',
            },
            orderBy: { paidDate: 'desc' },
          });

          for (const invoice of paidInvoices) {
            if (!invoice.paidDate) continue;
            if (!dateFilter(invoice.paidDate)) continue;

            allTransactions.push({
              id: `invoice_${invoice.id}`,
              source: 'invoice',
              type: 'income',
              category: 'invoice',
              amount: Number(invoice.totalAmount),
              currency: invoice.currency,
              transactionDate: invoice.paidDate.toISOString(),
              paymentMethod: invoice.paymentMethod,
              description: `Fatura #${invoice.invoiceNumber}`,
              reference: invoice.invoiceNumber,
              status: 'completed',
              relatedEntity: {
                type: 'invoice',
                id: invoice.id,
                name: invoice.invoiceNumber,
              },
            });
          }
        }
      }

      // 4. Fetch EXPENSE from PropertyExpense (Real Estate module)
      if (!source || source === 'property_expense') {
        if (!type || type === 'expense') {
          const propertyExpenses = await tenantPrisma.propertyExpense.findMany({
            where: {
              tenantId: tenantContext.id,
              ...(finalCompanyId && { companyId: finalCompanyId }),
              isActive: true,
            },
            include: {
              property: { select: { name: true } },
            },
            orderBy: { expenseDate: 'desc' },
          });

          for (const propExp of propertyExpenses) {
            if (!dateFilter(propExp.expenseDate)) continue;

            allTransactions.push({
              id: `property_expense_${propExp.id}`,
              source: 'property_expense',
              type: 'expense',
              category: propExp.category,
              amount: Number(propExp.amount),
              currency: 'TRY',
              transactionDate: propExp.expenseDate.toISOString(),
              paymentMethod: null,
              description: `${propExp.property?.name || 'Gayrimenkul'} - ${propExp.name}`,
              reference: propExp.invoiceNumber,
              status: 'completed',
              relatedEntity: {
                type: 'property_expense',
                id: propExp.id,
                name: propExp.name,
              },
            });
          }
        }
      }

      // 5. Fetch manual CashTransactions (if any exist)
      if (!source || source === 'manual') {
        const manualTransactions = await tenantPrisma.cashTransaction.findMany({
          where: {
            tenantId: tenantContext.id,
            ...(finalCompanyId && { companyId: finalCompanyId }),
            status: 'completed',
          },
          orderBy: { transactionDate: 'desc' },
        });

        for (const tx of manualTransactions) {
          if (!dateFilter(tx.transactionDate)) continue;
          if (type && tx.type !== type) continue;

          allTransactions.push({
            id: `manual_${tx.id}`,
            source: 'manual',
            type: tx.type as 'income' | 'expense',
            category: tx.category,
            amount: Number(tx.amount),
            currency: tx.currency,
            transactionDate: tx.transactionDate.toISOString(),
            paymentMethod: tx.paymentMethod,
            description: tx.description,
            reference: tx.reference,
            status: tx.status,
          });
        }
      }

      // Apply search filter
      let filteredTransactions = allTransactions;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredTransactions = allTransactions.filter(tx =>
          tx.description?.toLowerCase().includes(searchLower) ||
          tx.reference?.toLowerCase().includes(searchLower) ||
          tx.category.toLowerCase().includes(searchLower)
        );
      }

      // Apply category filter
      if (category) {
        filteredTransactions = filteredTransactions.filter(tx => tx.category === category);
      }

      // Sort by date descending
      filteredTransactions.sort((a, b) =>
        new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      );

      // Calculate summary
      const summary: TransactionSummary = {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        byCategory: {},
        bySource: {},
      };

      for (const tx of filteredTransactions) {
        if (tx.type === 'income') {
          summary.totalIncome += tx.amount;
        } else {
          summary.totalExpense += tx.amount;
        }

        // By category
        if (!summary.byCategory[tx.category]) {
          summary.byCategory[tx.category] = { income: 0, expense: 0 };
        }
        const categoryEntry = summary.byCategory[tx.category];
        if (categoryEntry) {
          if (tx.type === 'income') {
            categoryEntry.income += tx.amount;
          } else {
            categoryEntry.expense += tx.amount;
          }
        }

        // By source
        if (!summary.bySource[tx.source]) {
          summary.bySource[tx.source] = { income: 0, expense: 0, count: 0 };
        }
        const sourceEntry = summary.bySource[tx.source];
        if (sourceEntry) {
          sourceEntry.count += 1;
          if (tx.type === 'income') {
            sourceEntry.income += tx.amount;
          } else {
            sourceEntry.expense += tx.amount;
          }
        }
      }

      summary.balance = summary.totalIncome - summary.totalExpense;

      // Pagination
      const total = filteredTransactions.length;
      const paginatedTransactions = filteredTransactions.slice(
        (page - 1) * pageSize,
        page * pageSize
      );

      return successResponse({
        transactions: paginatedTransactions,
        total,
        page,
        pageSize,
        summary,
      });
    },
    { required: true, module: 'accounting' }
  );
}

// POST is kept for manual entries if needed
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ transaction: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get companyId from body or first company
      let companyId = body.companyId;
      if (!companyId) {
        const firstCompany = await tenantPrisma.company.findFirst({
          select: { id: true },
          orderBy: { createdAt: 'asc' },
        });

        if (!firstCompany) {
          return errorResponse('Validation error', 'No company found for tenant', 404);
        }
        companyId = firstCompany.id;
      }

      // Create manual cash transaction
      const newTransaction = await tenantPrisma.cashTransaction.create({
        data: {
          tenantId: tenantContext.id,
          companyId: companyId,
          type: body.type,
          category: body.category,
          amount: body.amount,
          currency: body.currency || 'TRY',
          transactionDate: new Date(body.transactionDate),
          paymentMethod: body.paymentMethod,
          paymentId: body.paymentId || null,
          expenseId: body.expenseId || null,
          invoiceId: body.invoiceId || null,
          description: body.description || null,
          reference: body.reference || null,
          notes: body.notes || null,
          status: body.status || 'completed',
        },
      });

      return successResponse({
        transaction: {
          ...newTransaction,
          amount: Number(newTransaction.amount),
          transactionDate: newTransaction.transactionDate.toISOString(),
          createdAt: newTransaction.createdAt.toISOString(),
          updatedAt: newTransaction.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'accounting' }
  );
}
