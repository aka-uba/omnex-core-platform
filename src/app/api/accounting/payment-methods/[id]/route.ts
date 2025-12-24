import { NextRequest, NextResponse } from 'next/server';
import { getTenantFromRequest, getTenantPrismaFromRequest } from '@/lib/api/tenantContext';

// GET - Get single payment method
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant context not found' }, { status: 400 });
    }

    const prisma = await getTenantPrismaFromRequest(request);
    if (!prisma) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const paymentMethod = await prisma.paymentMethodConfig.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    return NextResponse.json({ paymentMethod });
  } catch (error) {
    console.error('Error fetching payment method:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment method' },
      { status: 500 }
    );
  }
}

// PUT - Update payment method
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant context not found' }, { status: 400 });
    }

    const prisma = await getTenantPrismaFromRequest(request);
    if (!prisma) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const body = await request.json();

    // Check if exists
    const existing = await prisma.paymentMethodConfig.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    const {
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

    // If this is set as default, unset other defaults
    if (isDefault && !existing.isDefault) {
      await prisma.paymentMethodConfig.updateMany({
        where: {
          tenantId: tenant.id,
          companyId: existing.companyId,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    const paymentMethod = await prisma.paymentMethodConfig.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(bankName !== undefined && { bankName }),
        ...(accountHolder !== undefined && { accountHolder }),
        ...(iban !== undefined && { iban }),
        ...(swiftCode !== undefined && { swiftCode }),
        ...(branchCode !== undefined && { branchCode }),
        ...(accountNumber !== undefined && { accountNumber }),
        ...(isDefault !== undefined && { isDefault }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ paymentMethod });
  } catch (error: any) {
    console.error('Error updating payment method:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A payment method with this code already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    );
  }
}

// DELETE - Delete payment method
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant context not found' }, { status: 400 });
    }

    const prisma = await getTenantPrismaFromRequest(request);
    if (!prisma) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Check if exists
    const existing = await prisma.paymentMethodConfig.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    await prisma.paymentMethodConfig.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json(
      { error: 'Failed to delete payment method' },
      { status: 500 }
    );
  }
}
