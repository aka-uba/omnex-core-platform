import { NextRequest, NextResponse } from 'next/server';
import { getTenantPrismaFromRequest, getTenantFromRequest } from '@/lib/api/tenantContext';
import { getCompanyIdFromRequest } from '@/lib/api/companyContext';

// GET /api/roles - List roles
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10) || 1;
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
    const search = searchParams.get('search') || '';
    const withUsers = searchParams.get('withUsers') === 'true';

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
        { name: { contains: search }, tenantId: tenantContext.id, companyId: companyId },
        { description: { contains: search }, tenantId: tenantContext.id, companyId: companyId },
      ];
    }

    // Get total count
    const total = await tenantPrisma.role.count({ where });

    // Get paginated roles
    const roles = await tenantPrisma.role.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    });

    // Get user counts for each role
    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        // Count users with this role name
        const usersCount = await tenantPrisma.user.count({
          where: { role: role.name },
        });

        // Filter out roles with no users if withUsers is true
        if (withUsers && usersCount === 0) {
          return null;
        }

        return {
          ...role,
          usersCount,
          createdAt: role.createdAt.toISOString(),
          updatedAt: role.updatedAt.toISOString(),
        };
      })
    );

    // Filter out null values
    const filteredRoles = rolesWithCounts.filter((role) => role !== null) as any[];

    return NextResponse.json({
      success: true,
      data: filteredRoles.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description || '',
        permissions: r.permissions || [],
        usersCount: r.usersCount || 0,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      total: withUsers ? filteredRoles.length : total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

// POST /api/roles - Create role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Role name is required' },
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

    // Check if role already exists within this tenant and company
    const existingRole = await tenantPrisma.role.findFirst({
      where: {
        name: body.name,
        tenantId: tenantContext.id,
        companyId: companyId,
      },
    });

    if (existingRole) {
      return NextResponse.json(
        { success: false, error: 'Role with this name already exists' },
        { status: 409 }
      );
    }

    // Create role with tenantId and companyId
    const roleData: any = {
      tenantId: tenantContext.id,
      companyId: companyId,
      name: body.name,
    };

    if (body.description !== undefined && body.description !== null) {
      roleData.description = body.description;
    }
    if (body.permissions !== undefined && body.permissions !== null) {
      roleData.permissions = body.permissions;
    }

    const newRole = await tenantPrisma.role.create({
      data: roleData,
    });

    return NextResponse.json({
      success: true,
      role: {
        ...newRole,
        usersCount: 0,
        createdAt: newRole.createdAt.toISOString(),
        updatedAt: newRole.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create role' },
      { status: 500 }
    );
  }
}




