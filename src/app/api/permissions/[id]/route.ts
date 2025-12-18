import { NextRequest, NextResponse } from 'next/server';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';

// GET /api/permissions/[id] - Get single permission
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

    // Get permission with tenant and company isolation
    const permission = await tenantPrisma.permissionDefinition.findFirst({
      where: {
        id,
        tenantId: tenantContext.id,
        companyId: companyId,
      },
    });

    if (!permission) {
      return NextResponse.json(
        { success: false, error: 'Permission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      permission: {
        id: permission.id,
        permissionKey: permission.permissionKey,
        name: permission.permissionName,
        description: permission.description || '',
        category: permission.category || '',
        module: permission.module || '',
        createdAt: permission.createdAt.toISOString(),
        updatedAt: permission.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching permission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch permission' },
      { status: 500 }
    );
  }
}

// PATCH /api/permissions/[id] - Update permission
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

    // Verify permission exists and belongs to this tenant/company
    const existingPermission = await tenantPrisma.permissionDefinition.findFirst({
      where: {
        id,
        tenantId: tenantContext.id,
        companyId: companyId,
      },
    });

    if (!existingPermission) {
      return NextResponse.json(
        { success: false, error: 'Permission not found' },
        { status: 404 }
      );
    }

    // If permissionKey is being changed, check for duplicates
    if (body.permissionKey && body.permissionKey !== existingPermission.permissionKey) {
      const duplicatePermission = await tenantPrisma.permissionDefinition.findFirst({
        where: {
          permissionKey: body.permissionKey,
          tenantId: tenantContext.id,
          companyId: companyId,
          NOT: { id },
        },
      });

      if (duplicatePermission) {
        return NextResponse.json(
          { success: false, error: 'Permission with this key already exists' },
          { status: 409 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (body.permissionKey !== undefined) updateData.permissionKey = body.permissionKey;
    if (body.name !== undefined) updateData.permissionName = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.module !== undefined) updateData.module = body.module;

    const updatedPermission = await tenantPrisma.permissionDefinition.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      permission: {
        id: updatedPermission.id,
        permissionKey: updatedPermission.permissionKey,
        name: updatedPermission.permissionName,
        description: updatedPermission.description || '',
        category: updatedPermission.category || '',
        module: updatedPermission.module || '',
        createdAt: updatedPermission.createdAt.toISOString(),
        updatedAt: updatedPermission.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating permission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update permission' },
      { status: 500 }
    );
  }
}

// DELETE /api/permissions/[id] - Delete permission
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

    // Verify permission exists and belongs to this tenant/company
    const existingPermission = await tenantPrisma.permissionDefinition.findFirst({
      where: {
        id,
        tenantId: tenantContext.id,
        companyId: companyId,
      },
    });

    if (!existingPermission) {
      return NextResponse.json(
        { success: false, error: 'Permission not found' },
        { status: 404 }
      );
    }

    // Check if any user permissions are using this permission key
    const usersWithPermission = await tenantPrisma.userPermission.count({
      where: { permissionKey: existingPermission.permissionKey },
    });

    if (usersWithPermission > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete permission. ${usersWithPermission} user(s) have this permission assigned.` },
        { status: 409 }
      );
    }

    await tenantPrisma.permissionDefinition.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Permission deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting permission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete permission' },
      { status: 500 }
    );
  }
}
