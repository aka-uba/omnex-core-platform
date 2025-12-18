import { NextRequest, NextResponse } from 'next/server';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';

// GET /api/roles/[id] - Get single role
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tenantPrisma = await getTenantPrismaFromRequest(request);
    if (!tenantPrisma) {
      return NextResponse.json(
        { success: false, error: 'Tenant context is required' },
        { status: 400 }
      );
    }

    // Get tenantId and companyId for data isolation
    const tenantContext = await getTenantFromRequest(request);
    if (!tenantContext) {
      return NextResponse.json(
        { success: false, error: 'Tenant context is required' },
        { status: 400 }
      );
    }

    const companyId = await getCompanyIdFromRequest(request, tenantPrisma);
    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Get role with tenant and company isolation
    const role = await tenantPrisma.role.findFirst({
      where: {
        id,
        tenantId: tenantContext.id,
        companyId: companyId,
      },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    // Get user count for this role
    const usersCount = await tenantPrisma.user.count({
      where: { role: role.name },
    });

    return NextResponse.json({
      success: true,
      role: {
        id: role.id,
        name: role.name,
        description: role.description || '',
        permissions: role.permissions || [],
        usersCount,
        createdAt: role.createdAt.toISOString(),
        updatedAt: role.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch role' },
      { status: 500 }
    );
  }
}

// PATCH /api/roles/[id] - Update role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const tenantPrisma = await getTenantPrismaFromRequest(request);
    if (!tenantPrisma) {
      return NextResponse.json(
        { success: false, error: 'Tenant context is required' },
        { status: 400 }
      );
    }

    // Get tenantId and companyId for data isolation
    const tenantContext = await getTenantFromRequest(request);
    if (!tenantContext) {
      return NextResponse.json(
        { success: false, error: 'Tenant context is required' },
        { status: 400 }
      );
    }

    const companyId = await getCompanyIdFromRequest(request, tenantPrisma);
    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Verify role exists and belongs to this tenant/company
    const existingRole = await tenantPrisma.role.findFirst({
      where: {
        id,
        tenantId: tenantContext.id,
        companyId: companyId,
      },
    });

    if (!existingRole) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    // If name is being changed, check for duplicates
    if (body.name && body.name !== existingRole.name) {
      const duplicateRole = await tenantPrisma.role.findFirst({
        where: {
          name: body.name,
          tenantId: tenantContext.id,
          companyId: companyId,
          NOT: { id },
        },
      });

      if (duplicateRole) {
        return NextResponse.json(
          { success: false, error: 'Role with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.permissions !== undefined) updateData.permissions = body.permissions;

    const updatedRole = await tenantPrisma.role.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      role: {
        id: updatedRole.id,
        name: updatedRole.name,
        description: updatedRole.description || '',
        permissions: updatedRole.permissions || [],
        createdAt: updatedRole.createdAt.toISOString(),
        updatedAt: updatedRole.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update role' },
      { status: 500 }
    );
  }
}

// DELETE /api/roles/[id] - Delete role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tenantPrisma = await getTenantPrismaFromRequest(request);
    if (!tenantPrisma) {
      return NextResponse.json(
        { success: false, error: 'Tenant context is required' },
        { status: 400 }
      );
    }

    // Get tenantId and companyId for data isolation
    const tenantContext = await getTenantFromRequest(request);
    if (!tenantContext) {
      return NextResponse.json(
        { success: false, error: 'Tenant context is required' },
        { status: 400 }
      );
    }

    const companyId = await getCompanyIdFromRequest(request, tenantPrisma);
    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Verify role exists and belongs to this tenant/company
    const existingRole = await tenantPrisma.role.findFirst({
      where: {
        id,
        tenantId: tenantContext.id,
        companyId: companyId,
      },
    });

    if (!existingRole) {
      return NextResponse.json(
        { success: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if any users are using this role
    const usersWithRole = await tenantPrisma.user.count({
      where: { role: existingRole.name },
    });

    if (usersWithRole > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete role. ${usersWithRole} user(s) are assigned to this role.` },
        { status: 409 }
      );
    }

    await tenantPrisma.role.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete role' },
      { status: 500 }
    );
  }
}
