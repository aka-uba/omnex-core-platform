import { NextRequest, NextResponse } from 'next/server';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';
import { getAuditContext, logCreate } from '@/lib/api/auditHelper';

// GET /api/permissions - List permissions
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10) || 1;
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const module = searchParams.get('module');

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

    // Build where clause with tenant and company isolation
    const where: any = {
      tenantId: tenantContext.id,
      companyId: companyId,
    };

    if (search) {
      where.OR = [
        { permissionName: { contains: search }, tenantId: tenantContext.id, companyId: companyId },
        { permissionKey: { contains: search }, tenantId: tenantContext.id, companyId: companyId },
        { description: { contains: search }, tenantId: tenantContext.id, companyId: companyId },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (module) {
      where.module = module;
    }

    // Get total count
    const total = await tenantPrisma.permissionDefinition.count({ where });

    // Get paginated permissions
    const permissions = await tenantPrisma.permissionDefinition.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      permissions: permissions.map(permission => ({
        id: permission.id,
        permissionKey: permission.permissionKey,
        name: permission.permissionName,
        description: permission.description,
        category: permission.category,
        module: permission.module,
        createdAt: permission.createdAt.toISOString(),
        updatedAt: permission.updatedAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

// POST /api/permissions - Create permission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.permissionKey || !body.name) {
      return NextResponse.json(
        { success: false, error: 'Permission key and name are required' },
        { status: 400 }
      );
    }

    const tenantPrisma = await getTenantPrismaFromRequest(request);
    if (!tenantPrisma) {
      return NextResponse.json(
        { success: false, error: 'Tenant context is required' },
        { status: 400 }
      );
    }

    // Check if permission already exists
    const existingPermission = await tenantPrisma.permissionDefinition.findUnique({
      where: { permissionKey: body.permissionKey },
    });

    if (existingPermission) {
      return NextResponse.json(
        { success: false, error: 'Permission with this key already exists' },
        { status: 409 }
      );
    }

    // Get tenantId and companyId
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

    // Create permission
    const permissionData: any = {
      tenantId: tenantContext.id,
      companyId,
      permissionKey: body.permissionKey,
      permissionName: body.name,
    };
    
    if (body.description !== undefined && body.description !== null) {
      permissionData.description = body.description;
    }
    if (body.category !== undefined && body.category !== null) {
      permissionData.category = body.category;
    }
    if (body.module !== undefined && body.module !== null) {
      permissionData.module = body.module;
    }

    const newPermission = await tenantPrisma.permissionDefinition.create({
      data: permissionData,
    });

    // Log audit event
    const auditContext = await getAuditContext(request);
    logCreate(tenantContext, auditContext, 'Permission', newPermission.id, companyId, {
      permissionKey: newPermission.permissionKey,
      name: newPermission.permissionName,
      category: newPermission.category,
    });

    return NextResponse.json({
      success: true,
      permission: {
        id: newPermission.id,
        permissionKey: newPermission.permissionKey,
        name: newPermission.permissionName,
        description: newPermission.description,
        category: newPermission.category,
        module: newPermission.module,
        createdAt: newPermission.createdAt.toISOString(),
        updatedAt: newPermission.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating permission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create permission' },
      { status: 500 }
    );
  }
}




