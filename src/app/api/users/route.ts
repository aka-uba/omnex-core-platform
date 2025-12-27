import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/api/withTenant';
import { successResponse, errorResponse } from '@/lib/api/errorHandler';
import type { ApiResponse } from '@/lib/api/errorHandler';
import { getTenantFromRequest } from '@/lib/api/tenantContext';

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

// Helper function to sanitize user name for folder
function sanitizeUserNameForFolder(name: string): string {
  return name
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ş/g, 'S')
    .replace(/İ/g, 'I')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Helper function to save uploaded file to tenant's user directory
// Files are saved to /storage/tenants/{tenantSlug}/users/{username}/{subFolder}/
async function saveUserFile(
  file: File,
  userName: string,
  subFolder: string,
  tenantSlug: string
): Promise<string> {
  const { writeFile, mkdir } = await import('fs/promises');
  const { join } = await import('path');
  const { existsSync } = await import('fs');

  const sanitizedUserName = sanitizeUserNameForFolder(userName);
  // Save to tenant storage directory so file manager can access it
  const userDir = join(process.cwd(), 'storage', 'tenants', tenantSlug, 'users', sanitizedUserName);

  if (!existsSync(userDir)) {
    await mkdir(userDir, { recursive: true });
  }

  const targetDir = join(userDir, subFolder);
  if (!existsSync(targetDir)) {
    await mkdir(targetDir, { recursive: true });
  }

  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${Date.now()}-${sanitizedFileName}`;
  const filePath = join(targetDir, fileName);
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(filePath, buffer);

  // Return path relative to storage for file manager access
  return `/storage/tenants/${tenantSlug}/users/${sanitizedUserName}/${subFolder}/${fileName}`;
}

// POST /api/users - Create user
export async function POST(request: NextRequest) {
  return withTenant<ApiResponse<{ user: unknown }>>(
    request,
    async (tenantPrisma) => {
      // Get tenant context for file storage
      const tenant = await getTenantFromRequest(request);
      if (!tenant) {
        return errorResponse('Tenant context required', 'Tenant not found', 400);
      }

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

      // Handle file uploads to tenant's user directory
      let profilePictureUrl: string | null = null;
      let passportUrl: string | null = null;
      let idCardUrl: string | null = null;
      let contractUrl: string | null = null;
      let cvUrl: string | null = null;

      // Profile picture
      const profilePictureFile = formData.get('profilePictureFile') as File | null;
      if (profilePictureFile && profilePictureFile instanceof File && profilePictureFile.size > 0) {
        profilePictureUrl = await saveUserFile(profilePictureFile, fullName, 'profile', tenant.slug);
      } else {
        profilePictureUrl = formData.get('profilePicture') as string | null;
      }

      // Passport
      const passportFile = formData.get('passportFile') as File | null;
      if (passportFile && passportFile instanceof File && passportFile.size > 0) {
        passportUrl = await saveUserFile(passportFile, fullName, 'documents', tenant.slug);
      } else {
        passportUrl = formData.get('passport') as string | null;
      }

      // ID Card
      const idCardFile = formData.get('idCardFile') as File | null;
      if (idCardFile && idCardFile instanceof File && idCardFile.size > 0) {
        idCardUrl = await saveUserFile(idCardFile, fullName, 'documents', tenant.slug);
      } else {
        idCardUrl = formData.get('idCard') as string | null;
      }

      // Contract
      const contractFile = formData.get('contractFile') as File | null;
      if (contractFile && contractFile instanceof File && contractFile.size > 0) {
        contractUrl = await saveUserFile(contractFile, fullName, 'documents', tenant.slug);
      } else {
        contractUrl = formData.get('contract') as string | null;
      }

      // CV
      const cvFile = formData.get('cvFile') as File | null;
      if (cvFile && cvFile instanceof File && cvFile.size > 0) {
        cvUrl = await saveUserFile(cvFile, fullName, 'documents', tenant.slug);
      } else {
        cvUrl = formData.get('cv') as string | null;
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
        profilePicture: profilePictureUrl || null,
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

