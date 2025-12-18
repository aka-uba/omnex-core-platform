import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';

// GET /api/users - List users
export async function GET(request: NextRequest) {
  return withTenant<ApiResponse<{ users: unknown[]; total: number; page: number; pageSize: number }>>(
    request,
    async (tenantPrisma) => {

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10) || 1;
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10) || 10;
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const status = searchParams.get('status');

      // Build where clause
      const where: {
        OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; email?: { contains: string; mode: 'insensitive' } }>;
        role?: string;
        status?: string;
      } = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (role) {
      where.role = role;
    }
    
    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await tenantPrisma.user.count({ where });

    // Get paginated users
    const users = await tenantPrisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        profilePicture: true,
        lastActive: true,
        createdAt: true,
        updatedAt: true,
        phone: true,
        department: true,
        position: true,
      },
    });

      return successResponse({
        users: users.map(user => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
          lastActive: user.lastActive?.toISOString() || null,
        })),
        total,
        page,
        pageSize,
      });
    },
    { required: true, module: 'users' }
  );
}

// POST /api/users - Create user
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ user: unknown }>>(
    request,
    async (tenantPrisma) => {

    const formData = await request.formData();

    // Extract form data
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string | null;
    const password = formData.get('password') as string | null;
    const role = (formData.get('role') as string) || 'ClientUser';
    const department = formData.get('department') as string | null;
    const position = formData.get('position') as string | null;
    const employeeId = formData.get('employeeId') as string | null;
    const hireDate = formData.get('hireDate') as string | null;
    
    // Contact information
    const address = formData.get('address') as string | null;
    const city = formData.get('city') as string | null;
    const country = formData.get('country') as string | null;
    const postalCode = formData.get('postalCode') as string | null;
    const emergencyContact = formData.get('emergencyContact') as string | null;
    const emergencyPhone = formData.get('emergencyPhone') as string | null;
    
    // Documents
    const profilePicture = formData.get('profilePicture') as string | null;
    const passportUrl = formData.get('passport') as string | null;
    const idCardUrl = formData.get('idCard') as string | null;
    const contractUrl = formData.get('contract') as string | null;
    const cvUrl = formData.get('cv') as string | null;
    
    // Preferences
    const defaultLanguage = formData.get('defaultLanguage') as string | null;
    const defaultTheme = formData.get('defaultTheme') as string | null;
    const defaultLayout = formData.get('defaultLayout') as string | null;

      // Validate required fields
      if (!fullName || !email) {
        return errorResponse('Validation error', 'Name and email are required', 400);
      }

      // Check if user already exists
      const existingUser = await tenantPrisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return errorResponse('Conflict', 'User with this email already exists', 409);
      }

      // Hash password if provided
      let hashedPassword: string | null = null;
      if (password && password.trim().length > 0) {
        try {
          const { hashPassword } = await import('@/lib/utils/password');
          hashedPassword = await hashPassword(password);
        } catch (passwordError) {
          return errorResponse(
            'Validation error',
            'Password must be at least 8 characters long',
            400
          );
        }
      }

      // Create user
      const newUser = await tenantPrisma.user.create({
        data: {
          name: fullName,
          email,
          phone: phone || null,
          password: hashedPassword,
        role: role,
        status: 'pending',
        department: department || null,
        position: position || null,
        employeeId: employeeId || null,
        hireDate: hireDate ? new Date(hireDate) : null,
        address: address || null,
        city: city || null,
        country: country || null,
        postalCode: postalCode || null,
        emergencyContact: emergencyContact || null,
        emergencyPhone: emergencyPhone || null,
        profilePicture: profilePicture || null,
        passportUrl: passportUrl || null,
        idCardUrl: idCardUrl || null,
        contractUrl: contractUrl || null,
        cvUrl: cvUrl || null,
        defaultLanguage: defaultLanguage || 'tr',
        defaultTheme: defaultTheme || 'auto',
        defaultLayout: defaultLayout || 'sidebar',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

      return successResponse({
        user: {
          ...newUser,
          createdAt: newUser.createdAt.toISOString(),
          updatedAt: newUser.updatedAt.toISOString(),
        },
      });
    },
    { required: true, module: 'users' }
  );
}

