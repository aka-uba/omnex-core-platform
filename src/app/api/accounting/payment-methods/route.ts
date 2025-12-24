import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest, getTenantPrismaFromRequest } from '@/lib/api/tenantContext';

// GET - List all payment methods
export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant context not found' }, { status: 400 });
    }

    const prisma = await getTenantPrismaFromRequest(request);
    if (!prisma) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const companyId = searchParams.get('companyId');

    const where: any = {
      tenantId: tenant.id,
    };

    if (companyId) {
      where.companyId = companyId;
    }

    if (activeOnly) {
      where.isActive = true;
    }

    const paymentMethods = await prisma.paymentMethodConfig.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({ paymentMethods });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}

// POST - Create new payment method
export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant context not found' }, { status: 400 });
    }

    const prisma = await getTenantPrismaFromRequest(request);
    if (!prisma) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const body = await request.json();

    const {
      companyId,
      name,
      code,
      description,
      icon,
      bankName,
      accountHolder,
      iban,
      swiftCode,
      branchCode,
      accountNumber,
      isDefault,
      sortOrder,
      isActive,
    } = body;

    if (!companyId || !name || !code) {
      return NextResponse.json(
        { error: 'companyId, name and code are required' },
        { status: 400 }
      );
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.paymentMethodConfig.updateMany({
        where: {
          tenantId: tenant.id,
          companyId,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const paymentMethod = await prisma.paymentMethodConfig.create({
      data: {
        tenantId: tenant.id,
        companyId,
        name,
        code,
        description,
        icon,
        bankName,
        accountHolder,
        iban,
        swiftCode,
        branchCode,
        accountNumber,
        isDefault: isDefault || false,
        sortOrder: sortOrder || 0,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({ paymentMethod }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating payment method:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A payment method with this code already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create payment method' },
      { status: 500 }
    );
  }
}
