import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { invoiceCreateSchema } from '@/modules/accounting/schemas/subscription.schema';
import { getTenantFromRequest } from '@/lib/api/tenantContext';
import { Prisma } from '@prisma/tenant-client';
import { getAuditContext, logCreate } from '@/lib/api/auditHelper';
// Generate invoice number
function generateInvoiceNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${timestamp}-${random}`;
}

// GET /api/accounting/invoices - List invoices
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ invoices: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {
      const searchParams = request.nextUrl.searchParams;
      
      // Parse query parameters
      const page = parseInt(searchParams.get('page') || '1', 10) || 1;
      const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
      const search = searchParams.get('search') || undefined;
      const subscriptionId = searchParams.get('subscriptionId') || undefined;
      const customerId = searchParams.get('customerId') || undefined;
      const supplierId = searchParams.get('supplierId') || undefined;
      const status = searchParams.get('status') || undefined;
      const startDate = searchParams.get('startDate') || undefined;
      const endDate = searchParams.get('endDate') || undefined;
      const isActive = searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined;
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

      // Build where clause
      const where: Prisma.InvoiceWhereInput = {
        tenantId: tenantContext.id,
        ...(finalCompanyId && { companyId: finalCompanyId }),
        ...(search && {
          OR: [
            { invoiceNumber: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(subscriptionId && { subscriptionId }),
        ...(customerId && { customerId }),
        ...(supplierId && { supplierId }),
        ...(status && { status }),
        ...(startDate && endDate && {
          invoiceDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
        ...(startDate && !endDate && {
          invoiceDate: {
            gte: new Date(startDate),
          },
        }),
        ...(endDate && !startDate && {
          invoiceDate: {
            lte: new Date(endDate),
          },
        }),
        ...(isActive !== undefined && { isActive }),
      };

      // Get total count
      const total = await tenantPrisma.invoice.count({ where });

      // Get paginated invoices
      const invoices = await tenantPrisma.invoice.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { invoiceDate: 'desc' },
        include: {
          subscription: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          _count: {
            select: {
              payments: true,
            },
          },
        },
      });

      return successResponse({
        invoices: invoices.map(invoice => ({
          ...invoice,
          subtotal: Number(invoice.subtotal),
          taxRate: invoice.taxRate ? Number(invoice.taxRate) : null,
          taxAmount: invoice.taxAmount ? Number(invoice.taxAmount) : null,
          totalAmount: Number(invoice.totalAmount),
          invoiceDate: invoice.invoiceDate.toISOString(),
          dueDate: invoice.dueDate.toISOString(),
          paidDate: invoice.paidDate?.toISOString() || null,
          createdAt: invoice.createdAt.toISOString(),
          updatedAt: invoice.updatedAt.toISOString(),
        })),
        total,
        page,
        pageSize,
      });
    },
    { required: true, module: 'accounting' }
  );
}

// POST /api/accounting/invoices - Create invoice
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ invoice: unknown }>>(
    request,
    async (tenantPrisma) => {
      const body = await request.json();

      // Validate request body
      const validatedData = invoiceCreateSchema.parse(body);

      // Get tenant context
      const tenantContext = await getTenantFromRequest(request);
      if (!tenantContext) {
        return errorResponse('Tenant context required', 'Tenant context could not be determined', 400);
      }

      // Get companyId from first company
      const firstCompany = await tenantPrisma.company.findFirst({
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });

      if (!firstCompany) {
        return errorResponse('Validation error', 'No company found for tenant', 404);
      }

      const companyId = firstCompany.id;

      // Generate invoice number if not provided
      const invoiceNumber = validatedData.invoiceNumber || generateInvoiceNumber();

      // Check if invoice number is unique
      const existingInvoice = await tenantPrisma.invoice.findFirst({
        where: {
          tenantId: tenantContext.id,
          invoiceNumber,
        },
      });

      if (existingInvoice) {
        return errorResponse('Validation error', 'Invoice number already exists', 409);
      }

      // Create invoice
      const newInvoice = await tenantPrisma.invoice.create({
        data: {
          tenantId: tenantContext.id,
          companyId: companyId,
          subscriptionId: validatedData.subscriptionId || null,
          invoiceNumber,
          invoiceDate: new Date(validatedData.invoiceDate),
          dueDate: new Date(validatedData.dueDate),
          customerId: validatedData.customerId || null,
          supplierId: validatedData.supplierId || null,
          subtotal: validatedData.subtotal,
          taxRate: validatedData.taxRate || null,
          taxAmount: validatedData.taxAmount || null,
          totalAmount: validatedData.totalAmount,
          currency: validatedData.currency || 'TRY',
          status: 'draft',
          description: validatedData.description || null,
          items: validatedData.items ? (validatedData.items as Prisma.InputJsonValue) : Prisma.JsonNull,
          documents: validatedData.documents || [],
          isActive: true,
        },
        include: {
          subscription: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          _count: {
            select: {
              payments: true,
            },
          },
        },
      });

      // Log audit event
      const auditContext = await getAuditContext(request);
      logCreate(tenantContext, auditContext, 'Invoice', newInvoice.id, companyId, {
        invoiceNumber: newInvoice.invoiceNumber,
        status: newInvoice.status,
      });

      return successResponse({
        invoice: {
          ...newInvoice,
          subtotal: Number(newInvoice.subtotal),
          taxRate: newInvoice.taxRate ? Number(newInvoice.taxRate) : null,
          taxAmount: newInvoice.taxAmount ? Number(newInvoice.taxAmount) : null,
          totalAmount: Number(newInvoice.totalAmount),
          invoiceDate: newInvoice.invoiceDate.toISOString(),
          dueDate: newInvoice.dueDate.toISOString(),
          paidDate: newInvoice.paidDate?.toISOString() || null,
          createdAt: newInvoice.createdAt.toISOString(),
          updatedAt: newInvoice.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'accounting' }
  );
}

